"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoltIcon,
  CheckBadgeIcon,
  CodeBracketSquareIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";

import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { exportPdf } from "../components/PdfExporter";
import ContractEditorPanel from "../components/analyze/ContractEditorPanel";
import CopilotPanel from "../components/analyze/CopilotPanel";
import ScanProgressPanel from "../components/analyze/ScanProgressPanel";
import { buildLineInsights } from "../components/analyze/editorInsights";
import AuditReportTemplate from "../components/analyze/AuditReportTemplate";
import type { AnalysisResult, CopilotMessage } from "../components/analyze/types";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

const STARTER_CONTRACT = `pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient balance");
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] -= amount;
    }
}`;

const severityTone: Record<string, string> = {
  critical: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  high: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  medium: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  low: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
};

const countTone: Record<"critical" | "high" | "medium", string> = {
  critical: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  high: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  medium: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
};

const fullScanSteps = [
  ["Rule Engine Analysis", "Running deterministic pattern checks for Reentrancy and Access Control."],
  ["AI Logic Audit", "Engaging the neural logic layers to find deep semantic flaws or logic bypasses."],
  ["Vulnerability Scoring", "Evaluating cumulative risks and building the weighted security score."],
  ["AI Reasoner Choice", "Consulting the LLM brain for audit explanations, Proof-of-Concepts, and secure rewrites."],
] as const;



const liveScanSteps = [
  ["Watching code changes", "Debounced live scanner monitoring the current buffer."],
  ["Checking reentrancy", "Looking for external-call patterns in active functions."],
  ["Refreshing issue rail", "Updating score and vulnerability clusters in the workspace."],
] as const;

function buildProgressSteps(
  progressIndex: number,
  items: readonly (readonly [string, string])[],
  complete: boolean
) {
  return items.map(([label, detail], index) => ({
    label,
    detail,
    state: complete || progressIndex > index ? "done" : progressIndex === index ? "active" : "waiting",
  })) as Array<{ label: string; detail: string; state: "waiting" | "active" | "done" }>;
}

