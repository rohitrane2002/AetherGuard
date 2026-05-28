"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheckIcon, 
  ArrowRightIcon, 
  BoltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/solid";
import Link from "next/link";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

export default function InteractiveScanner() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [stats, setStats] = useState({ total_scanned: 1248, remaining_guest_scans: 3 });

  useEffect(() => {
    fetch(`${API_BASE_URL}/analyze/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  const handleScan = async () => {
    if (!code.trim()) {
      toast.error("Please paste your Solidity code first.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/analyze/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: code }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        if (error.detail === "GUEST_LIMIT_REACHED") {
          toast.error("Daily guest limit reached. Support the project by signing up!");
        } else {
          toast.error(error.detail || "Scan failed.");
        }
        return;
      }

      const data = await resp.json();
      setResults(data);
      toast.success("Scan complete! Partial results are visible.");
      
      // Update local count
      setStats(prev => ({ ...prev, remaining_guest_scans: prev.remaining_guest_scans - 1 }));
    } catch (err) {
      toast.error("Could not connect to AI Engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-4xl px-4 pb-20">
      {/* ── Urgency & Social Proof Banner ─────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-3 backdrop-blur-md sm:flex-row"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
          </div>
          <span className="text-xs font-semibold text-zinc-300">
            {stats.total_scanned.toLocaleString()}+ protocols guarded today
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Guest Scans Left: <span className={stats.remaining_guest_scans > 0 ? "text-white" : "text-rose-500"}>{stats.remaining_guest_scans}/3</span>
          </span>
          <Link href="/auth" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
            Unlock Unlimited →
          </Link>
        </div>
      </motion.div>

      {/* ── Interactive Code Input ────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition blur-xl" />
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black/60 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contract Source</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-zinc-600">Solidity ^0.8.0</span>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your Solidity contract here (e.g. pragma solidity ^0.8.0; ...)"
            className="h-64 w-full resize-none bg-transparent p-6 font-mono text-[13px] leading-relaxed text-zinc-300 outline-none placeholder:text-zinc-700"
          />

          <div className="border-t border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1"><BoltIcon className="h-3 w-3" /> AI Driven</span>
              <span className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3" /> Secure AST</span>
            </div>
            <button
              onClick={handleScan}
              disabled={loading}
              className="group relative flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                <>
                  <span>Audit Now</span>
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Instant Results Mock/Preview Area ────────────────── */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-[20px] border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Risk Score</h3>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${results.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  {results.severity} Threat
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">{results.score}</span>
                <span className="text-zinc-500">/ 100</span>
              </div>
              <p className="mt-4 text-sm text-zinc-400">
                {results.explanation}
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Vulnerabilities</h3>
                <div className="space-y-3">
                  {results.findings.slice(0, 2).map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />
                      <span className="text-sm font-medium text-zinc-200">{f.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 opacity-40 blur-[2px]">
                    <ExclamationTriangleIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-200">Logic Flow Vulnerability</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="/auth" 
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-3 text-sm font-bold text-cyan-400 border border-cyan-400/20 hover:bg-cyan-500/20 transition-all"
                >
                  Unlock Full Security Report
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
