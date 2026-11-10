#!/usr/bin/env python3
"""
SQLite AI Agent using LangChain & langchain-google-genai
--------------------------------------------------------
Features:
1. Connects to SQLite via LangChain's SQLDatabase utility.
2. Extracts live schema with sample rows.
3. Generates SQL using ChatGoogleGenerativeAI (gemini-3.8-flash or gemini-2.5-flash).
4. Custom Guardrail Runnable:
   - Validates SQL for read-only safety (prevents DROP, DELETE, ALTER, etc.)
   - Strips dangerous characters and stack queries.
   - Appends safety LIMIT clauses.
5. Executes query against SQLite safely.
6. Synthesizes query output into a human-readable Executive Business Summary.
"""

import os
import sys
import re
import argparse
from typing import Dict, Any, Tuple

from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda


class LangChainSQLGuardrail:
    """Read-only security validator for LangChain SQL chains."""

    FORBIDDEN_KEYWORDS = [
        r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
        r"\bALTER\b", r"\bTRUNCATE\b", r"\bREPLACE\b", r"\bCREATE\b",
        r"\bATTACH\b", r"\bDETACH\b", r"\bVACUUM\b", r"\bREINDEX\b",
        r"\bPRAGMA\s+writable_schema\b", r"\bGRANT\b", r"\bREVOKE\b"
    ]

    @classmethod
    def clean_sql(cls, raw: str) -> str:
        text = raw.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:sql)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
        return text.strip().rstrip(";")

    @classmethod
    def inspect(cls, sql_text: str) -> Tuple[bool, str]:
        cleaned = cls.clean_sql(sql_text)
        upper = cleaned.upper().strip()

        if not (upper.startswith("SELECT") or upper.startswith("WITH")):
            return False, f"Guardrail Alert: Query must be a SELECT statement. Received: '{cleaned[:30]}...'"

        no_quotes = re.sub(r"'[^']*'|\"[^\"]*\"", "''", cleaned)
        if ";" in no_quotes:
            return False, "Guardrail Alert: Multi-statement query attempt detected. Only single queries allowed."

        for kw in cls.FORBIDDEN_KEYWORDS:
            if re.search(kw, cleaned, re.IGNORECASE):
                match = re.search(kw, cleaned, re.IGNORECASE).group(0)
                return False, f"Guardrail Alert: Dangerous mutation keyword '{match}' blocked."

        if "LIMIT" not in upper:
            cleaned = f"{cleaned} LIMIT 100"

        return True, cleaned