export default function AnalyzePage() {
  const { ready } = useProtectedRoute();
  const [code, setCode] = useState(STARTER_CONTRACT);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [liveResult, setLiveResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [fixing, setFixing] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lastFixedCode, setLastFixedCode] = useState<string | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(-1);
  const [liveStepIndex, setLiveStepIndex] = useState(-1);
  const lastCriticalToast = useRef<string | null>(null);

  const runAnalysis = async (source: string, live = false) => {
    const response = await authFetch(`${API_BASE_URL}${live ? "/analyze/live" : "/analyze/"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: source }),
    });
    if (isUnauthorizedStatus(response.status)) {
      redirectToAuth(true);
      return null;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Analysis failed");
    }
    return data as AnalysisResult;
  };

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      if (!code.trim()) return;
      try {
        setLiveLoading(true);
        setLiveStepIndex(0);
        const data = await runAnalysis(code, true);
        if (data) setLiveResult(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLiveLoading(false);
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [code, ready]);

  useEffect(() => {
    if (!loading) {
      setScanStepIndex(-1);
      return;
    }
    setScanStepIndex(0);
    const timer = window.setInterval(() => {
      setScanStepIndex((current) => Math.min(current + 1, fullScanSteps.length - 1));
    }, 720);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!liveLoading) {
      setLiveStepIndex(-1);
      return;
    }
    setLiveStepIndex(0);
    const timer = window.setInterval(() => {
      setLiveStepIndex((current) => Math.min(current + 1, liveScanSteps.length - 1));
    }, 520);
    return () => window.clearInterval(timer);
  }, [liveLoading]);

  const analyze = async () => {
    try {
      setLoading(true);
      const data = await runAnalysis(code, false);
      if (!data) return;
      setResult(data);
      toast.success("AI audit completed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const fixContract = async () => {
    const originalCode = code;
    try {
      setFixing(true);
      const response = await authFetch(`${API_BASE_URL}/fix-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: code }),
      });
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Fix generation failed");
        return;
      }
      setLastFixedCode(data.fixed_code);
      setCode(data.fixed_code);
      setCopilotMessages((current) => [
        ...current,
        { role: "assistant", content: `${data.summary}\n\nChanges:\n- ${data.highlighted_changes.join("\n- ")}` },
      ]);
      const changedLineIndex = data.fixed_code
        .split("\n")
        .findIndex((line: string, index: number) => line !== (originalCode.split("\n")[index] ?? ""));
      setSelectedLine(changedLineIndex >= 0 ? changedLineIndex + 1 : null);
      toast.success("Fix suggestions applied to workspace");
    } finally {
      setFixing(false);
    }
  };

  const streamCopilot = async (prompt: string) => {
    setSending(true);
    setCopilotMessages((current) => [...current, { role: "user", content: prompt }, { role: "assistant", content: "" }]);
    const response = await authFetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${prompt}\n\nCurrent contract:\n${code}` }),
    });
    if (!response.ok || !response.body) {
      setSending(false);
      toast.error("Copilot unavailable");
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setCopilotMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: text.trim() };
        return next;
      });
    }
    setSending(false);
  };

  const sendCopilot = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    setChatInput("");
    await streamCopilot(prompt);
  };

  const activeResult = result ?? liveResult;
  const lineInsights = useMemo(
    () => buildLineInsights(code, activeResult?.findings ?? [], lastFixedCode),
    [code, activeResult?.findings, lastFixedCode]
  );

  useEffect(() => {
    if (!activeResult || activeResult.risk_score < 70 || !activeResult.findings.length) return;
    const topFinding = activeResult.findings[0];
    const toastKey = `${activeResult.log_id}:${topFinding.slug}:${activeResult.risk_score}`;
    if (lastCriticalToast.current === toastKey) return;
    lastCriticalToast.current = toastKey;
    toast.error(`Critical vulnerability detected: ${topFinding.label}`);
  }, [activeResult]);

  const issueCounts = useMemo(() => {
    const findings = activeResult?.findings ?? [];
    if (!findings.length && activeResult?.issues.length) {
      // Use fallback issues from modular engine
      return {
        critical: activeResult.severity === "high" ? 1 : 0,
        high: activeResult.severity === "medium" && activeResult.score >= 50 ? 1 : 0,
        medium: activeResult.severity === "low" && activeResult.score > 0 ? 1 : 0,
      };
    }
    return {
      critical: findings.filter((item) => item.severity === "critical").length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
    };
  }, [activeResult]);

  const confidenceLabel = activeResult ? `${Math.round(activeResult.confidence * 100)}%` : "--";
  const scanProgress = loading ? Math.round(((scanStepIndex + 1) / fullScanSteps.length) * 100) : result ? 100 : 0;
  const liveProgress = liveLoading ? Math.round(((liveStepIndex + 1) / liveScanSteps.length) * 100) : liveResult ? 100 : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1520px] space-y-6">
        <SectionHeading
          eyebrow="AI Workspace"
          title="Scan, explain, and secure contracts in one premium command deck."
          subtitle="AetherGuard now treats analysis like a live engineering workflow: structured scan phases, line-level risk guidance, a short-form AI explainer, and audit outputs designed for real production use."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Live posture" value={activeResult?.severity ?? activeResult?.prediction ?? "watching"} helper={liveLoading ? "Refreshing signals..." : "Real-time scanner online"} />
          <StatCard label="Confidence" value={confidenceLabel} helper="Model certainty on active context" accent="violet" />
          <StatCard label="Remaining scans" value={activeResult ? String(activeResult.remaining_today) : "--"} helper="Daily premium allowance" accent="emerald" />
          <StatCard label="Current plan" value={activeResult ? `${activeResult.score ?? activeResult.risk_score ?? "--"}/100` : "--"} helper="Security score across the active contract" accent="amber" />
        </div>

        <ContractEditorPanel
          code={code}
          onChange={(value) => {
            setCode(value);
            setSelectedLine(null);
          }}
          loading={loading}
          liveLoading={liveLoading}
          insights={lineInsights}
          selectedLine={selectedLine}
          onSelectLine={setSelectedLine}
          onAnalyze={analyze}
          onFix={fixContract}
          onExport={() => exportPdf("audit-report-export")}
          fixing={fixing}

        />

        {/* Hidden PDF Export Container (Off-screen for canvas capture) */}
        <div style={{ position: "absolute", left: "-9999px", top: 0, visibility: "visible" }} aria-hidden="true">
          <div id="audit-report-export" style={{ width: "1024px" }}>
            {activeResult && <AuditReportTemplate result={activeResult} code={code} />}
          </div>
        </div>



        <div className="space-y-6">
          <div>
            <Panel className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Threat snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Security posture</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    Executive-grade risk framing for the active contract, tuned for engineers, founders, and security reviewers.
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {activeResult ? `${activeResult.prediction} risk profile` : "Waiting for scan signal"}
                </div>
              </div>

              <div className="grid items-start gap-4 xl:grid-cols-[0.84fr_1.16fr]">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Risk score</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white">
                      {activeResult?.risk_score ?? 0 >= 70 ? "Critical" : activeResult?.risk_score ?? 0 >= 40 ? "Elevated" : "Stable"}
                    </span>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-950/90">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (activeResult?.risk_score ?? 0) >= 70
                          ? "bg-gradient-to-r from-rose-400 via-rose-500 to-blue-950"
                          : (activeResult?.risk_score ?? 0) >= 40
                          ? "bg-gradient-to-r from-amber-300 via-amber-400 to-slate-900"
                          : "bg-gradient-to-r from-emerald-300 via-cyan-400 to-slate-900"
                      }`}
                      style={{ width: `${activeResult?.risk_score ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div className="text-6xl font-semibold tracking-tight text-white">{activeResult?.score ?? activeResult?.risk_score ?? 0}</div>
                    <div className="max-w-[12rem] text-right text-sm leading-6 text-slate-400">
                      Weighted contract exposure across exploitable flows, privilege surfaces, and arithmetic hygiene.
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["critical", issueCounts.critical, "Funds-at-risk paths"],
                    ["high", issueCounts.high, "Privilege or treasury issues"],
                    ["medium", issueCounts.medium, "Arithmetic or hygiene concerns"],
                  ].map(([label, value, helper]) => (
                    <div
                      key={label}
                      className={`rounded-[24px] border p-5 ${countTone[label as "critical" | "high" | "medium"]}`}
                    >
                      <p className="text-[11px] uppercase tracking-[0.26em] text-slate-300">{label}</p>
                      <div className="mt-5 text-5xl font-semibold leading-none text-white">{value}</div>
                      <p className="mt-4 text-sm leading-6 text-slate-300/85">{helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[0.34fr_0.34fr_0.32fr]">
            <ScanProgressPanel
              steps={buildProgressSteps(scanStepIndex, fullScanSteps, !loading && Boolean(result))}
              progress={scanProgress}
            />
            <ScanProgressPanel
              steps={buildProgressSteps(liveStepIndex, liveScanSteps, !liveLoading && Boolean(liveResult))}
              progress={liveProgress}
              live
            />
            <CopilotPanel
              messages={copilotMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={sendCopilot}
              onQuickPrompt={(prompt) => {
                setChatInput("");
                void streamCopilot(prompt);
              }}
              sending={sending}
            />
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.58fr_0.42fr]">
          <div className="space-y-6">
            <Panel id="audit-report" className="self-start">
              <div className="flex items-center gap-3">
                <CodeBracketSquareIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Audit intelligence</h2>
                  <p className="text-sm text-slate-400">Summary, score, remediation guidance, and PDF-friendly reporting in one place.</p>
                </div>
              </div>
              {activeResult ? (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    <StatCard label="Security score" value={`${activeResult.risk_score}`} helper={activeResult.prediction} accent={activeResult.risk_score >= 70 ? "rose" : activeResult.risk_score >= 40 ? "amber" : "emerald"} />
                    <StatCard label="Reentrancy" value={String(activeResult.findings.filter((item) => item.slug.includes("reentrancy")).length)} helper="Value transfer risks" accent="rose" />
                    <StatCard label="Access Control" value={String(activeResult.findings.filter((item) => item.slug.includes("access")).length)} helper="Privilege boundaries" accent="amber" />
                    <StatCard label="Overflow" value={String(activeResult.findings.filter((item) => item.slug.includes("overflow")).length)} helper="Arithmetic concerns" accent="emerald" />
                  </div>

                  <div className="panel-sheen rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Contract summary</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{activeResult.explanation ?? activeResult.summary}</p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Fix suggestions</p>
                    <ul className="mt-4 space-y-3 text-sm text-slate-300">
                      {activeResult.fix_suggestions.map((suggestion) => (
                        <li key={suggestion} className="flex gap-3">
                          <WrenchScrewdriverIcon className="mt-0.5 h-4 w-4 text-cyan-300" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                  Start typing to receive live AI risk feedback and run the premium audit when ready.
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel>
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Issue families</h2>
                  <p className="text-sm text-slate-400">Minimal, structured vulnerability clusters with click-through line targeting.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {activeResult?.findings?.length ? activeResult.findings.map((item) => {
                  const insight = lineInsights.find((entry) => entry.label === item.label);
                  return (
                    <button
                      key={item.slug}
                      onClick={() => setSelectedLine(insight?.lineNumber ?? null)}
                      className="panel-sheen w-full rounded-[20px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/20 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs ${severityTone[item.severity] ?? "border-white/10 bg-white/5 text-slate-300"}`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-cyan-100">
                        <span>{item.recommendation}</span>
                        {insight ? <span>Jump to line {insight.lineNumber}</span> : null}
                      </div>
                    </button>
                  );
                }) : (
                  <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    No dominant issue family detected. This contract currently looks comparatively stable.
                  </div>
                )}
              </div>
            </Panel>

            <Panel className="self-start">
              <div className="flex items-center gap-3">
                <CheckBadgeIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Safe patterns and auto-fix preview</h2>
                  <p className="text-sm text-slate-400">Signals we like and the direction the AI patcher wants to take.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(activeResult?.safe_patterns?.length ? activeResult.safe_patterns : ["No strong safety signal yet"]).map((item) => (
                  <span key={item} className="rounded-full border border-cyan-400/10 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{item}</span>
                ))}
              </div>
              <div className="mt-6 rounded-[20px] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Auto-fix preview</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{activeResult?.autofix_preview ?? "Run analysis to preview the recommended secure rewrite direction."}</p>
              </div>
            </Panel>

            <Panel className="self-start">
              <div className="flex items-center gap-3">
                <BoltIcon className="h-5 w-5 text-fuchsia-400" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Exploit PoC</h2>
                  <p className="text-sm text-slate-400">AI-generated evidence test to prove the highest risk finding.</p>
                </div>
              </div>
              <div className="mt-5 rounded-[20px] border border-fuchsia-400/10 bg-fuchsia-500/5 p-4">
                <pre className="overflow-x-auto text-[13px] leading-6 text-slate-300">
                  <code className="whitespace-pre-wrap break-words">{activeResult?.poc_test ?? "// Run a full audit to generate an exploit Proof-of-Concept."}</code>
                </pre>
              </div>
            </Panel>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
