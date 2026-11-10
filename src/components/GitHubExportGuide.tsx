import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  FolderArchive, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Lock,
  GitBranch,
  Github,
  AlertTriangle,
  FileCode,
  FileText,
  HelpCircle,
  Laptop,
  Flame,
  Layers
} from 'lucide-react';
import { PythonScriptFile } from '../types';

export const GitHubExportGuide: React.FC = () => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [files, setFiles] = useState<PythonScriptFile[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/python/files')
      .then(res => res.json())
      .then(data => setFiles(data))
      .catch(err => console.error(err));
  }, []);

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPowerShell, setCopiedPowerShell] = useState(false);

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  // Robust client-side base64 zip download (immune to iframe blob permission issues)
  const downloadZipBase64 = async () => {
    setDownloadingZip(true);
    setDownloadStatus('Generating GitHub archive...');
    try {
      const res = await fetch('/api/download/repo.base64');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const { base64, filename } = await res.json();

      const link = document.createElement('a');
      link.href = `data:application/zip;base64,${base64}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus(`✓ ${filename} successfully downloaded!`);
      setTimeout(() => setDownloadStatus(null), 4000);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadStatus(`ZIP download notice: Use the 1-Line Terminal Command or Direct Files below.`);
    } finally {
      setDownloadingZip(false);
    }
  };

  const copyTerminalOneLiner = (cmd: string, type: 'curl' | 'pwsh') => {
    navigator.clipboard.writeText(cmd);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedPowerShell(true);
      setTimeout(() => setCopiedPowerShell(false), 2000);
    }
  };

  // Download individual file without zip
  const downloadSingleFile = (file: PythonScriptFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  };

  // Download all files individually without any zip!
  const downloadAllFilesDirectly = () => {
    files.forEach((file, idx) => {
      setTimeout(() => {
        downloadSingleFile(file);
      }, idx * 250);
    });
    setDownloadStatus('✓ All individual files downloaded directly to your Downloads folder!');
    setTimeout(() => setDownloadStatus(null), 4000);
  };

  const steps = [
    {
      title: 'Step 1: Create your Project Folder',
      desc: 'Open your terminal (macOS/Linux Terminal, Windows PowerShell, or Git Bash) and create a directory:',
      code: `mkdir sqlite-ai-agent
cd sqlite-ai-agent`,
    },
    {
      title: 'Step 2: Place project files (Pick Option A, B, or C)',
      desc: 'Choose whichever method works best for your system:',
      code: `# OPTION A (NO ZIP NEEDED): If you downloaded the individual files, move them into a python/ folder:
mkdir python
# Move gemini_sqlite_agent.py, langchain_sqlite_agent.py, setup_sample_db.py into python/

# OPTION B (PYTHON UNIVERSAL UNZIP - Works on Windows, Mac, Linux):
python -m zipfile -e ~/Downloads/sqlite-ai-agent-github-ready.zip .

# OPTION C (WINDOWS POWERSHELL BUILT-IN):
Expand-Archive -Path "$HOME\\Downloads\\sqlite-ai-agent-github-ready.zip" -DestinationPath . -Force`,
    },
    {
      title: 'Step 3: Initialize Git & Branch',
      desc: 'Initialize git tracking and name your default branch main:',
      code: `git init
git branch -M main`,
    },
    {
      title: 'Step 4: Confirm .gitignore Exclusions',
      desc: 'Make sure sensitive files (.env, node_modules, and databases) are ignored:',
      code: `cat .gitignore

# Should show:
# node_modules
# dist
# .env
# *.db
# *.sqlite
# __pycache__`,
    },
    {
      title: 'Step 5: Stage and Commit All Files',
      desc: 'Stage and create your initial git commit:',
      code: `git add .
git status
git commit -m "feat: complete SQLite AI Agent with Gemini 3.8 Flash, LangChain, and Web Studio"`,
    },
    {
      title: 'Step 6: Create GitHub Repository & Link Remote',
      desc: 'Go to https://github.com/new, create a repository named "sqlite-ai-agent" (do NOT check "Add a README"), and link it:',
      code: `# Replace <YOUR-GITHUB-USERNAME> with your actual GitHub username:
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/sqlite-ai-agent.git`,
    },
    {
      title: 'Step 7: Push to GitHub',
      desc: 'Push your commits to your GitHub repository:',
      code: `git push -u origin main`,
    },
  ];

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const curlCmd = `curl -fsSL ${appOrigin}/install.py | python`;
  const pwshCmd = `irm ${appOrigin}/install.py | python`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" /> GitHub Deployment Hub
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> No-Zip Options Available
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Download &amp; Upload to GitHub Guide
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            If your system is not unzipping archives, use the <strong>1-Line Terminal Generator</strong> below or download individual Python files directly without any zip file.
          </p>
        </div>

        {downloadStatus && (
          <div className="px-4 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200 font-medium animate-pulse">
            {downloadStatus}
          </div>
        )}
      </div>

      {/* 1-LINE TERMINAL INSTALLER BANNER (FASTEST & ZERO UNZIP) */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/60 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Fastest Method: 1-Line Terminal Setup (Zero Unzip Required)
              </h3>
              <p className="text-xs text-indigo-300">
                Run this single command on your computer to auto-create the project and initialize Git:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full self-start sm:self-auto">
            100% Guaranteed to Work
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mac / Linux curl */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>macOS / Linux / Git Bash:</span>
              </span>
              <button
                onClick={() => copyTerminalOneLiner(curlCmd, 'curl')}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 font-mono text-xs text-cyan-300 overflow-x-auto select-all">
              {curlCmd}
            </div>
          </div>

          {/* Windows PowerShell */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                <span>Windows PowerShell:</span>
              </span>
              <button
                onClick={() => copyTerminalOneLiner(pwshCmd, 'pwsh')}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedPowerShell ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPowerShell ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 font-mono text-xs text-purple-300 overflow-x-auto select-all">
              {pwshCmd}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Quick Download Paths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Direct File Downloads (NO ZIP) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-lg space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Direct Files (No Zip)</span>
          </div>
          <h3 className="text-base font-bold text-white">Save Files Directly</h3>
          <p className="text-xs text-slate-400">
            Saves all 5 project scripts straight to your Downloads folder without any unzipping or archives needed.
          </p>
          <button
            onClick={downloadAllFilesDirectly}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download All Files (Direct)</span>
          </button>
        </div>

        {/* Card 2: 1-File Bootstrap Script */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-lg space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Standalone Installer</span>
          </div>
          <h3 className="text-base font-bold text-white">bootstrap.py Script</h3>
          <p className="text-xs text-slate-400">
            Download <code className="text-cyan-300">bootstrap.py</code> and run <code className="text-slate-300">python bootstrap.py</code> in terminal to auto-extract.
          </p>
          <a
            href="/install.py"
            download="bootstrap.py"
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            <span>Download bootstrap.py</span>
          </a>
        </div>

        {/* Card 3: Full Repo Zip */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <FolderArchive className="w-4 h-4" />
            <span>Standard Archive (.zip)</span>
          </div>
          <h3 className="text-base font-bold text-white">Full Repository ZIP</h3>
          <p className="text-xs text-slate-400">
            Downloads <code className="text-slate-300">sqlite-ai-agent-github-ready.zip</code> with all web &amp; Python files.
          </p>
          <button
            onClick={downloadZipBase64}
            disabled={downloadingZip}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingZip ? 'Preparing Zip...' : 'Download Project (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* WHY UNZIP FAILED EXPLANATION BOX */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/50 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Why did "unzip" fail on your computer?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>If you are on Windows (PowerShell / Command Prompt):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Windows does not have an <code className="text-rose-400 font-mono">unzip</code> command installed by default! If you type <code className="text-rose-400 font-mono">unzip filename.zip</code>, Windows gives an error.
            </p>
            <div className="text-cyan-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 mt-2">
              # Use this Windows PowerShell command instead:
              <br />
              Expand-Archive -Path sqlite-ai-agent-github-ready.zip -DestinationPath . -Force
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Universal Python Command (Works Everywhere):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Python comes with a built-in unzipper module that works 100% on Windows, Mac, and Linux:
            </p>
            <div className="text-indigo-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 mt-2">
              # Works on any OS that has Python installed:
              <br />
              python -m zipfile -e sqlite-ai-agent-github-ready.zip .
            </div>
          </div>
        </div>
      </div>

      {/* Individual File Downloader Grid */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Download Individual Files (No Unzipping Required)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any file to download it directly as a ready-to-run script:
            </p>
          </div>
          <button
            onClick={downloadAllFilesDirectly}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All 5 Files</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {files.map(file => (
            <div
              key={file.name}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-2.5 truncate mr-2">
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <div className="font-mono font-semibold text-white truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{file.title}</div>
                </div>
              </div>
              <button
                onClick={() => downloadSingleFile(file)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Steps */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
          Complete Terminal Upload Commands
        </h3>

        {steps.map((step, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-lg hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
              </div>
              <button
                onClick={() => copyToClipboard(step.code, idx)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto"
              >
                {copiedStep === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400">{step.desc}</p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
              <pre>{step.code}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* In-Browser Raw Code Viewer & Copier */}
      {files.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Direct File Content Inspector (Copy &amp; Paste Directly)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                If you prefer not downloading anything, copy the code directly into files created in VS Code or your editor:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedFileIdx}
                onChange={e => setSelectedFileIdx(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {files.map((f, i) => (
                  <option key={f.name} value={i}>
                    {f.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(files[selectedFileIdx].content);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
            <pre>{files[selectedFileIdx]?.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
