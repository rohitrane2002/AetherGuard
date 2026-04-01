"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BoltIcon,
  CheckBadgeIcon,
  CodeBracketSquareIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { exportPdf } from "../components/PdfExporter";
import { Button, Panel, RiskMeter, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type AnalysisResult = {
  prediction: string;
  prob_secure: number;
  prob_vulnerable: number;
  email: string;
  log_id: number;
  model_source: string;
  confidence: number;
  remaining_today: number;
  risk_score: number;
  findings: Array<{
    slug: string;
    label: string;
    severity: string;
    confidence: number;
    summary: string;
    recommendation: string;
  }>;
  safe_patterns: string[];
  summary: string;
  fix_suggestions: string[];
  autofix_preview: string;
};

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

export default function AnalyzePage() {
  const { ready } = useProtectedRoute();
  const [code, setCode] = useState(STARTER_CONTRACT);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [liveResult, setLiveResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [fixing, setFixing] = useState(false);

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
        const data = await runAnalysis(code, true);
        if (data) setLiveResult(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLiveLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code, ready]);

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
      setCode(data.fixed_code);
      setCopilotMessages((current) => [
        ...current,
        { role: "assistant", content: `${data.summary}\n\nChanges:\n- ${data.highlighted_changes.join("\n- ")}` },
      ]);
      toast.success("Fix suggestions applied to workspace");
    } finally {
      setFixing(false);
    }
  };

  const sendCopilot = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    setChatInput("");
    setCopilotMessages((current) => [...current, { role: "user", content: prompt }, { role: "assistant", content: "" }]);
    const response = await authFetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${prompt}\n\nCurrent contract:\n${code}` }),
    });
    if (!response.ok || !response.body) {
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
  };

  const activeResult = result ?? liveResult;
  const issueCounts = useMemo(() => {
    const findings = activeResult?.findings ?? [];
    return {
      critical: findings.filter((item) => item.severity === "critical").length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
    };
  }, [activeResult]);

  const confidenceLabel = activeResult ? `${Math.round(activeResult.confidence * 100)}%` : "--";

  return (
    <AppShell>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-[1500px] space-y-6">
        <SectionHeading
          eyebrow="AI Workspace"
          title="Scan, fix, and ship contracts inside a real-time security command deck."
          subtitle="AetherGuard now treats analysis like a live mission surface: instant signals while typing, structured risk telemetry, and a streaming copilot that stays anchored to the contract in front of you."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Live posture" value={activeResult?.prediction ?? "watching"} helper={liveLoading ? "Refreshing signals..." : "Real-time scanner online"} />
          <StatCard label="Confidence" value={confidenceLabel} helper="Model certainty on active context" accent="violet" />
          <StatCard label="Remaining scans" value={activeResult ? String(activeResult.remaining_today) : "--"} helper="Daily premium allowance" accent="emerald" />
          <StatCard label="Model source" value={activeResult?.model_source?.split(":")[0] ?? "lightweight"} helper={activeResult?.model_source ?? "Awaiting analysis"} accent="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.46fr_0.79fr]">
          <Panel className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Contract editor</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Mission control</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                <BoltIcon className="h-4 w-4 text-cyan-300" />
                {liveLoading ? "Refreshing live feedback..." : "Live feedback online"}
              </div>
            </div>

            <div className="panel-sheen rounded-[28px] border border-white/10 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.28em] text-slate-500">
                <span>Solidity editor</span>
                <span>{code.length} chars</span>
              </div>
              <div className="grid grid-cols-[56px_1fr]">
                <div className="border-r border-white/10 px-3 py-4 text-right text-xs leading-6 text-slate-600">
                  {code.split("\n").map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="scrollbar-thin h-[40rem] resize-none bg-transparent px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={analyze} disabled={loading}>{loading ? "Analyzing..." : "Run premium audit"}</Button>
              <Button tone="ghost" onClick={fixContract} disabled={fixing}>{fixing ? "Drafting fix..." : "Fix my contract"}</Button>
              <Button tone="ghost" onClick={() => exportPdf("audit-report")}>Download PDF report</Button>
            </div>
          </Panel>

          <div className="space-y-4">
            <RiskMeter score={activeResult?.risk_score ?? 0} />

            <Panel className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Live issue rail</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Immediate signals</h2>
              </div>
              <div className="space-y-3">
                {activeResult?.findings?.length ? (
                  activeResult.findings.slice(0, 3).map((item) => (
                    <div key={item.slug} className={`rounded-[22px] border p-4 ${severityTone[item.severity] ?? "border-white/10 bg-white/5 text-slate-100"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <span className="text-xs uppercase tracking-[0.24em] opacity-80">{item.severity}</span>
                      </div>
                      <p className="mt-2 text-sm opacity-90">{item.summary}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>Possible reentrancy risk if state changes follow external calls.</p>
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      <div className="flex gap-3">
                        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>Compiler-level overflow protection is a positive signal under Solidity ^0.8.x.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Panel>

            <div className="grid gap-4">
              <StatCard label="Critical" value={String(issueCounts.critical)} helper="Funds-at-risk paths" accent="rose" />
              <StatCard label="High" value={String(issueCounts.high)} helper="Privilege or treasury issues" accent="amber" />
              <StatCard label="Medium" value={String(issueCounts.medium)} helper="Arithmetic or hygiene concerns" accent="emerald" />
            </div>
          </div>

          <Panel className="flex flex-col">
            <div className="flex items-center gap-3">
              <SparklesIcon className="h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold text-white">AI Security Copilot</h2>
                <p className="text-sm text-slate-400">Ask for explanations, secure rewrites, or mitigation strategy against the active contract.</p>
              </div>
            </div>
            <div className="scrollbar-thin mt-5 h-[40rem] space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
              {copilotMessages.length === 0 ? (
                <>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">prompt ideas</p>
                    <p>Explain this vulnerability in simple terms.</p>
                    <p className="mt-2">Rewrite this contract with safer withdrawal logic.</p>
                    <p className="mt-2">Give me the smallest secure patch for production.</p>
                  </div>
                  <div className="rounded-[20px] border border-cyan-400/10 bg-cyan-500/10 p-4 text-sm text-cyan-50">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-300">assistant</p>
                    I can explain findings, suggest fixes, or produce a safer Solidity rewrite using the contract currently loaded in the editor.
                  </div>
                </>
              ) : (
                copilotMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-[20px] p-4 text-sm ${
                      message.role === "assistant"
                        ? "border border-cyan-400/10 bg-cyan-500/10 text-cyan-50"
                        : "border border-white/10 bg-white/5 text-slate-100"
                    }`}
                  >
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">{message.role}</p>
                    <p className="whitespace-pre-wrap">{message.content || "Thinking..."}</p>
                  </div>
                ))
              )}
            </div>
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="mt-4 h-28 rounded-[24px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none"
              placeholder="Explain this vulnerability, secure the contract, or generate a production patch."
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={sendCopilot}>Send to Copilot</Button>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <Panel id="audit-report">
            <div className="flex items-center gap-3">
              <CodeBracketSquareIcon className="h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Audit intelligence</h2>
                <p className="text-sm text-slate-400">Executive summary, issue families, confidence-weighted guidance, and a clean export target.</p>
              </div>
            </div>
            {activeResult ? (
              <div className="mt-5 space-y-5">
                <div className="panel-sheen rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Executive summary</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{activeResult.summary}</p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recommended actions</p>
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

          <div className="space-y-6">
            <Panel>
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Issue families</h2>
                  <p className="text-sm text-slate-400">Structured vulnerability clusters and mitigation cues.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {activeResult?.findings?.length ? activeResult.findings.map((item) => (
                  <div key={item.slug} className="panel-sheen rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs ${severityTone[item.severity] ?? "border-white/10 bg-white/5 text-slate-300"}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
                    <p className="mt-2 text-sm text-cyan-100">{item.recommendation}</p>
                  </div>
                )) : (
                  <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    No dominant issue family detected. This contract currently looks comparatively stable.
                  </div>
                )}
              </div>
            </Panel>

            <Panel>
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
                <p className="mt-3 text-sm text-slate-300">{activeResult?.autofix_preview ?? "Run analysis to preview the recommended secure rewrite direction."}</p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
