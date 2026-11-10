import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Globe, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  TrendingUp, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Zap,
  Cpu,
  User,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, ChatPersona } from '../types';

export const GeminiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your **SQLite & AI Data Advisor**. 

I can help you:
1. **Optimize SQL queries** and analyze index efficiency on your SQLite database.
2. **Translate complex questions into safe queries** or write custom Python LangChain pipelines.
3. **Conduct deep market research** using real-time **Google Search data** to benchmark your company's revenue and churn metrics against industry standards.

Feel free to ask a question or pick one of the suggestions below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('architect');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const personas: ChatPersona[] = [
    {
      id: 'architect',
      name: 'Database Architect',
      title: 'SQLite Internals & Indexing',
      icon: 'database',
      description: 'Specializes in table schema design, indexes, and execution plans.',
    },
    {
      id: 'analyst',
      name: 'Executive BI Strategist',
      title: 'Metrics & Market Growth',
      icon: 'trending',
      description: 'Translates data into executive decisions, revenue ROI, and growth strategy.',
    },
    {
      id: 'security',
      name: 'Security & Guardrail Auditor',
      title: 'Zero-Trust Sandboxing',
      icon: 'shield',
      description: 'Focuses on SQL injection prevention, safe read-only rules, and compliance.',
    },
    {
      id: 'engineer',
      name: 'Python AI Engineer',
      title: 'LangChain & Google GenAI',
      icon: 'terminal',
      description: 'Assists with Python scripting, SDK migrations, and GitHub deployment.',
    },
  ];

  const suggestions = [
    {
      label: 'Benchmark SaaS Churn Rates',
      prompt: 'Using Google Search, what is the average B2B SaaS annual churn rate for enterprise accounts, and how does our database churn compare?',
      useSearch: true,
    },
    {
      label: 'SQLite Indexing Strategy',
      prompt: 'Explain how to write an EXPLAIN QUERY PLAN in SQLite to check if orders are using the customer_id index properly.',
      useSearch: false,
    },
    {
      label: 'Compare Raw GenAI vs LangChain',
      prompt: 'What are the trade-offs between using the raw google-genai Python SDK versus LangChain for a SQLite text-to-SQL production agent?',
      useSearch: false,
    },
    {
      label: 'Write Window Function Query',
      prompt: 'Write an advanced SQLite query using window functions (e.g. ROW_NUMBER or DENSE_RANK) to rank customers by order volume per region.',
      useSearch: false,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, text: m.text })),
          roleId: selectedPersona,
          model: selectedModel,
          useSearchGrounding,
        }),
      });

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: data.text || 'Unable to generate response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data.groundingSources,
        webSearchQueries: data.webSearchQueries,
        model: data.model || selectedModel,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Error connecting to Gemini advisor: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 'reset',
          role: 'assistant',
          text: 'Conversation reset. What database or architecture question would you like to explore?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: selectedModel,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Multi-Turn Gemini Advisor
            </span>
            {useSearchGrounding && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 flex items-center gap-1.5 animate-pulse">
                <Globe className="w-3.5 h-3.5" /> Google Search Grounding Active
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Interactive SQLite &amp; Data Strategy Copilot
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Conversational assistant equipped with your live SQLite database schema, Google Search real-time data, and specialized role personas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Persona, Model, and Google Search Grounding Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Persona Select */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Chatbot Role / Persona</span>
          </label>
          <select
            value={selectedPersona}
            onChange={e => setSelectedPersona(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {personas.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.title})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 truncate">
            {personas.find(p => p.id === selectedPersona)?.description}
          </div>
        </div>

        {/* Model Select */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Gemini Model</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              3.8 Flash (General)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              disabled={useSearchGrounding}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={useSearchGrounding ? 'Google Search Grounding requires 3.8 Flash' : ''}
            >
              3.1 Lite (Fast)
            </button>
          </div>
          <div className="text-[11px] text-slate-400">
            {selectedModel === 'gemini-3.8-flash' ? 'High reasoning & Search Grounding' : 'Ultra-low latency streaming'}
          </div>
        </div>

        {/* Google Search Grounding Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Search Grounding</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setUseSearchGrounding(!useSearchGrounding);
                if (!useSearchGrounding) {
                  setSelectedModel('gemini-3.8-flash');
                }
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                useSearchGrounding ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  useSearchGrounding ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Enables Gemini to query the live web for market trends, tech news, and external benchmarks.
          </p>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 border border-slate-700 text-cyan-400'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2 max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/90 text-white shadow-md rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-inner'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/60 mb-2">
                  <span className="font-semibold text-slate-300">
                    {msg.role === 'user' ? 'You' : `Gemini Advisor (${msg.model || '3.8 Flash'})`}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-[13px]">{msg.text}</div>

                {/* Google Search Grounding Sources (if returned) */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search Verified Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{source.title || source.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy button */}
                {msg.role === 'assistant' && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Gemini is thinking and reviewing database context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Suggested:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (s.useSearch) setUseSearchGrounding(true);
                handleSend(s.prompt);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0"
            >
              {s.useSearch && <Globe className="w-3 h-3 text-cyan-400" />}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about SQLite queries, LangChain Python agent, or live market comparisons..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
