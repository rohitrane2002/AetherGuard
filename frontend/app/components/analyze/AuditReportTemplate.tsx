"use client";

import { CheckBadgeIcon, ShieldCheckIcon, ExclamationTriangleIcon, BoltIcon } from "@heroicons/react/24/solid";
import type { AnalysisResult } from "./types";

export default function AuditReportTemplate({ result }: { result: AnalysisResult; code: string }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const findings = result?.findings ?? [];
  const issuesList = result?.issues ?? [];
  const score = result?.score ?? 0;

  const issueCounts = {
    critical: findings.filter((f) => f?.severity === "critical").length,
    high: findings.filter((f) => f?.severity === "high").length,
    medium: findings.filter((f) => f?.severity === "medium").length,
    low: findings.filter((f) => f?.severity === "low").length,
  };

  return (
    <div className="mx-auto max-w-[1020px] bg-[#020617] font-sans text-white">
      {/* ── COVER PAGE ── */}
      <div className="flex min-h-[1440px] flex-col justify-between p-24">
        <div>
           <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-600 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
               <ShieldCheckIcon className="h-7 w-7 text-white" />
             </div>
             <h1 className="text-4xl font-bold tracking-tight text-white antialiased">AetherGuard <span className="text-slate-500">AI</span></h1>
           </div>
           
           <div className="mt-40 space-y-6">
             <div className="h-px w-24 bg-cyan-400" />
             <h2 className="text-7xl font-bold tracking-tighter text-white leading-[1.1]">
               Smart Contract <br /> Security Audit <br /> <span className="text-slate-500">Certificate.</span>
             </h2>
             <p className="max-w-2xl text-xl font-medium leading-relaxed text-slate-400">
               Automated formal verification, symbolic reasoning, and deep-learning pattern detection for Ethereum Virtual Machine (EVM) protocols.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-12 border-t border-white/10 pt-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500">Prepared For</p>
            <p className="mt-4 text-2xl font-semibold text-white">Confidential Protocol Workspace</p>
            <p className="mt-2 text-sm text-slate-400">ID: #AG-{result?.log_id || "7741-B"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-400">Certification Date</p>
            <p className="mt-4 text-2xl font-semibold text-white">{dateStr}</p>
            <p className="mt-2 text-sm text-slate-500">Authorized by AetherGuard Neural Audit Layer</p>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      <div className="p-24 py-32">
        <div className="flex items-start justify-between gap-12">
          <div className="flex-1 space-y-8">
            <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-cyan-400">01. Executive Overview</h3>
            <p className="text-xl leading-relaxed text-slate-300">
              {result?.explanation ?? "This audit represents a comprehensive scan of the provided Solidity source code using AetherGuard's multi-layered intelligence pipeline."}
            </p>
          </div>
          <div className="flex h-56 w-56 flex-col items-center justify-center rounded-[40px] border border-white/10 bg-[#0f172a] shadow-inner">
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Security Score</p>
             <div className="mt-4 text-7xl font-bold tracking-tighter text-white">{score}</div>
             <p className="mt-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest">{score >= 70 ? "CRITICAL" : score >= 40 ? "ELEVATED" : "OPTIMAL"}</p>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-4 gap-6 border-y border-white/5 py-16">
           {[
             { label: "Critical Risk", val: issueCounts.critical, color: "text-rose-500" },
             { label: "High Risk", val: issueCounts.high, color: "text-amber-400" },
             { label: "Medium Risk", val: issueCounts.medium, color: "text-cyan-400" },
             { label: "Low Risk", val: issueCounts.low, color: "text-emerald-400" },
           ].map((stat) => (
             <div key={stat.label}>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
               <p className={`mt-4 text-5xl font-bold ${stat.color}`}>{stat.val}</p>
             </div>
           ))}
        </div>
      </div>

      {/* ── METHODOLOGY ── */}
      <div className="p-24 py-32 bg-[#0a0a0a]">
        <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-fuchsia-400">02. Methodology</h3>
        <div className="mt-16 grid grid-cols-3 gap-12">
           {[
             { title: "Deterministic Rules", body: "Scan against over 100 known vulnerability patterns, including reentrancy, overflow, and access control bypasses." },
             { title: "Semantic Analysis", body: "AI-driven reasoning to detect logical flaws and authorization bypasses that static scanners frequently overlook." },
             { title: "Formal Synthesis", body: "Generation of exploit Proof-of-Concepts (PoC) to verify the impact and actionability of identified critical risks." }
           ].map((m, i) => (
             <div key={i} className="space-y-4">
                <p className="text-3xl font-bold text-white opacity-20">0{i+1}</p>
                <h4 className="text-lg font-bold text-white">{m.title}</h4>
                <p className="text-sm leading-7 text-slate-500">{m.body}</p>
             </div>
           ))}
        </div>
      </div>

      {/* ── DETAILED FINDINGS ── */}
      <div className="p-24 py-32">
        <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-amber-400">03. Vulnerability Disclosure</h3>
        <div className="mt-16 space-y-8">
           {findings.length > 0 ? findings.map((f, i) => (
             <div key={i} className="group rounded-[32px] border border-white/5 bg-[#0a0a0a] p-10 transition hover:border-white/10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`h-2 w-2 rounded-full ${f?.severity === "critical" ? "bg-rose-500" : f?.severity === "high" ? "bg-amber-400" : "bg-cyan-400"}`} />
                   <h4 className="text-xl font-bold text-white">{f?.label}</h4>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{f?.severity} intensity</span>
               </div>
               <p className="mt-6 text-[15px] leading-8 text-slate-400">{f?.summary}</p>
               <div className="mt-8 flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400 opacity-60">
                 <span>Position: Line {f?.line_numbers?.[0] || "?"}</span>
                 <span>Ref: #AG-VULN-{i+100}</span>
               </div>
             </div>
           )) : (
             <div className="rounded-[32px] border border-emerald-500/10 bg-emerald-500/5 p-16 text-center">
               <ShieldCheckIcon className="mx-auto h-12 w-12 text-emerald-400 opacity-20" />
               <p className="mt-6 text-xl font-semibold text-emerald-100">Clean Protocol Synthesis</p>
               <p className="mt-2 text-sm text-emerald-500">No high-risk vectors were isolated in this scan iteration.</p>
             </div>
           )}
        </div>
      </div>

      {/* ── REMEDIATION ── */}
      <div className="bg-[#0f172a] p-24 py-32">
        <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-emerald-400">04. Secure Patcher</h3>
        <p className="mt-6 text-slate-400 max-w-2xl">The following secure rewrite has been synthesized by the AI reasoner to resolve the identified risk surface.</p>
        <div className="mt-12 overflow-hidden rounded-[32px] border border-white/10 bg-black/40">
           <div className="border-b border-white/5 bg-white/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">
             Solidity Remediation Draft
           </div>
           <pre className="p-8 text-[13px] leading-7 text-cyan-50/90 font-mono">
            <code>{result?.fix || "// Audit result verified as secure."}</code>
          </pre>
        </div>
      </div>

      {/* ── POF ── */}
      {result?.poc_test && (
        <div className="p-24 py-32 border-t border-white/5">
          <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-rose-500">05. Exploit Evidence</h3>
          <div className="mt-12 rounded-[32px] border border-rose-500/10 bg-rose-500/[0.03] p-10">
             <pre className="text-[13px] leading-7 text-slate-400 font-mono overflow-hidden">
              <code>{result.poc_test}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ── FINAL SEAL ── */}
      <div className="flex flex-col items-center justify-center bg-[#020617] p-32 text-center">
         <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/5 opacity-40">
           <ShieldCheckIcon className="h-10 w-10 text-white" />
         </div>
         <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.6em] text-slate-500">AetherGuard Protocol Defense Layer</p>
         <p className="mt-4 text-sm text-slate-600">The contents of this report are the result of automated algorithmic synthesis and neural reasoning. <br /> Always conduct a secondary manual review before deploying a bridge or liquidity pool.</p>
         <p className="mt-20 text-[10px] text-slate-700">© 2026 AetherGuard. San Francisco, CA.</p>
      </div>
    </div>
  );
}



