#!/usr/bin/env python3
"""
SQLite AI Agent using Raw Google GenAI SDK (google-genai)
---------------------------------------------------------
Features:
1. Connects to any SQLite database.
2. Extracts live schema (tables, columns, types, foreign keys, row counts).
3. Generates syntactically correct SQLite query from natural language.
4. Robust Safety Guardrails:
   - Enforces read-only operations (Blocks DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, etc.)
   - Disallows multi-statement query injection (semicolons with secondary commands)
   - Enforces execution in read-only transaction / sandbox with automatic LIMIT injection
5. Executes query against SQLite safely.
6. Formats query results into a high-impact, human-readable Business Executive Summary.
"""

import os
import sys
import re
import sqlite3
import argparse
from typing import Dict, Any, List, Tuple
from google import genai
from google.genai import types

# Optional pretty table printing
try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False


class SQLiteSafetyGuardrail:
    """Validates and enforces strict read-only safety on generated SQL queries."""

    FORBIDDEN_KEYWORDS = [
        r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
        r"\bALTER\b", r"\bTRUNCATE\b", r"\bREPLACE\b", r"\bCREATE\b",
        r"\bATTACH\b", r"\bDETACH\b", r"\bVACUUM\b", r"\bREINDEX\b",
        r"\bPRAGMA\s+writable_schema\b", r"\bGRANT\b", r"\bREVOKE\b"
    ]

    @classmethod
    def sanitize_sql(cls, raw_sql: str) -> str:
        """Strip markdown fences and whitespace from model response."""
        sql = raw_sql.strip()
        # Remove markdown code blocks if present
        if sql.startswith("```"):
            sql = re.sub(r"^```(?:sql)?\s*", "", sql, flags=re.IGNORECASE)
            sql = re.sub(r"\s*```$", "", sql)
        # Strip trailing semicolon and extraneous whitespaces
        return sql.strip().rstrip(";")

    @classmethod
    def validate_query(cls, sql: str) -> Tuple[bool, str]:
        """
        Check if query is safe to execute.
        Returns: (is_safe: bool, reason_or_sanitized_sql: str)
        """
        cleaned = cls.sanitize_sql(sql)
        upper = cleaned.upper().strip()

        # 1. Must start with SELECT or WITH (common table expressions) or EXPLAIN
        if not (upper.startswith("SELECT") or upper.startswith("WITH") or upper.startswith("EXPLAIN")):
            return False, f"Safety violation: Only SELECT queries are permitted. Got: '{cleaned[:30]}...'"

        # 2. Check for multiple statements (prevent stacked SQL injection)
        # Remove quoted strings first so semicolons inside string literals don't trigger false positives
        no_quotes = re.sub(r"'[^']*'|\"[^\"]*\"", "''", cleaned)
        if ";" in no_quotes:
            return False, "Safety violation: Multiple SQL statements detected via semicolon. Only single read queries are permitted."

        # 3. Check for mutation / destructive keywords
        for pattern in cls.FORBIDDEN_KEYWORDS:
            if re.search(pattern, cleaned, re.IGNORECASE):
                matched = re.search(pattern, cleaned, re.IGNORECASE).group(0)
                return False, f"Safety violation: Dangerous keyword '{matched}' is forbidden in read-only mode."

        return True, cleaned

    @classmethod
    def apply_safety_limit(cls, sql: str, max_limit: int = 100) -> str:
        """Ensure the query has a sane LIMIT clause to prevent out-of-memory crashes."""
        upper = sql.upper()
        if "LIMIT" not in upper:
            return f"{sql} LIMIT {max_limit}"
        return sql


