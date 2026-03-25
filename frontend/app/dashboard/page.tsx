"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  CreditCardIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";

import BackgroundGrid from "../components/BackgroundGrid";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { authFetch, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type Account = {
  id: number;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  stripe_customer_id?: string | null;
};

type Usage = {
  subscription_plan: string;
  daily_limit: number;
  analyses_today: number;
  remaining_today: number;
};

type HistoryItem = {
  id: number;
  contract_snippet: string;
  prediction: string;
  confidence: number;
  timestamp: string;
};

type ApiKey = {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at?: string | null;
  created_at: string;
};

type ChatResponse = {
  reply: string;
  messages: Array<{ role: string; content: string; created_at: string }>;
};

export default function DashboardPage() {
  const { ready } = useProtectedRoute();
  const [account, setAccount] = useState<Account | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [apiKeyName, setApiKeyName] = useState("CI Integration");
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [accountRes, usageRes, historyRes, keysRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/account`),
        authFetch(`${API_BASE_URL}/usage`),
        authFetch(`${API_BASE_URL}/history?limit=8`),
        authFetch(`${API_BASE_URL}/api-keys`),
      ]);

      if ([accountRes, usageRes, historyRes, keysRes].some((res) => isUnauthorizedStatus(res.status))) {
        redirectToAuth(true);
        return;
      }

      setAccount(await accountRes.json());
      setUsage(await usageRes.json());
      setHistory(await historyRes.json());
      setApiKeys(await keysRes.json());
    } catch (error) {
      console.error("Dashboard load error", error);
      toast.error("Failed to load dashboard");
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
    toast.success(`New API key created: ${data.key}`);
    setApiKeys((current) => [data, ...current]);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages((current) => [...current, { role: "user", content: userMessage }]);
    setChatInput("");

    const response = await authFetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    if (isUnauthorizedStatus(response.status)) {
      redirectToAuth(true);
      return;
    }
    const data: ChatResponse = await response.json();
    if (!response.ok) {
      toast.error((data as any).detail || "Chat failed");
      return;
    }
    setChatMessages((current) => [...current, { role: "assistant", content: data.reply }]);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1117] text-gray-200 md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />
      <Toaster position="top-right" />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-28">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Command Center
            </p>
            <h1 className="mt-2 text-5xl font-extrabold text-white">Dashboard</h1>
          </div>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">Loading dashboard...</div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <DashboardStat icon={<ShieldCheckIcon className="h-5 w-5 text-cyan-300" />} label="Plan" value={account?.subscription_plan || "--"} subtitle={account?.subscription_status || "--"} />
                <DashboardStat icon={<CreditCardIcon className="h-5 w-5 text-fuchsia-300" />} label="Used Today" value={usage ? `${usage.analyses_today}/${usage.daily_limit}` : "--"} subtitle={`${usage?.remaining_today ?? "--"} remaining`} />
                <DashboardStat icon={<ClipboardDocumentIcon className="h-5 w-5 text-emerald-300" />} label="History" value={String(history.length)} subtitle="Recent scans loaded" />
                <DashboardStat icon={<KeyIcon className="h-5 w-5 text-amber-300" />} label="API Keys" value={String(apiKeys.length)} subtitle={account?.email || "No user"} />
              </div>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Scan History</h2>
                    <p className="text-sm text-slate-400">Latest analyses for your account</p>
                  </div>
                  <a href="/pricing" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-200 transition hover:bg-fuchsia-500/20">
                    Upgrade Plan
                  </a>
                </div>
                <div className="mt-5 space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Scan #{item.id} · {item.prediction}
                          </p>
                          <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                          Confidence {item.confidence.toFixed(3)}
                        </span>
                      </div>
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-xs text-slate-300">
                        {item.contract_snippet}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Developer API Keys</h2>
                    <p className="text-sm text-slate-400">Generate keys for CI or external integrations</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <input
                    value={apiKeyName}
                    onChange={(event) => setApiKeyName(event.target.value)}
                    className="min-w-[260px] flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Key name"
                  />
                  <button
                    onClick={createApiKey}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                  >
                    Generate API Key
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm font-semibold text-white">{key.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {key.key_prefix} · {key.is_active ? "active" : "inactive"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Security Copilot</h2>
                  <p className="text-sm text-slate-400">Explain findings, fixes, and Solidity risks</p>
                </div>
              </div>
              <div className="mt-5 h-[520px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Ask about your latest scan, common Solidity vulnerabilities, or remediation guidance.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-2xl p-3 text-sm ${
                          message.role === "assistant"
                            ? "bg-cyan-500/10 text-cyan-50"
                            : "bg-slate-800 text-slate-100"
                        }`}
                      >
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
                          {message.role}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  className="h-32 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Explain the latest vulnerability and suggest a safe Solidity patch..."
                />
                <button
                  onClick={sendChat}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                >
                  Send To Copilot
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardStat({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