class LangChainSQLiteAgent:
    """End-to-end LangChain Agent for SQLite Querying and Executive Summarization."""

    def __init__(self, db_path: str, model_name: str = "gemini-2.5-flash", api_key: str = None):
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Database not found: {db_path}")

        self.db_path = db_path
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please set the environment variable.")

        # Initialize LangChain SQLDatabase
        self.db = SQLDatabase.from_uri(f"sqlite:///{os.path.abspath(db_path)}")

        # Initialize Gemini LLM via LangChain
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=self.api_key,
            temperature=0.1
        )

        # Build chains
        self._build_chains()

    def _build_chains(self):
        # 1. SQL Generation Prompt & Chain
        sql_prompt_template = """You are a SQLite expert. Given the database schema below, write a single syntactically correct SQLite query that answers the question.
Output ONLY the raw SQL query. Do not wrap in markdown or include any explanations.

DATABASE SCHEMA:
{table_info}

QUESTION:
{question}

SQL QUERY:"""

        self.sql_prompt = PromptTemplate.from_template(sql_prompt_template)
        self.sql_generator = (
            self.sql_prompt
            | self.llm
            | StrOutputParser()
            | RunnableLambda(LangChainSQLGuardrail.clean_sql)
        )

        # 2. Executive Business Summary Prompt & Chain
        summary_prompt_template = """You are a senior Business Intelligence Director.
Translate the following technical SQL query and database results into a high-level executive business summary.

ORIGINAL QUESTION:
{question}

SQL QUERY:
{query}

QUERY RESULT DATA:
{result}

Please formulate an executive response with:
1. **Executive Answer**: A crisp, authoritative direct response (1-2 sentences) with specific metrics.
2. **Key Insights**: 3 concise bullet points highlighting trends, top drivers, or anomalies.
3. **Strategic Recommendation**: 1 practical business action based on this data.

Write for C-level executives (clear, concise, data-driven, no SQL jargon)."""

        self.summary_prompt = PromptTemplate.from_template(summary_prompt_template)
        self.summarizer = (
            self.summary_prompt
            | self.llm
            | StrOutputParser()
        )

    def run(self, question: str) -> Dict[str, Any]:
        """Execute the LangChain agent workflow."""
        print(f"\n[1/4] 🔗 [LangChain] Introspecting schema & generating SQL...")
        schema_info = self.db.get_table_info()
        generated_sql = self.sql_generator.invoke({
            "table_info": schema_info,
            "question": question
        })
        print(f"      Generated SQL: {generated_sql}")

        print(f"[2/4] 🛡️  [LangChain] Validating safety guardrails...")
        is_safe, sanitized_or_err = LangChainSQLGuardrail.inspect(generated_sql)
        if not is_safe:
            print(f"      🚨 {sanitized_or_err}")
            return {
                "question": question,
                "sql": generated_sql,
                "safety_passed": False,
                "error": sanitized_or_err,
                "results": None,
                "summary": f"Query blocked by safety policy: {sanitized_or_err}"
            }
        print(f"      ✅ Query verified safe: {sanitized_or_err}")

        print(f"[3/4] ⚡ [LangChain] Executing query on SQLite...")
        try:
            # Execute safely
            raw_result = self.db.run(sanitized_or_err)
            print(f"      Raw result snippet: {str(raw_result)[:120]}...")
        except Exception as e:
            print(f"      ❌ Execution error: {e}")
            return {
                "question": question,
                "sql": sanitized_or_err,
                "safety_passed": True,
                "error": str(e),
                "results": None,
                "summary": f"Database execution error: {e}"
            }

        print(f"[4/4] 📊 [LangChain] Generating Business Executive Summary...")
        summary = self.summarizer.invoke({
            "question": question,
            "query": sanitized_or_err,
            "result": raw_result
        })

        return {
            "question": question,
            "sql": sanitized_or_err,
            "safety_passed": True,
            "error": None,
            "results": raw_result,
            "summary": summary
        }


def main():
    parser = argparse.ArgumentParser(description="SQLite LangChain AI Agent with Gemini")
    parser.add_argument("--db", default="company_sales.db", help="Path to SQLite database")
    parser.add_argument("--query", "-q", help="Business question to answer")
    parser.add_argument("--model", default="gemini-2.5-flash", help="LangChain Google GenAI model")
    args = parser.parse_args()

    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY environment variable is required.")
        sys.exit(1)

    print("=" * 60)
    print("🦜🔗 SQLite AI Agent (Powered by LangChain & Google GenAI)")
    print(f"📂 Database: {args.db}")
    print(f"🧠 Model:    {args.model}")
    print("=" * 60)

    try:
        agent = LangChainSQLiteAgent(db_path=args.db, model_name=args.model)
    except Exception as e:
        print(f"Initialization error: {e}")
        sys.exit(1)

    if args.query:
        res = agent.run(args.query)
        print("\n" + "=" * 60)
        print("📊 EXECUTIVE BUSINESS SUMMARY:")
        print("=" * 60)
        print(res["summary"])
        print("=" * 60)
    else:
        print("\nEnter your business question (or 'exit' to quit):")
        while True:
            try:
                q = input("\n💬 Question > ").strip()
                if not q:
                    continue
                if q.lower() in ("exit", "quit", "q"):
                    break
                res = agent.run(q)
                print("\n" + "=" * 60)
                print("📊 EXECUTIVE SUMMARY:")
                print("=" * 60)
                print(res["summary"])
                print("=" * 60)
            except KeyboardInterrupt:
                break


if __name__ == "__main__":
    main()
