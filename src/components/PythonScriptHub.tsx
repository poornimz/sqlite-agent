import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Flame,
  Code2
} from 'lucide-react';
import { PythonScriptFile } from '../types';

export const PythonScriptHub: React.FC = () => {
  const [files, setFiles] = useState<PythonScriptFile[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/python/files')
      .then(res => res.json())
      .then(data => {
        setFiles(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load python files', err);
        setIsLoading(false);
      });
  }, []);

  const activeFile = files[selectedFileIdx];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (file: PythonScriptFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    files.forEach((f, idx) => {
      setTimeout(() => {
        handleDownloadFile(f);
      }, idx * 250);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
        <span>Loading Python scripts and configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Production Ready
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              Python 3.9+ Compatible
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Python SQLite AI Agent Scripts & Architecture
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Choose between <strong>Raw Google GenAI SDK (google-genai)</strong> for peak performance and minimal dependencies, or <strong>LangChain</strong> if you already use the LangChain ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download All Files</span>
          </button>
        </div>
      </div>

      {/* Comparison: Raw Gemini vs LangChain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setSelectedFileIdx(0)}
          className={`cursor-pointer rounded-xl p-5 border transition-all ${
            selectedFileIdx === 0 
              ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10' 
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Option 1: Raw Google GenAI SDK</h3>
                <span className="text-[11px] text-cyan-400 font-mono">gemini_sqlite_agent.py</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Recommended
            </span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>Uses official <code className="text-cyan-300">google-genai</code> package directly.</li>
            <li>Zero framework overhead, installs in seconds (&lt;10 MB footprint).</li>
            <li>Custom regex + AST read-only safety guardrail validator.</li>
            <li>Built-in CLI interactive loop and single-query flag (<code className="text-slate-400">-q</code>).</li>
          </ul>
        </div>

        <div 
          onClick={() => setSelectedFileIdx(1)}
          className={`cursor-pointer rounded-xl p-5 border transition-all ${
            selectedFileIdx === 1 
              ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10' 
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                🦜🔗
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Option 2: LangChain + Google GenAI</h3>
                <span className="text-[11px] text-indigo-400 font-mono">langchain_sqlite_agent.py</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ecosystem
            </span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>Uses <code className="text-indigo-300">langchain_community.SQLDatabase</code>.</li>
            <li>Chains together schema introspector, LLM, and executive summarizer.</li>
            <li>Custom LangChain Runnable guardrail for read-only validation.</li>
            <li>Ideal if your infrastructure already standardizes on LangChain LCEL.</li>
          </ul>
        </div>
      </div>

      {/* Code Inspector Tabs & Content */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* File Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 bg-slate-950/80 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            {files.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileIdx(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedFileIdx === idx
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {file.name.endsWith('.py') ? (
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{file.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 py-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
            <button
              onClick={() => activeFile && handleDownloadFile(activeFile)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* File Description Bar */}
        {activeFile && (
          <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200">{activeFile.title}</span>
              <span className="text-slate-400 ml-2">— {activeFile.desc}</span>
            </div>
          </div>
        )}

        {/* Code Content */}
        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed">
          <pre className="text-slate-200">
            {activeFile?.content}
          </pre>
        </div>
      </div>

      {/* Terminal Run Instructions */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Quick Terminal Instructions (How to run locally)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-slate-400 font-sans font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">1</span>
              Install Dependencies
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
              pip install -r requirements.txt
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Installs google-genai, tabulate, and optional LangChain packages.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-slate-400 font-sans font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">2</span>
              Configure Key & DB
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 space-y-1">
              <div>export GEMINI_API_KEY="AIzaSy..."</div>
              <div>python setup_sample_db.py</div>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Seeds company_sales.db with customers, products, and orders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-slate-400 font-sans font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">3</span>
              Run Natural Language Agent
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
              python gemini_sqlite_agent.py --db company_sales.db
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Launches interactive CLI or pass <code className="text-slate-400">-q "query"</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
