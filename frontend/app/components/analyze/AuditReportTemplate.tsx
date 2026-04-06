"use client";

import { CheckBadgeIcon, ShieldCheckIcon, ExclamationTriangleIcon, BoltIcon } from "@heroicons/react/24/solid";
import type { AnalysisResult } from "./types";

export default function AuditReportTemplate({ result, code }: { result: AnalysisResult; code: string }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const issueCounts = {
    critical: result.findings?.filter((f) => f.severity === "critical").length ?? 0,
    high: result.findings?.filter((f) => f.severity === "high").length ?? 0,
    medium: result.findings?.filter((f) => f.severity === "medium").length ?? 0,
    low: result.findings?.filter((f) => f.severity === "low").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-[1020px] bg-[#020617] p-12 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-600 shadow-lg shadow-cyan-500/20">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">AetherGuard</h1>
          </div>
          <p className="mt-2 text-sm uppercase tracking-[0.4em] text-slate-500">Security Audit Certificate</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Report ID: #AG-{result.log_id || "TEMP"}</p>
          <p className="mt-1 text-sm text-slate-500">{dateStr}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[32px] border border-[#1e293b] bg-[#0f172a] p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Overall Security Posture</p>
          <div className="mt-8 flex items-end gap-4">
            <div className="text-8xl font-bold tracking-tighter text-white">{result.score}</div>
            <div className="mb-3 text-2xl font-medium text-slate-400">/ 100</div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#020617]">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${
                result.score >= 70 ? "from-rose-500 to-rose-400" : 
                result.score >= 40 ? "from-amber-500 to-amber-400" : 
                "from-emerald-500 to-cyan-400"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mt-6 text-sm text-slate-400 leading-7">
            This score represents the weighted risk across {result.issues.length} detected vulnerabilities, privilege surfaces, and arithmetic hygiene found in the provided contract.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Critical", value: issueCounts.critical, color: "text-rose-400", bg: "bg-[#2a0c10]", border: "border-[#451216]" },
            { label: "High", value: issueCounts.high, color: "text-amber-400", bg: "bg-[#2d2006]", border: "border-[#453208]" },
            { label: "Medium", value: issueCounts.medium, color: "text-cyan-400", bg: "bg-[#082b33]", border: "border-[#0c3e4a]" },
            { label: "Low", value: issueCounts.low, color: "text-emerald-400", bg: "bg-[#062d17]", border: "border-[#0c4524]" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-3xl border p-6 ${stat.bg} ${stat.border}`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">{stat.label}</p>
              <p className={`mt-3 text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <CheckBadgeIcon className="h-6 w-6 text-cyan-300" />
          Executive Summary
        </h2>
        <div className="mt-6 rounded-3xl border border-[#1e293b] bg-[#0f172a] p-8 text-sm leading-8 text-slate-300">
          {result.explanation}
        </div>
      </div>

      {/* Findings */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
          Detailed Findings
        </h2>
        <div className="mt-8 space-y-4">
          {result.findings && result.findings.length > 0 ? (
            result.findings.map((f, i) => (
              <div key={i} className="rounded-3xl border border-[#1e293b] bg-[#0f172a] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{f.label}</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest border border-[#1e293b] bg-[#020617] text-slate-300`}>
                    {f.severity}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-400">{f.summary}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <BoltIcon className="h-4 w-4" />
                  Line(s): {f.line_numbers.join(", ")}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-[#064e3b] bg-[#022c22] p-8 text-center text-emerald-200">
              No vulnerabilities detected by the AetherGuard Intelligence Layer.
            </div>
          )}
        </div>
      </div>

      {/* Remediation */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Proposed Remediation</h2>
        <div className="mt-6 rounded-3xl border border-[#1e293b] bg-[#020617] p-8">
           <pre className="overflow-x-auto text-[13px] leading-6 text-cyan-50 font-mono">
            <code>{result.fix}</code>
          </pre>
        </div>
      </div>

       {/* PoC */}
       {result.poc_test && (
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <BoltIcon className="h-6 w-6 text-fuchsia-400" />
            Exploit Proof-of-Concept
          </h2>
          <div className="mt-6 rounded-3xl border border-[#4a044e] bg-[#2a022e] p-8">
             <pre className="overflow-x-auto text-[13px] leading-6 text-slate-300 font-mono">
              <code>{result.poc_test}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 border-t border-[#1e293b] pt-8 flex items-center justify-between opacity-50">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Official AetherGuard Security Output</p>
        <p className="text-xs text-slate-500">© 2026 AetherGuard AI. All rights reserved.</p>
      </div>
    </div>
  );
}

