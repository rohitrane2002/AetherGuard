"use client";

import { useEffect, useState } from "react";
import {
  BellAlertIcon,
  ChatBubbleBottomCenterTextIcon,
  KeyIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type DashboardSummary = {
  account: { id: number; email: string; plan: string; status: string };
  usage: { plan: string; daily_limit: number; analyses_today: number; remaining_today: number };
  recent_scans: Array<{
    id: number;
    prediction: string;
    confidence: number;
    timestamp: string;
    contract_snippet: string;
    risk_score: number;
  }>;
  chat_history: Array<{ role: string; content: string; created_at: string }>;
  notifications: Array<{
    id: number;
    title: string;
    body: string;
    severity: string;
    category: string;
    is_read: boolean;
    action_url?: string | null;
    timestamp: string;
  }>;
  workspace: {
    team_name: string;
    members: number;
    role: string;
    shared_reports: number;
    notification_metrics?: { total: number; unread: number; critical: number };
  };
};

type ApiKey = {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const { ready } = useProtectedRoute();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [apiKeyName, setApiKeyName] = useState("Production API");
  const [issuedApiKey, setIssuedApiKey] = useState("");
  const [sending, setSending] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [summaryRes, keyRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/dashboard/summary`),
        authFetch(`${API_BASE_URL}/api-keys`),
      ]);

      if ([summaryRes, keyRes].some((res) => isUnauthorizedStatus(res.status))) {
        redirectToAuth(true);
        return;
      }

      const summaryData = await summaryRes.json();
      const apiKeyData = await keyRes.json();
      setSummary(summaryData);
      setApiKeys(apiKeyData);
      setChatMessages(summaryData.chat_history.map((item: { role: string; content: string }) => ({
        role: item.role,
        content: item.content,
      })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load command center");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      loadDashboard();
    }
  }, [ready]);

  const createApiKey = async () => {
    const response = await authFetch(`${API_BASE_URL}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: apiKeyName }),
    });
    if (isUnauthorizedStatus(response.status)) {
      redirectToAuth(true);
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.detail || "Failed to create API key");
      return;
    }
    toast.success("API key issued");
    setIssuedApiKey(data.key);
    setApiKeys((current) => [data, ...current]);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || sending) return;
    const message = chatInput.trim();
    setChatInput("");
    setSending(true);
    setChatMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "" }]);

    const response = await authFetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok || !response.body) {
      setSending(false);
      toast.error("Copilot stream failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setChatMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: assistantText.trim() };
        return next;
      });
    }

    setSending(false);
  };

  const averageRisk =
    summary?.recent_scans.length
      ? Math.round(summary.recent_scans.reduce((total, item) => total + item.risk_score, 0) / summary.recent_scans.length)
      : 0;
  const latestScan = summary?.recent_scans[0] ?? null;

  return (
    <AppShell>
      <Toaster position="top-right" />
      <div className="mx-auto max-w-[1520px] space-y-8 pt-3 md:pt-5">
        <SectionHeading
          eyebrow="Command Center"
          title="Operate your AI-native smart contract security workspace."
          subtitle="Monitor risk posture, review recent scans, issue developer API keys, and collaborate with your security copilot in one premium control plane."
        />

        {loading || !summary ? (
          <Panel>Loading command center...</Panel>
        ) : (
          <>
            {summary.account.plan.toLowerCase() === "free" ? (
              <Panel className="border-cyan-400/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Upgrade opportunity</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">You are still operating in evaluation mode.</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                      Move to Pro to unlock higher daily scan volume, richer AI workflows, and a more production-ready operating model for active contract teams.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => (window.location.href = "/pricing")}>Upgrade to Pro</Button>
                    <Button tone="ghost" onClick={() => (window.location.href = "/account")}>Review entitlements</Button>
                  </div>
                </div>
              </Panel>
            ) : null}

            <Panel className="p-0">
              <div className="grid items-start xl:grid-cols-[1.04fr_0.96fr]">
                <div className="space-y-6 p-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
                        Operations overview
                      </div>
                      <div className="space-y-3">
                        <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                          Command your smart contract risk with one clean control plane.
                        </h2>
                        <p className="max-w-2xl text-base leading-8 text-slate-400">
                          Recent scans, unread alerts, API access, workspace momentum, and AI guidance all live in one structured operating surface.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Latest signal</p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">
                              {latestScan ? `${latestScan.prediction} detection` : "Awaiting first scan"}
                            </h3>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
                            {latestScan ? `${latestScan.risk_score}/100` : "--"}
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-400">
                          {latestScan ? latestScan.contract_snippet : "Run a live scan to seed the command center with contract telemetry."}
                        </p>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Portfolio exposure</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">
                              {averageRisk >= 70 ? "Critical" : averageRisk >= 40 ? "Elevated" : "Stable"} posture
                            </h3>
                          </div>
                          <div className="text-5xl font-semibold tracking-tight text-white">{averageRisk}</div>
                        </div>
                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-950/90">
                          <div
                            className={`h-full rounded-full ${
                              averageRisk >= 70
                                ? "bg-gradient-to-r from-rose-400 via-rose-500 to-blue-950"
                                : averageRisk >= 40
                                ? "bg-gradient-to-r from-amber-300 via-amber-400 to-slate-900"
                                : "bg-gradient-to-r from-emerald-300 via-cyan-400 to-slate-900"
                            }`}
                            style={{ width: `${averageRisk}%` }}
                          />
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-400">
                          Average risk across the latest contract telemetry in this workspace.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <StatCard label="Active Plan" value={summary.account.plan} helper={summary.account.status} />
                      <StatCard
                        label="Usage Today"
                        value={`${summary.usage.analyses_today}/${summary.usage.daily_limit}`}
                        helper={`${summary.usage.remaining_today} scans remaining`}
                        accent="violet"
                      />
                      <StatCard
                        label="Unread Alerts"
                        value={String(summary.workspace.notification_metrics?.unread ?? summary.notifications.length)}
                        helper="Platform intelligence waiting"
                        accent="rose"
                      />
                      <StatCard
                        label="Workspace"
                        value={summary.workspace.team_name}
                        helper={`${summary.workspace.members} members · ${summary.workspace.role}`}
                        accent="emerald"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 lg:grid-cols-[1.08fr_0.92fr_0.92fr]">
                    <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
                      Control matrix
                    </div>
                    <div className="lg:col-span-3 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Team mode</p>
                        <p className="mt-3 text-lg font-semibold text-white">{summary.workspace.members} active members</p>
                        <p className="mt-2 text-sm text-slate-400">Role posture: {summary.workspace.role}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Shared reporting</p>
                        <p className="mt-3 text-lg font-semibold text-white">{summary.workspace.shared_reports} reports live</p>
                        <p className="mt-2 text-sm text-slate-400">Shared audit visibility across the workspace.</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Unread intelligence</p>
                        <p className="mt-3 text-lg font-semibold text-white">
                          {summary.workspace.notification_metrics?.critical ?? 0} critical / {summary.workspace.notification_metrics?.unread ?? summary.notifications.length} unread
                        </p>
                        <p className="mt-2 text-sm text-slate-400">Operator feed ready for triage and follow-up.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.18),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 xl:border-l xl:border-t-0">
                  <div className="flex min-h-full flex-col gap-5 xl:min-h-[720px]">
                    <div className="flex items-center gap-3">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-cyan-300" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">AI Security Copilot</p>
                        <h3 className="mt-1 text-2xl font-semibold text-white">Ask, patch, and explain</h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Explain the last critical issue",
                        "Give me the minimum safe patch",
                        "Summarize recent scan posture",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setChatInput(prompt)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:text-white"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                    <div className="scrollbar-thin min-h-[22rem] max-h-[26rem] space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/70 p-4 xl:min-h-[26rem] xl:max-h-[30rem]">
                      {chatMessages.length === 0 ? (
                        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                          Ask for vulnerability explanations, secure rewrites, or exploit narratives.
                        </div>
                      ) : (
                        chatMessages.map((message, index) => (
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
                      className="h-28 rounded-[24px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none"
                      placeholder="Explain the last critical issue and give me a secure Solidity patch."
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-400">
                        <ShieldExclamationIcon className="h-4 w-4 text-cyan-300" />
                        Context-aware across recent scans
                      </div>
                      <Button onClick={sendChat} disabled={sending}>
                        {sending ? "Streaming..." : "Send to Copilot"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid items-start gap-6 xl:grid-cols-[1.06fr_0.94fr]">
              <div className="space-y-6">
                <Panel>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Recent scans</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Security telemetry</h2>
                    </div>
                    <Button tone="ghost" onClick={loadDashboard}>Refresh</Button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {summary.recent_scans.map((scan) => (
                      <div key={scan.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-white">
                              Scan #{scan.id} · {scan.prediction}
                            </p>
                            <p className="max-w-3xl text-sm leading-7 text-slate-400">{scan.contract_snippet}</p>
                          </div>
                          <div className="rounded-[18px] border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Risk</p>
                            <p className="mt-2 text-3xl font-semibold text-white">{scan.risk_score}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel>
                  <div className="flex items-center gap-3">
                    <KeyIcon className="h-5 w-5 text-amber-300" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">Developer API keys</h2>
                      <p className="text-sm text-slate-400">Issue production credentials for custom integrations and CI pipelines.</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <input
                      value={apiKeyName}
                      onChange={(event) => setApiKeyName(event.target.value)}
                      className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                      placeholder="Key name"
                    />
                    <Button onClick={createApiKey}>Generate key</Button>
                  </div>
                  {issuedApiKey ? (
                    <div className="mt-5 rounded-[20px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">New API key</p>
                          <p className="mt-2 font-mono text-sm text-white">{issuedApiKey}</p>
                          <p className="mt-2 text-xs text-slate-300">Copy this now. For security, the full token is only shown once.</p>
                        </div>
                        <Button
                          tone="ghost"
                          onClick={async () => {
                            await navigator.clipboard.writeText(issuedApiKey);
                            toast.success("API key copied");
                          }}
                        >
                          Copy key
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-5 grid gap-3 xl:grid-cols-2">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{key.name}</p>
                          <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${key.is_active ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border border-white/10 bg-white/5 text-slate-400"}`}>
                            {key.is_active ? "active" : "inactive"}
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-sm text-slate-300">{key.key_prefix}••••••••</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Created {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel>
                  <div className="flex items-center gap-3">
                    <BellAlertIcon className="h-5 w-5 text-cyan-300" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">Alerts</h2>
                      <p className="text-sm text-slate-400">Unread platform intelligence, surfaced as an operator feed.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {summary.notifications.map((item) => (
                      <div key={item.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          {!item.is_read ? (
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{item.body}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          {item.category} · {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel>
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="h-5 w-5 text-violet-300" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">Workspace momentum</h2>
                      <p className="text-sm text-slate-400">Role-aware team context for your active security workspace.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Members</p>
                      <div className="mt-3 text-4xl font-semibold text-white">{summary.workspace.members}</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Unread alerts</p>
                      <div className="mt-3 text-4xl font-semibold text-white">
                        {summary.workspace.notification_metrics?.unread ?? summary.notifications.length}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Shared reports</p>
                      <div className="mt-3 text-4xl font-semibold text-white">{summary.workspace.shared_reports}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div>
                      <p className="text-sm font-semibold text-white">{summary.workspace.team_name}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {summary.workspace.members} members · {summary.workspace.shared_reports} shared reports · role {summary.workspace.role}
                      </p>
                    </div>
                    <Button tone="ghost" onClick={() => (window.location.href = "/workspace")}>
                      Open workspace
                    </Button>
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
