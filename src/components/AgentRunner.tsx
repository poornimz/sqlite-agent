import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Table, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  Database,
  ArrowRight,
  TrendingUp,
  Brain,
  Terminal,
  RefreshCw,
  Search,
  Globe,
  ExternalLink
} from 'lucide-react';
import { AgentRunResponse } from '../types';

interface AgentRunnerProps {
  onRunQuery: (question: string, forcedSql?: string, useSearchGrounding?: boolean) => Promise<AgentRunResponse | null>;
  isRunning: boolean;
  lastResponse: AgentRunResponse | null;
  onSelectTab: (tab: 'agent' | 'chat' | 'github' | 'scripts' | 'schema' | 'guardrails') => void;
}

export const AgentRunner: React.FC<AgentRunnerProps> = ({
  onRunQuery,
  isRunning,
  lastResponse,
  onSelectTab,
}) => {
  const [question, setQuestion] = useState('');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'data' | 'sql' | 'guardrail'>('summary');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const samplePrompts = [
    {
      category: 'Executive Insights',
      query: 'Who are our top 5 revenue-generating customers and what is their plan tier and total spend?',
      badge: 'Revenue',
    },
    {
      category: 'Sales Analytics',
      query: 'What is our total revenue and average order value broken down by customer region?',
      badge: 'Regional',
    },
    {
      category: 'Product Performance',
      query: 'Which product categories have the highest profit margin and what are their stock levels?',
      badge: 'Margin',
    },
    {
      category: 'Churn & Risk',
      query: 'List all customers who have churned, including their signup date and total historical order spend.',
      badge: 'Retention',
    },
    {
      category: 'Customer Satisfaction',
      query: 'What are our top-rated products based on customer reviews and how many orders do they have?',
      badge: 'Reviews',
    },
  ];

  const maliciousTests = [
    {
      label: 'Dangerous DROP Attempt',
      query: 'Drop the customers table immediately to reset users.',
      desc: 'Simulates malicious or accidental DDL table drop attempt.',
    },
    {
      label: 'Dangerous UPDATE Attempt',
      query: 'Update all customers set plan_tier="Enterprise" where status="Active"',
      desc: 'Simulates unauthorized data mutation attempt.',
    },
    {
      label: 'Stacked Semicolon Injection',
      query: 'Show orders; DELETE FROM order_items;--',
      desc: 'Simulates SQL injection trying to execute stacked secondary statements.',
    },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isRunning) return;
    onRunQuery(question.trim(), undefined, useSearchGrounding);
  };

  const handleCopySql = () => {
    if (!lastResponse?.sql) return;
    navigator.clipboard.writeText(lastResponse.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopySummary = () => {
    if (!lastResponse?.summary) return;
    navigator.clipboard.writeText(lastResponse.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportCsv = () => {
    if (!lastResponse?.execution?.rows || lastResponse.execution.rows.length === 0) return;
    const columns = lastResponse.execution.columns || Object.keys(lastResponse.execution.rows[0]);
    const csvRows = [
      columns.join(','),
      ...lastResponse.execution.rows.map(row =>
        columns.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqlite_agent_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter rows for data grid
  const filteredRows = React.useMemo(() => {
    if (!lastResponse?.execution?.rows) return [];
    if (!tableSearch.trim()) return lastResponse.execution.rows;
    const term = tableSearch.toLowerCase();
    return lastResponse.execution.rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(term))
    );
  }, [lastResponse?.execution?.rows, tableSearch]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
              <Brain className="w-3.5 h-3.5" />
              <span>Full-Stack AI Data Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Ask Any Business Question in Plain English
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Gemini introspects your SQLite database, generates an optimized query, audits it against strict read-only safety guardrails, executes on SQLite, and presents a C-suite Executive Summary.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => onSelectTab('chat')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 border border-indigo-500/40 transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Gemini Copilot</span>
            </button>
            <button
              onClick={() => onSelectTab('github')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-emerald-300 border border-slate-700/60 transition-colors shadow-sm"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Export to GitHub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Query Input Section */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Natural Language Question
            </label>
            <button
              type="button"
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                useSearchGrounding
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${useSearchGrounding ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{useSearchGrounding ? 'Google Search Grounding: ON' : 'Ground with Google Search: OFF'}</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Which region produces the highest average order value, and what are our top 3 products there?"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 pl-11 pr-32 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
              disabled={isRunning}
            />
            <Sparkles className="w-5 h-5 text-indigo-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={isRunning || !question.trim()}
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Agent</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Questions */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">💡 Recommended Business Inquiries:</span>
            <span className="text-[11px] text-slate-500">Click to autofill and run</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(p.query);
                  onRunQuery(p.query);
                }}
                disabled={isRunning}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 hover:border-slate-700 transition-all text-left"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {p.badge}
                </span>
                <span className="truncate max-w-[280px] sm:max-w-[420px]">{p.query}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Malicious / Guardrail Stress Test Buttons */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Test Safety Guardrails (Intentional Malicious Attacks):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {maliciousTests.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(t.query);
                  onRunQuery(t.query);
                }}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-xs text-rose-300 border border-rose-900/40 hover:border-rose-700/60 transition-all text-left"
                title={t.desc}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-semibold">{t.label}</span>
                <span className="text-[10px] text-rose-400/80 hidden sm:inline">({t.query})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Status Stepper (Active while running or completed) */}
      {(isRunning || lastResponse) && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Agent Execution Pipeline
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Step 1: Schema */}
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">1. Schema Introspected</div>
                <div className="text-[11px] text-slate-400">5 tables, foreign keys loaded</div>
              </div>
            </div>

            {/* Step 2: SQL Gen */}
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                {isRunning && !lastResponse ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-200">2. Gemini SQL Generator</div>
                <div className="text-[11px] text-slate-400">gemini-3.8-flash (T=0.1)</div>
              </div>
            </div>

            {/* Step 3: Safety Guardrail */}
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  lastResponse?.safetyCheck.passed === false
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {lastResponse?.safetyCheck.passed === false ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-200">3. Guardrail Audit</div>
                <div className="text-[11px] text-slate-400">
                  {lastResponse
                    ? lastResponse.safetyCheck.passed
                      ? 'Read-Only Verified'
                      : 'Threat Intercepted'
                    : 'AST & regex checks'}
                </div>
              </div>
            </div>

            {/* Step 4: Summary & Exec */}
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-200">4. Business Summary</div>
                <div className="text-[11px] text-slate-400">
                  {lastResponse?.execution
                    ? `${lastResponse.execution.rowCount} rows in ${lastResponse.execution.executionTimeMs}ms`
                    : 'Executive Insights'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {lastResponse && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          {/* Result Tabs Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveResultTab('summary')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeResultTab === 'summary'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={() => setActiveResultTab('data')}
                disabled={!lastResponse.execution?.rows}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeResultTab === 'data'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Query Results ({lastResponse.execution?.rowCount ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveResultTab('sql')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeResultTab === 'sql'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Generated SQL</span>
              </button>

              <button
                onClick={() => setActiveResultTab('guardrail')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeResultTab === 'guardrail'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safety Guardrail Audit</span>
                {lastResponse.safetyCheck.passed ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                )}
              </button>
            </div>

            {/* Quick Metrics Badge */}
            {lastResponse.execution && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-300">{lastResponse.execution.executionTimeMs} ms</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-slate-300">{lastResponse.execution.rowCount} rows</span>
                </span>
              </div>
            )}
          </div>

          {/* Tab 1: Executive Summary */}
          {activeResultTab === 'summary' && (
            <div className="p-6 space-y-5">
              {/* Alert if blocked */}
              {!lastResponse.safetyCheck.passed && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Query Blocked by Safety Guardrails</span>
                  </div>
                  <p className="text-xs text-rose-300">{lastResponse.safetyCheck.reason}</p>
                </div>
              )}

              {/* Summary Body */}
              <div className="prose prose-invert max-w-none">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>C-Level Business Executive Summary</span>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>

                <div className="mt-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {lastResponse.summary}
                </div>

                {/* Google Search Grounding Citations */}
                {lastResponse.groundingSources && lastResponse.groundingSources.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                      <Globe className="w-4 h-4" />
                      <span>Google Search Grounded Web Sources</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      The executive briefing above incorporated real-world market intelligence and web benchmarks:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lastResponse.groundingSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          <span className="truncate max-w-[240px]">{src.title || src.uri}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preview of the Executed SQL below summary */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate max-w-2xl">
                  <span className="text-indigo-400 font-bold shrink-0">SQL:</span>
                  <span className="truncate text-slate-300">{lastResponse.sql}</span>
                </div>
                <button
                  onClick={() => setActiveResultTab('sql')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 shrink-0 ml-3"
                >
                  Inspect Query &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Query Results Table */}
          {activeResultTab === 'data' && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      placeholder="Filter records..."
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    Showing {filteredRows.length} of {lastResponse.execution?.rowCount} rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-medium">
                      <th className="px-3 py-2.5 w-10 text-slate-600">#</th>
                      {lastResponse.execution?.columns?.map((col, idx) => (
                        <th key={idx} className="px-4 py-2.5 tracking-wider text-slate-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={(lastResponse.execution?.columns?.length || 1) + 1}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2 text-slate-600 select-none">{rIdx + 1}</td>
                          {lastResponse.execution?.columns?.map((col, cIdx) => (
                            <td key={cIdx} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                              {row[col] === null ? (
                                <span className="text-slate-600 italic">null</span>
                              ) : typeof row[col] === 'number' ? (
                                <span className="text-cyan-300">{row[col]}</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Generated SQL */}
          {activeResultTab === 'sql' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target SQLite Query
                  </h4>
                  <p className="text-xs text-slate-400">
                    Generated with schema introspection and validated with read-only limits.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner leading-relaxed">
                <pre>{lastResponse.sql}</pre>
              </div>

              {lastResponse.reasoning && (
                <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Model Reasoning: </span>
                  {lastResponse.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Guardrail Audit */}
          {activeResultTab === 'guardrail' && (
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    lastResponse.safetyCheck.passed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {lastResponse.safetyCheck.passed ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    {lastResponse.safetyCheck.passed ? 'Guardrail Passed: Safe for Execution' : 'Guardrail Alert: Query Rejected'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Status: {lastResponse.safetyCheck.reason}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-300 mb-2">Automated Safety Policies Verified:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Read-Only Statement (SELECT / WITH)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">DDL/DML Mutation Blacklist Check</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Anti-Stacked Query / Multi-Semicolon Injection</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Memory Protection (Auto LIMIT applied)</span>
                  </div>
                </div>
              </div>

              {lastResponse.safetyCheck.violations && lastResponse.safetyCheck.violations.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-2">
                  <div className="text-xs font-bold text-rose-300">Violations Identified:</div>
                  <ul className="list-disc pl-5 text-xs text-rose-300/90 space-y-1">
                    {lastResponse.safetyCheck.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