class SQLiteGeminiAgent:
    """Agent that translates natural language into safe SQLite queries and business summaries."""

    def __init__(self, db_path: str, model_name: str = "gemini-3.8-flash", api_key: str = None):
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Database file not found: {db_path}")

        self.db_path = db_path
        self.model_name = model_name
        
        # Initialize Google GenAI client
        # In modern google-genai SDK, GEMINI_API_KEY env var is picked up automatically
        # or can be passed via apiKey parameter.
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable.")

        self.client = genai.Client(api_key=api_key)
        self.schema_str = self._introspect_schema()

    def _get_readonly_connection(self) -> sqlite3.Connection:
        """Create a read-only SQLite connection using URI mode."""
        # SQLite supports read-only URI mode: file:path?mode=ro
        abs_path = os.path.abspath(self.db_path)
        uri = f"file:{abs_path}?mode=ro"
        conn = sqlite3.connect(uri, uri=True, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _introspect_schema(self) -> str:
        """Extract database schema including tables, columns, data types, and foreign keys."""
        conn = self._get_readonly_connection()
        cursor = conn.cursor()

        schema_lines = []
        try:
            # Get all user tables
            cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = cursor.fetchall()

            for table in tables:
                t_name = table["name"]
                schema_lines.append(f"\n--- Table: {t_name} ---")

                # Get columns & types
                cursor.execute(f"PRAGMA table_info('{t_name}');")
                columns = cursor.fetchall()
                col_defs = []
                for col in columns:
                    pk_marker = " [PRIMARY KEY]" if col["pk"] else ""
                    notnull_marker = " [NOT NULL]" if col["notnull"] else ""
                    col_defs.append(f"  - {col['name']} ({col['type']}){pk_marker}{notnull_marker}")
                schema_lines.extend(col_defs)

                # Get foreign keys
                cursor.execute(f"PRAGMA foreign_key_list('{t_name}');")
                fks = cursor.fetchall()
                for fk in fks:
                    schema_lines.append(f"  * FOREIGN KEY: {fk['from']} -> {fk['table']}({fk['to']})")

                # Get sample row count
                try:
                    cursor.execute(f"SELECT COUNT(*) as c FROM '{t_name}';")
                    cnt = cursor.fetchone()["c"]
                    schema_lines.append(f"  * Approximate Rows: {cnt}")
                except Exception:
                    pass

        finally:
            conn.close()

        return "\n".join(schema_lines)

    def generate_sql(self, question: str) -> str:
        """Generate safe SQLite SQL query using Gemini API."""
        prompt = f"""You are an expert SQL engineer.
Your task is to write a single, accurate SQLite SQL query to answer the user's question based on the provided database schema.

DATABASE SCHEMA:
{self.schema_str}

RULES:
1. Output ONLY the raw executable SQL query. Do not wrap in markdown or explain.
2. Only write read-only SELECT queries.
3. Do NOT include DROP, DELETE, UPDATE, INSERT, ALTER, or PRAGMA statements.
4. Use standard SQLite functions (e.g. strftime for dates, round for numbers, COALESCE for nulls).
5. Join tables properly using primary and foreign key relationships.
6. For queries asking for rankings or "top", always include an ORDER BY and a reasonable LIMIT.
7. Keep column aliases descriptive and clean for business reporting.

USER QUESTION:
"{question}"
"""

        response = self.client.models.generateContent(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,  # Low temperature for deterministic SQL
            )
        )

        raw_sql = response.text or ""
        return SQLiteSafetyGuardrail.sanitize_sql(raw_sql)

    def execute_query(self, sql: str) -> Dict[str, Any]:
        """Safely execute a SQL query on SQLite database."""
        # 1. Guardrail validation
        is_safe, message = SQLiteSafetyGuardrail.validate_query(sql)
        if not is_safe:
            return {
                "success": False,
                "error": message,
                "sql": sql,
                "columns": [],
                "rows": [],
                "row_count": 0
            }

        safe_sql = SQLiteSafetyGuardrail.apply_safety_limit(message, max_limit=100)

        # 2. Execute within read-only connection
        conn = None
        try:
            conn = self._get_readonly_connection()
            cursor = conn.cursor()
            cursor.execute(safe_sql)

            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            raw_rows = cursor.fetchall()
            rows = [dict(row) for row in raw_rows]

            return {
                "success": True,
                "sql": safe_sql,
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"SQLite Execution Error: {str(e)}",
                "sql": safe_sql,
                "columns": [],
                "rows": [],
                "row_count": 0
            }
        finally:
            if conn:
                conn.close()

    def generate_business_summary(self, question: str, sql: str, results: Dict[str, Any]) -> str:
        """Generate an executive, human-readable business summary from the query results."""
        if not results.get("success"):
            return f"❌ Unable to generate business summary because query execution failed: {results.get('error')}"

        rows = results.get("rows", [])
        if not rows:
            return f"No records found in the database matching your question: '{question}'."

        # Limit data payload to model to avoid blowing token limits on large queries
        truncated_rows = rows[:30]
        data_preview = str(truncated_rows)

        prompt = f"""You are a senior Business Intelligence & Analytics Director.
A stakeholder asked a business question. A database query was executed, and the results are provided below.

USER QUESTION:
"{question}"

SQL EXECUTED:
{sql}

QUERY RESULT METRICS:
Total Rows Returned: {results.get('row_count')}
Sample Data Rows:
{data_preview}

INSTRUCTIONS:
Provide a clear, high-level Executive Business Summary:
1. **Direct Answer**: Provide a 1-2 sentence direct, conclusive answer to the user's question with specific numbers/metrics.
2. **Key Insights & Metrics**: Present the most critical findings in bullet points (highlight top performers, growth, percentages, or anomalies).
3. **Business Recommendation / Takeaway**: 1 actionable takeaway based on these findings.

Tone: Professional, concise, data-driven. Do not explain technical SQL details; focus purely on business impact.
"""

        response = self.client.models.generateContent(
            model=self.model_name,
            contents=prompt,
        )
        return (response.text or "").strip()

    def ask(self, question: str) -> Dict[str, Any]:
        """End-to-end pipeline: NL -> SQL -> Safety Check -> SQLite Execute -> Business Summary."""
        print(f"\n[1/4] 🧠 Analyzing question and generating SQL...")
        generated_sql = self.generate_sql(question)
        print(f"      Generated SQL: {generated_sql}")

        print(f"[2/4] 🛡️  Running Safety Guardrail check...")
        is_safe, val_msg = SQLiteSafetyGuardrail.validate_query(generated_sql)
        if not is_safe:
            print(f"      🚨 BLOCKED by Guardrail: {val_msg}")
            return {
                "question": question,
                "sql": generated_sql,
                "safety_passed": False,
                "error": val_msg,
                "results": [],
                "summary": f"Query was rejected by safety guardrails: {val_msg}"
            }
        print(f"      ✅ Guardrail passed (Strict read-only verified)")

        print(f"[3/4] ⚡ Executing on SQLite database...")
        exec_result = self.execute_query(generated_sql)
        
        if not exec_result["success"]:
            print(f"      ❌ Execution failed: {exec_result['error']}")
            return {
                "question": question,
                "sql": exec_result.get("sql", generated_sql),
                "safety_passed": True,
                "error": exec_result["error"],
                "results": [],
                "summary": f"Database error: {exec_result['error']}"
            }

        row_count = exec_result["row_count"]
        print(f"      ✅ Returned {row_count} row(s)")

        # Pretty print results table if possible
        if exec_result["rows"] and HAS_TABULATE:
            print("\n" + tabulate(exec_result["rows"][:10], headers="keys", tablefmt="rounded_grid"))
            if row_count > 10:
                print(f"      ... and {row_count - 10} more rows")

        print(f"\n[4/4] 📊 Formulating Executive Business Summary...")
        summary = self.generate_business_summary(question, exec_result["sql"], exec_result)

        return {
            "question": question,
            "sql": exec_result["sql"],
            "safety_passed": True,
            "error": None,
            "columns": exec_result["columns"],
            "rows": exec_result["rows"],
            "row_count": row_count,
            "summary": summary
        }


