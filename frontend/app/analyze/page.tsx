"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BackgroundGrid from "../components/BackgroundGrid";
import { clearAuthSession, isUnauthorizedError, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";
import toast, { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type AnalysisResult = {
  prediction?: "secure" | "vulnerable";
  prob_secure?: number;
  prob_vulnerable?: number;
  email?: string;
  log_id?: number;
  model_source?: string;
  confidence?: number;
  remaining_today?: number;
};

type AnalysisHistoryItem = {
  id: number;
  contract_snippet: string;
  prediction: "secure" | "vulnerable";
  confidence: number;
  timestamp: string;
};

type Usage = {
  subscription_plan: string;
  daily_limit: number;
  analyses_today: number;
  remaining_today: number;
};

// ---------------------------- PDF Export Helper ----------------------------
async function exportPdf(elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) return toast.error("Result block not found");

  try {
    const canvas = await html2canvas(node, {
      backgroundColor: "#0d1117",
      scale: 2,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ratio = canvas.width / canvas.height;
    pdf.addImage(img, "PNG", 0, 10, pw, pw / ratio);
    pdf.save("aetherguard_report.pdf");
    toast.success("📄 PDF downloaded!");
  } catch (err) {
    console.error("PDF error", err);
    toast.error("Failed to create PDF. See console.");
  }
}

// ------------------------------ Analyzer Page ------------------------------
export default function AnalyzePage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<AnalysisResult>({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const { token, email, ready } = useProtectedRoute();

  const loadUsage = async () => {
    try {
      if (!token) {
        setUsage(null);
        return;
      }
      const { data } = await axios.get<Usage>(`${API_BASE_URL}/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsage(data);
    } catch (err) {
      console.error("Usage fetch error", err);
      if (isUnauthorizedError(err)) {
        redirectToAuth(true);
      }
    }
  };

  const loadHistory = async () => {
    try {
      if (!token) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }
      setHistoryLoading(true);
      const { data } = await axios.get<AnalysisHistoryItem[]>(
        `${API_BASE_URL}/analyses?limit=6`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(data);
    } catch (err) {
      console.error("History fetch error", err);
      if (isUnauthorizedError(err)) {
        redirectToAuth(true);
        return;
      }
      toast.error("Could not load recent scans");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    setHistoryFilter(email ?? "");
    if (ready && token) {
      loadHistory();
      loadUsage();
    } else if (ready) {
      setHistoryLoading(false);
      setUsage(null);
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

  const handleAnalyze = async () => {
    try {
      if (!code.trim()) return toast.error("Paste some Solidity first!");
      if (!token) return toast.error("Login first to run secure scans");
      setLoading(true);
      NProgress.start();

      const { data } = await axios.post(
        `${API_BASE_URL}/analyze/`,
        { content: code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(data);
      setUsage((current) =>
        current
          ? {
              ...current,
              analyses_today: current.analyses_today + 1,
              remaining_today: data.remaining_today ?? Math.max(current.remaining_today - 1, 0),
            }
          : current
      );
      await loadHistory();
      toast.success("✅ Scan complete!");
    } catch (err: any) {
      console.error(err);
      if (isUnauthorizedError(err)) {
        redirectToAuth(true);
        return;
      }
      if (err?.response?.status === 403) {
        toast.error(err.response.data?.detail ?? "Daily scan limit reached");
        await loadUsage();
        return;
      }
      toast.error("❌ Backend unreachable");
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleCopy = () => {
    if (!result.prediction) return toast.error("Run a scan first");
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast("📋 Report copied!");
  };

  const handleText = () => {
    if (!result.prediction) return toast.error("Run a scan first");
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "text/plain",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aetherguard_report.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chart = {
    labels: ["Secure", "Vulnerable"],
    datasets: [
      {
        data: [result.prob_secure ?? 0, result.prob_vulnerable ?? 0],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const selectedSnippet = selectedAnalysis?.contract_snippet ?? "";

  return (
    <main className="relative min-h-screen bg-[#0d1117] text-gray-200 flex flex-col items-center overflow-hidden font-sans md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />
      <Toaster position="top-right" />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-28 text-center space-y-4"
      >
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400 text-transparent bg-clip-text drop-shadow-lg">
          AetherGuard Analyzer
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm">
          Real‑time AI security scan for Solidity smart contracts
        </p>
      </motion.div>

      {/* Main block */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-5xl mt-10 mb-24 bg-white/5 rounded-3xl p-8 border border-transparent hover:border-fuchsia-400/40 transition-all"
      >
        <SparklesIcon className="absolute top-6 right-6 w-6 h-6 text-fuchsia-400 animate-pulse" />

        <textarea
          className="w-full h-72 p-4 rounded-lg bg-black/30 border border-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
          placeholder="// Paste Solidity code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[280px] flex-1 flex-col gap-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Authenticated User
            </span>
            <input
              type="email"
              value={historyFilter}
              readOnly
              placeholder="Login required"
              className="rounded-xl border border-cyan-500/20 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>

          <button
            onClick={() => {
              clearAuthSession();
              setHistory([]);
              setHistoryFilter("");
              setUsage(null);
              toast.success("Local session cleared");
              window.location.href = "/auth";
            }}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Clear Session
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Plan
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {usage?.subscription_plan ?? "Unknown"}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Used Today
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {usage ? `${usage.analyses_today}/${usage.daily_limit}` : "--"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Remaining
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {usage?.remaining_today ?? "--"}
            </p>
          </div>
        </div>

        {usage && usage.remaining_today <= 1 && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {usage.remaining_today === 0
              ? "You have reached today’s scan limit for your current plan. Upgrade from /pricing to unlock more analyses."
              : "You have 1 scan remaining today on your current plan."}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-8 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              loading
                ? "bg-gradient-to-r from-gray-700 to-gray-600 cursor-wait"
                : "bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:scale-105"
            }`}
          >
            {loading ? (
              <>
                <ClipLoader size={18} color="#fff" /> Scanning...
              </>
            ) : (
              "🚀 Analyze"
            )}
          </button>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <ClipboardIcon className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={handleText}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => exportPdf("pdf-wrapper")}
              className="flex items-center gap-1 bg-gray-700/60 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Result */}
        {result.prediction && (
          <div
            id="pdf-wrapper"
            className="relative mt-10 rounded-2xl border border-gray-700 bg-black/40 p-8 text-center"
          >
            {result.prediction === "vulnerable" ? (
              <div className="absolute inset-0 bg-red-600/10 blur-[150px]" />
            ) : (
              <div className="absolute inset-0 bg-green-600/10 blur-[150px]" />
            )}

            <div className="relative z-10">
              {result.prediction === "vulnerable" ? (
                <ExclamationTriangleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
              ) : (
                <ShieldCheckIcon className="w-20 h-20 text-green-400 mx-auto mb-4" />
              )}

              <h2
                className={`text-3xl font-bold ${
                  result.prediction === "vulnerable" ? "text-red-500" : "text-green-400"
                }`}
              >
                {result.prediction === "vulnerable" ? "⚠ Vulnerable" : "✅ Secure"}
              </h2>

              <div className="mt-6 h-60 max-w-xs mx-auto">
                <Pie data={chart} />
              </div>

              <p className="text-gray-400 text-sm mt-4">
                Secure {result.prob_secure?.toFixed(3)} | Vulnerable 
                {result.prob_vulnerable?.toFixed(3)}
              </p>

              <p className="text-gray-500 text-xs mt-3">
                Log ID {result.log_id} · Model {result.model_source}
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300">Recent Scans</h2>
              <p className="text-sm text-slate-400">
                Live analysis history for {historyFilter || "the authenticated user"}
              </p>
            </div>
            <button
              onClick={() => loadHistory()}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {historyLoading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-400">
                Loading recent scans...
              </div>
            ) : !ready || !token ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-400">
                Login from `/auth` to analyze contracts and load your protected scan history.
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-400">
                No scans logged yet. Run your first Solidity analysis above.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-cyan-400/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.prediction === "vulnerable" ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      ) : (
                        <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
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

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        item.prediction === "vulnerable"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {item.prediction === "vulnerable" ? "Risk" : "Confidence"}{" "}
                      {item.confidence.toFixed(3)}
                    </span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      Compact history record
                    </span>
                  </div>

                  <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
                    {item.contract_snippet}
                  </pre>

                  <div className="mt-3 flex flex-wrap justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Logged {formatTimestamp(item.timestamp)}
                    </p>
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
        </div>
      </motion.div>

      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Scan #{selectedAnalysis.id}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {selectedAnalysis.prediction === "vulnerable" ? "Vulnerability Flag" : "Secure Verdict"}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {historyFilter || "Authenticated user"} · {formatTimestamp(selectedAnalysis.timestamp)}
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
                  Logged Contract Snippet
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                  {selectedSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
