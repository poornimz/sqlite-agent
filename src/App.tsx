import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentRunner } from './components/AgentRunner';
import { GeminiChatbot } from './components/GeminiChatbot';
import { GitHubExportGuide } from './components/GitHubExportGuide';
import { PythonScriptHub } from './components/PythonScriptHub';
import { SchemaExplorer } from './components/SchemaExplorer';
import { SafetySandbox } from './components/SafetySandbox';
import { SchemaResponse, AgentRunResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent' | 'chat' | 'github' | 'scripts' | 'schema' | 'guardrails'>('agent');
  const [schemaData, setSchemaData] = useState<SchemaResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResponse, setLastResponse] = useState<AgentRunResponse | null>(null);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/db/schema');
      const data = await res.json();
      setSchemaData(data);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleRunAgent = async (
    question: string,
    forcedSql?: string,
    useSearchGrounding?: boolean
  ): Promise<AgentRunResponse | null> => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, forcedSql, useSearchGrounding }),
      });
      const data: AgentRunResponse = await res.json();
      setLastResponse(data);
      return data;
    } catch (err: any) {
      console.error('Agent execution error:', err);
      const fallbackResponse: AgentRunResponse = {
        success: false,
        question,
        sql: forcedSql || '',
        safetyCheck: { passed: false, reason: err.message },
        execution: null,
        summary: `Error connecting to AI Agent service: ${err.message}`,
      };
      setLastResponse(fallbackResponse);
      return fallbackResponse;
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTestSql = async (sql: string) => {
    const res = await fetch('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    return await res.json();
  };

  const handleResetDb = async () => {
    await fetch('/api/db/reset', { method: 'POST' });
    await fetchSchema();
    setLastResponse(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tableCount={schemaData?.tables.length || 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'agent' && (
          <AgentRunner
            onRunQuery={handleRunAgent}
            isRunning={isRunning}
            lastResponse={lastResponse}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'chat' && <GeminiChatbot />}

        {activeTab === 'github' && <GitHubExportGuide />}

        {activeTab === 'scripts' && <PythonScriptHub />}

        {activeTab === 'schema' && (
          <SchemaExplorer
            schemaData={schemaData}
            onRefreshSchema={fetchSchema}
            onResetDb={handleResetDb}
            onRunTestSql={handleRunTestSql}
          />
        )}

        {activeTab === 'guardrails' && <SafetySandbox />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SQLite AI Agent</span>
            <span>—</span>
            <span>Raw Google GenAI &amp; LangChain SQLite Automation</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Google Search Grounding</span>
            <span>•</span>
            <span>Strict Read-Only Guardrails</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
