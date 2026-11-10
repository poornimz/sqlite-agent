import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Link2, 
  Rows, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Terminal,
  Search,
  Sparkles
} from 'lucide-react';
import { SchemaResponse, TableMeta } from '../types';

interface SchemaExplorerProps {
  schemaData: SchemaResponse | null;
  onRefreshSchema: () => void;
  onResetDb: () => Promise<void>;
  onRunTestSql: (sql: string) => Promise<any>;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemaData,
  onRefreshSchema,
  onResetDb,
  onRunTestSql,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string>('customers');
  const [customSql, setCustomSql] = useState<string>('SELECT * FROM customers LIMIT 10;');
  const [scratchpadResult, setScratchpadResult] = useState<any | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const selectedTable: TableMeta | undefined = schemaData?.tables.find(
    t => t.tableName === selectedTableName
  ) || schemaData?.tables[0];

  const handleRunScratchpad = async () => {
    if (!customSql.trim() || isExecuting) return;
    setIsExecuting(true);
    setScratchpadResult(null);
    try {
      const res = await onRunTestSql(customSql);
      setScratchpadResult(res);
    } catch (err: any) {
      setScratchpadResult({ success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset SQLite database to default enterprise dataset?')) {
      setIsResetting(true);
      await onResetDb();
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> SQLite 3 Schema Explorer
            </span>
            <span className="text-xs text-slate-400">
              {schemaData?.tables.length || 0} relational tables
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Database Schema & Foreign Key Map
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect the live schema that Gemini reads before answering questions. Relationships, types, and constraints guide the AI to generate accurate joins.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Database'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Table List, Right = Details & Sample Data */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Selector Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Database Tables
          </h3>
          <div className="space-y-1.5">
            {schemaData?.tables.map(table => (
              <button
                key={table.tableName}
                onClick={() => {
                  setSelectedTableName(table.tableName);
                  setCustomSql(`SELECT * FROM ${table.tableName} LIMIT 10;`);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedTableName === table.tableName
                    ? 'bg-indigo-600/10 border-indigo-500/60 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Table className={`w-4 h-4 ${selectedTableName === table.tableName ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="font-mono text-xs font-bold">{table.tableName}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {table.rowCount} rows
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTable ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden p-6 space-y-6">
              {/* Table Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white font-mono">
                      {selectedTable.tableName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total records: <span className="text-slate-200 font-semibold">{selectedTable.rowCount}</span>
                  </p>
                </div>
              </div>

              {/* Columns Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Columns & Data Types</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-sans">
                        <th className="px-4 py-2.5 font-semibold">Column Name</th>
                        <th className="px-4 py-2.5 font-semibold">Type</th>
                        <th className="px-4 py-2.5 font-semibold">Key / Constraint</th>
                        <th className="px-4 py-2.5 font-semibold">Nullable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedTable.columns.map(col => (
                        <tr key={col.cid} className="hover:bg-slate-900/40">
                          <td className="px-4 py-2 text-white font-medium flex items-center gap-2">
                            {col.name}
                            {col.isPk && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PK
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-cyan-300">{col.type}</td>
                          <td className="px-4 py-2 text-slate-400 font-sans">
                            {col.isPk ? 'Primary Key' : 'Standard'}
                          </td>
                          <td className="px-4 py-2 text-slate-400 font-sans">
                            {col.notNull ? (
                              <span className="text-rose-400 font-semibold">NOT NULL</span>
                            ) : (
                              <span className="text-slate-500">NULL OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Foreign Keys (if any) */}
              {selectedTable.foreignKeys && selectedTable.foreignKeys.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Foreign Key References</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedTable.foreignKeys.map((fk, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 font-mono"
                      >
                        <span className="text-indigo-400">{selectedTable.tableName}.{fk.from}</span>
                        <span className="text-slate-600">&rarr;</span>
                        <span className="text-emerald-400">{fk.targetTable}.{fk.targetColumn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Data Preview */}
              {selectedTable.sampleRows && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Rows className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sample Records Preview (First 3 Rows)</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                          {selectedTable.sampleRows.columns.map((c, idx) => (
                            <th key={idx} className="px-3 py-2 text-slate-300">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedTable.sampleRows.values.map((rowArr, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/40">
                            {rowArr.map((val, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                                {val === null ? <span className="text-slate-600 italic">null</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Select a table to view schema details.</div>
          )}

          {/* Interactive SQL Scratchpad */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Direct SQL Query Scratchpad
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Executes directly on SQLite with read-only guardrails
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={customSql}
                onChange={e => setCustomSql(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Tip: Try running a SELECT with JOIN or test an illegal DROP command to see guardrails in action.
                </span>
                <button
                  onClick={handleRunScratchpad}
                  disabled={isExecuting || !customSql.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Run SQL'}</span>
                </button>
              </div>
            </div>

            {/* Scratchpad Result */}
            {scratchpadResult && (
              <div className="pt-2">
                {scratchpadResult.success ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Query Successful
                      </span>
                      <span>
                        {scratchpadResult.rowCount} rows in {scratchpadResult.executionTimeMs} ms
                      </span>
                    </div>
                    {scratchpadResult.rows && scratchpadResult.rows.length > 0 && (
                      <div className="overflow-x-auto max-h-48 text-xs font-mono">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              {scratchpadResult.columns.map((col: string, idx: number) => (
                                <th key={idx} className="px-2 py-1">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {scratchpadResult.rows.map((row: any, rIdx: number) => (
                              <tr key={rIdx}>
                                {scratchpadResult.columns.map((col: string, cIdx: number) => (
                                  <td key={cIdx} className="px-2 py-1 text-slate-300">
                                    {String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Execution Error / Guardrail Blocked:</div>
                      <div>{scratchpadResult.error}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
