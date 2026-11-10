# SQLite AI Agent (Gemini & LangChain)

A production-grade Python solution that takes natural language questions, extracts live SQLite database schema, generates optimized SQL, validates query safety through strict guardrails, executes against SQLite, and produces an Executive Business Summary.

---

## 🚀 Quick Start (Under 2 Minutes)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```
*Note: If you only want the raw Gemini agent, you only need `pip install google-genai tabulate`.*

### 2. Set your Gemini API Key
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Generate Sample SQLite Database
```bash
python setup_sample_db.py
```
This generates `company_sales.db` loaded with customers, products, enterprise orders, line items, and reviews.

---

## 🤖 Option A: Raw Google GenAI SDK (Recommended)

Uses the official modern `google-genai` SDK (`gemini-3.8-flash`), zero heavy framework overhead, lightning fast, full schema introspection, and robust safety guardrails.

### Interactive Mode:
```bash
python gemini_sqlite_agent.py --db company_sales.db
```

### Single Question CLI Mode:
```bash
python gemini_sqlite_agent.py --db company_sales.db -q "Who are our top 5 revenue-generating customers and what is their total spend?"
```

---

## 🦜🔗 Option B: LangChain + Google GenAI

Uses LangChain's `SQLDatabase` utility and `ChatGoogleGenerativeAI` with custom safety runnables:

### Interactive Mode:
```bash
python langchain_sqlite_agent.py --db company_sales.db
```

### Single Question CLI Mode:
```bash
python langchain_sqlite_agent.py --db company_sales.db -q "What is our average order value by region?"
```

---

## 🛡️ Built-in Safety Guardrails

Both scripts enforce strict enterprise data safety:
1. **Read-Only Enforcement**: Rejects any non-SELECT statement (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `REPLACE`, `CREATE`).
2. **SQL Injection Defense**: Disallows multi-statement execution via semicolons.
3. **Connection Sandbox**: Connects to SQLite with URI read-only flag (`file:dbname.db?mode=ro`).
4. **Memory Guardrail**: Automatically appends `LIMIT 100` if the generated query does not already restrict output size.

---

## 📊 Sample Executive Business Summary Output

```text
============================================================
📊 EXECUTIVE BUSINESS SUMMARY:
============================================================
• Direct Answer: Acme Cloud is our top customer, generating $48,250 in total revenue across 6 enterprise orders, followed by TechPulse IO ($39,120) and Kyoto Tech ($32,400).
• Key Insights:
  - Enterprise tier customers account for 71.4% of total top-5 spend.
  - The North America and Europe regions contribute the majority of high-ticket infrastructure deployments.
• Recommendation: Prioritize expanding enterprise tier account management in Asia Pacific where Kyoto Tech shows high expansion velocity.
============================================================
```