def main():
    parser = argparse.ArgumentParser(description="SQLite AI Agent with Google GenAI SDK")
    parser.add_argument("--db", default="company_sales.db", help="Path to SQLite database file")
    parser.add_argument("--query", "-q", help="Natural language question to ask the database")
    parser.add_argument("--model", default="gemini-3.8-flash", help="Gemini model to use")
    args = parser.parse_args()

    # Verify API key
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY environment variable is required.")
        print("Set it using: export GEMINI_API_KEY='your-key-here'")
        sys.exit(1)

    print("=" * 60)
    print("🤖 SQLite AI Agent (Powered by Gemini & google-genai)")
    print(f"📂 Database: {args.db}")
    print(f"🧠 Model:    {args.model}")
    print("=" * 60)

    try:
        agent = SQLiteGeminiAgent(db_path=args.db, model_name=args.model)
    except Exception as e:
        print(f"Failed to initialize agent: {e}")
        sys.exit(1)

    if args.query:
        # Run single question from CLI
        result = agent.ask(args.query)
        print("\n" + "=" * 60)
        print("📊 EXECUTIVE BUSINESS SUMMARY:")
        print("=" * 60)
        print(result["summary"])
        print("=" * 60)
    else:
        # Interactive loop
        print("\nEnter your question in natural language (or 'exit' to quit):")
        while True:
            try:
                question = input("\n💬 Question > ").strip()
                if not question:
                    continue
                if question.lower() in ("exit", "quit", "q"):
                    print("Goodbye!")
                    break

                res = agent.ask(question)
                print("\n" + "=" * 60)
                print("📊 BUSINESS SUMMARY:")
                print("=" * 60)
                print(res["summary"])
                print("=" * 60)
            except KeyboardInterrupt:
                print("\nSession ended.")
                break
            except Exception as e:
                print(f"Error processing question: {e}")


if __name__ == "__main__":
    main()
