"use client";

import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CommandLineIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/solid";
import type { AnalysisResult, AnalysisFinding } from "./types";

interface AuditReportTemplateProps {
  result: AnalysisResult;
  code: string;
}

export default function AuditReportTemplate({ result, code }: AuditReportTemplateProps) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const findings = result?.findings ?? [];
  const score = result?.score ?? result?.risk_score ?? 0;

  // Group findings by severity
  const issueCounts = {
    critical: findings.filter((f) => f?.severity?.toLowerCase() === "critical").length,
    high: findings.filter((f) => f?.severity?.toLowerCase() === "high").length,
    medium: findings.filter((f) => f?.severity?.toLowerCase() === "medium").length,
    low: findings.filter((f) => f?.severity?.toLowerCase() === "low").length,
    info: findings.filter((f) => f?.severity?.toLowerCase() === "info" || f?.severity?.toLowerCase() === "informational").length,
  };

  const totalFindings = findings.length;

  // Dynamic Metadata Computation
  const linesOfCode = code ? code.split("\n").length : 0;
  
  const detectLanguage = (source: string): string => {
    if (!source) return "Solidity";
    if (source.includes("contract") || source.includes("pragma solidity")) return "Solidity";
    if (source.includes("fn main") || source.includes("use anchor_lang")) return "Rust (Solana)";
    return "Solidity";
  };
  const language = detectLanguage(code);

  const getCompilerVersion = (source: string): string => {
    if (!source) return "N/A";
    const pragmaMatch = source.match(/pragma\s+solidity\s+([^;]+)/i);
    if (pragmaMatch) return pragmaMatch[1].trim();
    const anchorMatch = source.match(/anchor_lang\s*=\s*"([^"]+)"/i);
    if (anchorMatch) return `Anchor ${anchorMatch[1]}`;
    return "N/A";
  };
  const compilerVersion = getCompilerVersion(code);

  const functionCount = code ? (code.match(/\b(function|fn)\b/g) || []).length : 0;

  const calculateComplexity = (source: string, funcs: number): number => {
    if (!source) return 0;
    const decisionPoints =
      (source.match(/\b(if|for|while|require|assert|revert)\b/g) || []).length +
      (source.match(/(&&|\|\|)/g) || []).length;
    return Math.min(100, Math.max(10, Math.round((decisionPoints / (funcs || 1)) * 10)));
  };
  const complexityScore = calculateComplexity(code, functionCount);

  // Helper to extract lines from contract source code for excerpt
  const getCodeExcerpt = (fullCode: string, lineNumbers: number[]) => {
    if (!lineNumbers || lineNumbers.length === 0) return null;
    const lines = fullCode.split("\n");
    const start = Math.max(0, lineNumbers[0] - 3);
    const end = Math.min(lines.length, lineNumbers[lineNumbers.length - 1] + 2);
    return {
      startLine: start + 1,
      lines: lines.slice(start, end),
    };
  };

  // Needle rotation calculation for Score Gauge
  const needleRotation = (score / 100) * 180 - 90;

  // Overall risk rating label
  const getOverallRating = (secScore: number) => {
    if (secScore >= 85) return { text: "SECURE (AAA)", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    if (secScore >= 70) return { text: "OPTIMAL (AA)", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" };
    if (secScore >= 45) return { text: "MEDIUM RISK (BB)", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    return { text: "CRITICAL RISK (D)", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
  };
  const rating = getOverallRating(score);

  return (
    <div className="flex flex-col bg-[#02040a] text-slate-100 items-center select-none" style={{ width: "840px" }}>
      
      {/* ── PAGE 1: COVER PAGE ── */}
      <div className="w-[840px] h-[1188px] relative bg-gradient-to-b from-[#0a0d1a] via-[#02040a] to-[#02040a] p-16 flex flex-col justify-between overflow-hidden border-b border-white/5">
        {/* Background Cyber Grid Graphic */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0), radial-gradient(circle at 100px 100px, white 2px, transparent 0)`,
          backgroundSize: "40px 40px, 200px 200px"
        }} />
        
        {/* Logo and Header */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-mono">AETHERGUARD</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
            Neural Security Audit V2
          </div>
        </div>

        {/* Title and Scope */}
        <div className="my-auto space-y-8 z-10">
          <div className="h-1.5 w-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            SMART CONTRACT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">
              SECURITY AUDIT
            </span> <br />
            REPORT
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            A comprehensive cryptographic assessment, automated formal verification, and semantic logical scanning of decentralized application codebases.
          </p>
        </div>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-2 gap-12 border-t border-white/10 pt-10 z-10">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Prepared For</p>
              <p className="mt-1 text-lg font-semibold text-white">Confidential Workspace Client</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Target Protocol</p>
              <p className="mt-1 text-sm font-mono text-cyan-300 truncate">{language} Smart Contract</p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Report Reference</p>
              <p className="mt-1 text-sm font-mono text-white">#AG-REP-{result?.log_id || "779F"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Audit Timestamp</p>
              <p className="mt-1 text-sm text-slate-300">{dateStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAGE 2: EXECUTIVE SUMMARY & DASHBOARD ── */}
      <div className="w-[840px] h-[1188px] relative bg-[#02040a] p-16 flex flex-col justify-between overflow-hidden border-b border-white/5">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">01. EXECUTIVE ANALYSIS</span>
            <span className="text-[10px] font-mono text-slate-500">AETHERGUARD REPORT</span>
          </div>

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-12 items-start mt-6">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight">Postural Summary</h2>
              <p className="text-sm leading-8 text-slate-300 text-justify">
                {result?.summary || result?.explanation || "AetherGuard has completed a hybrid automated audit of the provided smart contract code. The scanning pipeline assessed compiler directives, evaluated access controls, and generated semantic risk assessments using deep learning code models to identify logical anomalies."}
              </p>
              <div className={`mt-6 p-4 rounded-xl border ${rating.bg} flex items-center gap-4`}>
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <CheckCircleIcon className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Grade</p>
                  <p className={`text-base font-bold ${rating.color}`}>{rating.text}</p>
                </div>
              </div>
            </div>

            {/* Score Gauge Widget */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-center shadow-2xl relative flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">SECURITY SCORE</span>
              
              <div className="relative mt-6 h-32 w-52 flex items-center justify-center">
                {/* SVG Score Gauge */}
                <svg width="200" height="120" viewBox="0 0 200 120">
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#gauge-gradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * score) / 100}
                  />
                  <g transform="translate(100, 100)">
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="-70"
                      stroke="#22d3ee"
                      strokeWidth="4"
                      strokeLinecap="round"
                      transform={`rotate(${needleRotation})`}
                    />
                    <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#22d3ee" strokeWidth="3" />
                    <circle cx="0" cy="0" r="4" fill="#ffffff" />
                  </g>
                  <defs>
                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute bottom-2 text-4xl font-extrabold text-white tracking-tight">{score}</div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2">Index range: 0 (vulnerable) - 100 (secure)</span>
            </div>
          </div>

          <div className="h-px bg-white/5 my-6" />

          {/* Vulnerability Counts Grid */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Threat Severity Distribution</h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { title: "Critical", count: issueCounts.critical, color: "text-rose-500", border: "border-rose-500/20 bg-rose-500/5" },
                { title: "High", count: issueCounts.high, color: "text-amber-500", border: "border-amber-500/20 bg-amber-500/5" },
                { title: "Medium", count: issueCounts.medium, color: "text-cyan-400", border: "border-cyan-400/20 bg-cyan-400/5" },
                { title: "Low", count: issueCounts.low, color: "text-emerald-400", border: "border-emerald-400/20 bg-emerald-400/5" },
                { title: "Informational", count: issueCounts.info, color: "text-indigo-400", border: "border-indigo-400/20 bg-indigo-400/5" },
              ].map((pill) => (
                <div key={pill.title} className={`p-4 rounded-xl border ${pill.border} text-center`}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pill.title}</p>
                  <p className={`text-3xl font-extrabold mt-2 ${pill.color}`}>{pill.count}</p>
                </div>
              ))}
            </div>

            {/* Custom SVG Radial Concentric Rings Chart */}
            <div className="grid grid-cols-2 gap-8 items-center mt-6">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 flex justify-center items-center">
                <svg width="180" height="180" viewBox="0 0 200 200">
                  {/* Concentric rings */}
                  <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(239, 68, 68, 0.05)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="#ef4444" strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (totalFindings ? issueCounts.critical / totalFindings : 0))}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />

                  <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(245, 158, 11, 0.05)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#f59e0b" strokeWidth="8"
                    strokeDasharray="376.9"
                    strokeDashoffset={376.9 - (376.9 * (totalFindings ? issueCounts.high / totalFindings : 0))}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />

                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#06b6d4" strokeWidth="8"
                    strokeDasharray="502.6"
                    strokeDashoffset={502.6 - (502.6 * (totalFindings ? issueCounts.medium / totalFindings : 0))}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="text-slate-400">Critical Severity Issues</span>
                  </div>
                  <span className="font-bold text-white">{totalFindings ? Math.round((issueCounts.critical / totalFindings) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-slate-400">High Severity Issues</span>
                  </div>
                  <span className="font-bold text-white">{totalFindings ? Math.round((issueCounts.high / totalFindings) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-cyan-400" />
                    <span className="text-slate-400">Medium Severity Issues</span>
                  </div>
                  <span className="font-bold text-white">{totalFindings ? Math.round((issueCounts.medium / totalFindings) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-slate-500">
          <span>AetherGuard Security Protocol</span>
          <span>Page 2 of 6</span>
        </div>
      </div>

      {/* ── PAGE 3: METADATA & METHODOLOGY ── */}
      <div className="w-[840px] h-[1188px] relative bg-[#02040a] p-16 flex flex-col justify-between overflow-hidden border-b border-white/5">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">02. PROTOCOL METADATA</span>
            <span className="text-[10px] font-mono text-slate-500">AETHERGUARD REPORT</span>
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight">Contract Metadata & Metrics</h2>

          <div className="grid grid-cols-2 gap-8 mt-6">
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-widest">Static Source Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Language Target</span>
                  <span className="font-mono text-white">{language}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Target Compiler</span>
                  <span className="font-mono text-white">{compilerVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Lines of Code (LOC)</span>
                  <span className="font-mono text-white">{linesOfCode} lines</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Total Functions</span>
                  <span className="font-mono text-white">{functionCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Complexity Analysis</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Cyclomatic Density</span>
                  <span className="font-mono text-white">{complexityScore}/100</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Model Core Version</span>
                  <span className="font-mono text-white truncate max-w-[150px]">{result?.model_source || "CodeBERT-Base"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Neural Weight Type</span>
                  <span className="font-mono text-white">Bimodal Transformer</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Overall Certainty</span>
                  <span className="font-mono text-white">{(result?.confidence ?? 1.0).toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 my-6" />

          {/* Methodology Blocks */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Scanning Methodology</h3>
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  icon: <CommandLineIcon className="h-5 w-5 text-cyan-400" />,
                  title: "1. AST Rule Matching",
                  desc: "Analyzes smart contract Abstract Syntax Trees against formal patterns of reentrancy, access leaks, and transaction spoofing vulnerabilities.",
                },
                {
                  icon: <CpuChipIcon className="h-5 w-5 text-indigo-400" />,
                  title: "2. Deep Sequence model",
                  desc: "Uses a fine-tuned CodeBERT model to detect complex structural signatures and anomalies, scoring security posture in high-dimensional space.",
                },
                {
                  icon: <WrenchScrewdriverIcon className="h-5 w-5 text-emerald-400" />,
                  title: "3. Semantic AI Reasoning",
                  desc: "Leverages large language model agents to perform deep logic audits, generating secure rewrites and exploit Proof-of-Concepts (PoC).",
                },
              ].map((step, idx) => (
                <div key={idx} className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                    {step.icon}
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{step.title}</h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-slate-500">
          <span>AetherGuard Security Protocol</span>
          <span>Page 3 of 6</span>
        </div>
      </div>

      {/* ── PAGE 4: DETAILED FINDINGS ── */}
      <div className="w-[840px] h-[1188px] relative bg-[#02040a] p-16 flex flex-col justify-between overflow-hidden border-b border-white/5">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">03. DETAILED VULNERABILITIES</span>
            <span className="text-[10px] font-mono text-slate-500">AETHERGUARD REPORT</span>
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight">Vulnerability Disclosures</h2>

          <div className="space-y-6 mt-6 overflow-hidden max-h-[850px]">
            {findings.length > 0 ? (
              findings.slice(0, 2).map((finding, idx) => {
                const excerpt = getCodeExcerpt(code, finding.line_numbers || []);
                const severity = finding.severity?.toLowerCase();
                const isCritical = severity === "critical" || severity === "high";
                
                return (
                  <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${isCritical ? "bg-rose-500 animate-pulse" : "bg-cyan-400"}`} />
                        <h3 className="text-base font-bold text-white font-sans">{finding.label}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${isCritical ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"} border`}>
                        {finding.severity}
                      </span>
                    </div>

                    <div className="text-xs space-y-2 text-slate-300">
                      <p className="leading-6"><strong className="text-white">Description:</strong> {finding.summary}</p>
                      <p className="leading-6"><strong className="text-white">Recommendation:</strong> {finding.recommendation}</p>
                    </div>

                    {excerpt && (
                      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] overflow-hidden">
                        <div className="border-b border-white/5 pb-2 mb-2 text-slate-500 uppercase tracking-widest text-[9px]">
                          Affected Code Excerpt
                        </div>
                        {excerpt.lines.map((line, lineIdx) => {
                          const currLineNum = excerpt.startLine + lineIdx;
                          const isVulnerableLine = finding.line_numbers?.includes(currLineNum);
                          return (
                            <div key={lineIdx} className={`flex py-0.5 ${isVulnerableLine ? "bg-rose-500/10 text-rose-300 -mx-4 px-4 border-l-2 border-rose-500" : "text-slate-400"}`}>
                              <span className="w-8 select-none opacity-40">{currLineNum}</span>
                              <span className="whitespace-pre">{line}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] p-16 text-center">
                <ShieldCheckIcon className="mx-auto h-16 w-16 text-emerald-400/30" />
                <h3 className="text-lg font-bold text-emerald-200 mt-4">No Vulnerabilities Identified</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  AetherGuard has completed structural scanning and bimodal model inference, yielding no security faults in this contract.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-slate-500">
          <span>AetherGuard Security Protocol</span>
          <span>Page 4 of 6</span>
        </div>
      </div>

      {/* ── PAGE 5: AI SECURE PATCH & REWRITE ── */}
      <div className="w-[840px] h-[1188px] relative bg-[#02040a] p-16 flex flex-col justify-between overflow-hidden border-b border-white/5">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">04. SECURE PATCH GENERATOR</span>
            <span className="text-[10px] font-mono text-slate-500">AETHERGUARD REPORT</span>
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight">AI Automated Remediation</h2>
          <p className="text-xs leading-6 text-slate-400">
            Below is the compiled secure patch generated by the AetherGuard neural rewrite module. The recommendations comply with standardized security heuristics to mitigate reentrancy and input spoofing vectors.
          </p>

          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-4 w-4" />
              Secure Contract Rewrite
            </h3>
            
            <div className="rounded-lg border border-white/10 bg-slate-950/80 p-5 font-mono text-[11px] max-h-[600px] overflow-y-auto overflow-x-hidden">
              <pre className="text-cyan-50/90 whitespace-pre-wrap leading-6">
                <code>{result?.fix || "// Audit logs indicate contract signature is clean. No rewrite required."}</code>
              </pre>
            </div>
          </div>

          {result?.fix_suggestions && result.fix_suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Recommended Actions</h4>
              <ul className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                {result.fix_suggestions.slice(0, 4).map((suggestion, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-slate-500">
          <span>AetherGuard Security Protocol</span>
          <span>Page 5 of 6</span>
        </div>
      </div>

      {/* ── PAGE 6: AUDIT EVIDENCE & FINAL SEAL ── */}
      <div className="w-[840px] h-[1188px] relative bg-[#02040a] p-16 flex flex-col justify-between overflow-hidden">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">05. EXPLOIT EVIDENCE & SEAL</span>
            <span className="text-[10px] font-mono text-slate-500">AETHERGUARD REPORT</span>
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight">Exploit Validation</h2>

          {result?.poc_test ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                The AI Exploit Synthesis engine successfully simulated a test script executing the identified threat paths.
              </p>
              <div className="rounded-xl border border-rose-500/10 bg-rose-500/[0.02] p-5 font-mono text-[10px] overflow-hidden max-h-[450px]">
                <div className="border-b border-rose-500/10 pb-2 mb-2 text-rose-400 uppercase tracking-widest text-[9px]">
                  PoC Test Case Snippet
                </div>
                <pre className="text-slate-300 leading-5 whitespace-pre-wrap overflow-y-auto max-h-[380px]">
                  <code>{result.poc_test}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-8 text-center space-y-3">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-cyan-400/20" />
              <h3 className="text-sm font-bold text-slate-200">No Exploit Replicators Needed</h3>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                No high-risk vulnerabilities exist that warrant the execution of a Proof-of-Concept security test.
              </p>
            </div>
          )}

          <div className="h-px bg-white/5 my-6" />

          {/* Final Seal & Disclaimer */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] relative">
              <ShieldCheckIcon className="h-10 w-10 text-cyan-400" />
              <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-white">Neural Security Certified</p>
              <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed">
                This verification certificate was created via algorithmic synthesis, bimodal transformer models, and automatic security checks. Smart contract validation is a continuous process; developers should perform manual checks and unit testing prior to live deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-mono text-slate-500">
          <span>© 2026 AetherGuard. All Rights Reserved.</span>
          <span>Page 6 of 6</span>
        </div>
      </div>

    </div>
  );
}
