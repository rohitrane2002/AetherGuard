"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BackgroundGrid from "../components/BackgroundGrid";
import { isUnauthorizedError, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type AnalysisHistoryItem = {
  id: number;
  contract_snippet: string;
  prediction: "secure" | "vulnerable";
  confidence: number;
  timestamp: string;
};

export default function ReportsPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null);
  const { token, email, ready } = useProtectedRoute();

  const loadReports = async (activeToken: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get<AnalysisHistoryItem[]>(
        `${API_BASE_URL}/history?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      );
      setHistory(data);
    } catch (error) {
      console.error("Reports fetch error", error);
      if (isUnauthorizedError(error)) {
        redirectToAuth(true);
        return;
      }
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchDraft(email ?? "");
    if (ready && token) {
      loadReports(token);
    } else if (ready) {
      setLoading(false);
    }
  }, [email, ready, token]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAnalysis(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const stats = useMemo(() => {
    const total = history.length;
    const vulnerable = history.filter((item) => item.prediction === "vulnerable").length;
    const secure = total - vulnerable;
    const avgRisk =
      total === 0
        ? 0
        : history.reduce((sum, item) => sum + item.confidence, 0) / total;

    return { total, secure, vulnerable, avgRisk };
  }, [history]);

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1117] text-gray-200 md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            <ChartBarIcon className="h-4 w-4" />
            Scan Intelligence
          </div>
          <h1 className="text-5xl font-extrabold text-white">
            Security Reports
          </h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Inspect recent contract analyses, filter by account, and review the
            exact Solidity source stored by the backend logging pipeline.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 grid gap-4 md:grid-cols-4"
        >
          <StatCard label="Total Scans" value={String(stats.total)} tone="cyan" />
          <StatCard label="Secure" value={String(stats.secure)} tone="green" />
          <StatCard label="Vulnerable" value={String(stats.vulnerable)} tone="red" />
          <StatCard
            label="Avg Vulnerability Score"
            value={stats.avgRisk.toFixed(3)}
            tone="amber"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[280px] flex-1 flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Authenticated Account
              </span>
              <input
                type="email"
                value={searchDraft}
                readOnly
                placeholder="Login required"
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <button
              onClick={() => token && loadReports(token)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Refresh Reports
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Loading reports...
              </div>
            ) : !ready || !token ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Login from `/auth` to view your protected report history.
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                No reports found for this account yet.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.prediction === "vulnerable" ? (
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                      ) : (
                        <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Scan #{item.id} · {item.prediction}
                        </p>
                        <p className="text-xs text-slate-400">
                          Confidence {item.confidence.toFixed(3)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ClockIcon className="h-4 w-4" />
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        item.prediction === "vulnerable"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      Confidence {item.confidence.toFixed(3)}
                    </span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      Compact history record
                    </span>
                  </div>

                  <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-slate-300">
                    {item.contract_snippet}
                  </pre>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setSelectedAnalysis(item)}
                      className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/20"
                    >
                      View Full Contract
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Scan #{selectedAnalysis.id}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Stored Contract Snapshot
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {email || "Authenticated user"} · {formatTimestamp(selectedAnalysis.timestamp)}
                </p>
              </div>

              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                  Confidence {selectedAnalysis.confidence.toFixed(3)}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Contract Snippet
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                  {selectedAnalysis.contract_snippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "green" | "red" | "amber";
}) {
  const toneClasses = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    red: "border-red-500/20 bg-red-500/10 text-red-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
