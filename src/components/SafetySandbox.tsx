import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Play, 
  Zap,
  Info,
  Bug
} from 'lucide-react';

export const SafetySandbox: React.FC = () => {
  const [testSql, setTestSql] = useState<string>('DROP TABLE customers;--');
  const [auditResult, setAuditResult] = useState<{
    tested: boolean;
    isSafe: boolean;
    violations: string[];
    sanitized: string;
  } | null>(null);

  const securityPresets = [
    {
      title: 'DROP TABLE Attack',
      sql: 'DROP TABLE customers;',
      threat: 'Destructive DDL table deletion.',
    },
    {
      title: 'Mass UPDATE Manipulation',
      sql: 'UPDATE customers SET plan_tier = "Enterprise" WHERE status = "Active";',
      threat: 'Unauthorized data modification.',
    },
    {
      title: 'Stacked Semicolon Injection',
      sql: 'SELECT * FROM products; DELETE FROM orders;',
      threat: 'Stacked statement privilege escalation / data wipe.',
    },
    {
      title: 'Valid Analytics Query (Safe)',
      sql: 'SELECT region, sum(total_amount) as revenue FROM customers JOIN orders ON customers.customer_id = orders.customer_id GROUP BY region ORDER BY revenue DESC;',
      threat: 'Read-only business analytics.',
    },
    {
      title: 'PRAGMA writable_schema Exploit',
      sql: 'PRAGMA writable_schema = 1;',
      threat: 'Low-level SQLite internal catalog tampering.',
    },
  ];

  const handleAudit = () => {
    let cleaned = testSql.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:sql)?\s*/i, '').replace(/\s*```$/, '');
    }
    cleaned = cleaned.trim().replace(/;+$/, '').trim();

    const upper = cleaned.toUpperCase();
    const violations: string[] = [];

    // 1. Must start with SELECT or WITH
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH') && !upper.startsWith('EXPLAIN')) {
      violations.push(`Statement must begin with SELECT or WITH (CTE). Detected: "${cleaned.slice(0, 20)}..."`);
    }

    // 2. Prevent multi-statement query execution
    const noQuotes = cleaned.replace(/'[^']*'|"[^"]*"/g, "''");
    if (noQuotes.includes(';')) {
      violations.push('Multiple SQL statements detected via semicolon. Only single read-only queries are permitted.');
    }

    // 3. Prohibited DDL/DML keywords
    const forbidden = [
      { pattern: /\bDROP\b/i, name: 'DROP' },
      { pattern: /\bDELETE\b/i, name: 'DELETE' },
      { pattern: /\bINSERT\b/i, name: 'INSERT' },
      { pattern: /\bUPDATE\b/i, name: 'UPDATE' },
      { pattern: /\bALTER\b/i, name: 'ALTER' },
      { pattern: /\bTRUNCATE\b/i, name: 'TRUNCATE' },
      { pattern: /\bREPLACE\b/i, name: 'REPLACE' },
      { pattern: /\bCREATE\b/i, name: 'CREATE' },
      { pattern: /\bATTACH\b/i, name: 'ATTACH' },
      { pattern: /\bDETACH\b/i, name: 'DETACH' },
      { pattern: /\bVACUUM\b/i, name: 'VACUUM' },
      { pattern: /\bREINDEX\b/i, name: 'REINDEX' },
      { pattern: /\bPRAGMA\s+writable_schema\b/i, name: 'PRAGMA writable_schema' },
      { pattern: /\bGRANT\b/i, name: 'GRANT' },
      { pattern: /\bREVOKE\b/i, name: 'REVOKE' },
    ];

    for (const { pattern, name } of forbidden) {
      if (pattern.test(cleaned)) {
        violations.push(`Forbidden mutation keyword detected: "${name}"`);
      }
    }

    let finalSql = cleaned;
    if (violations.length === 0 && !upper.includes('LIMIT')) {
      finalSql = `${cleaned} LIMIT 100`;
    }

    setAuditResult({
      tested: true,
      isSafe: violations.length === 0,
      violations,
      sanitized: finalSql,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Zero-Trust SQL Sandboxing
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Safety Guardrail Architecture & Threat Simulator
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Automated defense-in-depth shield that intercepts malicious prompts, prompt injections, and accidental mutations before anything reaches your SQLite database.
        </p>
      </div>

      {/* 4 Pillars of Defense */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            1
          </div>
          <div className="font-bold text-white">Strict Read-Only Filter</div>
          <p className="text-slate-400">
            Queries MUST begin with <code className="text-cyan-300">SELECT</code> or <code className="text-cyan-300">WITH</code>. All DDL/DML mutations are blocked instantly.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            2
          </div>
          <div className="font-bold text-white">Anti-Injection Tokenizer</div>
          <p className="text-slate-400">
            Blocks stacked queries (semicolons outside quoted strings) to eliminate secondary statement payloads.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            3
          </div>
          <div className="font-bold text-white">URI Sandboxed Connection</div>
          <p className="text-slate-400">
            Python scripts open SQLite with URI read-only flag <code className="text-cyan-300">file:db.sqlite?mode=ro</code> to enforce OS-level database locks.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            4
          </div>
          <div className="font-bold text-white">Automatic Memory LIMIT</div>
          <p className="text-slate-400">
            Prevents unbounded full-table scans or out-of-memory crashes by auto-injecting <code className="text-cyan-300">LIMIT 100</code> if omitted.
          </p>
        </div>
      </div>

      {/* Interactive Threat Simulator */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Guardrail Threat Simulator
            </h3>
          </div>
          <span className="text-xs text-slate-400">Test any SQL query against the Python agent's regex AST</span>
        </div>

        {/* Attack Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400">Select an Attack Vector Preset:</span>
          <div className="flex flex-wrap gap-2">
            {securityPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestSql(preset.sql);
                  setAuditResult(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="font-semibold">{preset.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Target Query Under Test</label>
          <textarea
            value={testSql}
            onChange={e => setTestSql(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            placeholder="Type or paste SQL to test..."
          />
          <button
            onClick={handleAudit}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit with Safety Guardrail</span>
          </button>
        </div>

        {/* Audit Report */}
        {auditResult && (
          <div className="pt-2">
            {auditResult.isSafe ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Verdict: SAFE FOR EXECUTION</span>
                </div>
                <p className="text-xs text-emerald-300/90">
                  The query complies with read-only guidelines. No dangerous mutation commands or multiple statement injections detected.
                </p>
                <div className="pt-2 font-mono text-xs bg-slate-950/60 p-3 rounded-lg border border-emerald-900/40">
                  <span className="text-slate-400">Sanitized Query Output:</span>
                  <div className="text-cyan-300 mt-1">{auditResult.sanitized}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Verdict: THREAT INTERCEPTED &amp; BLOCKED</span>
                </div>
                <p className="text-xs text-rose-300">
                  The query violated our security guardrail policies and was safely rejected prior to reaching the database:
                </p>
                <ul className="list-disc pl-5 text-xs text-rose-300/90 space-y-1">
                  {auditResult.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
