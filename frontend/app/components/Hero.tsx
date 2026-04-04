"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import NeuralNetwork from "./NeuralNetwork";

const EASING = [0.22, 1, 0.36, 1];

function LiveScanDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const initialLogs = [
    "[10:41:02] Analyzing transfer() flow...",
    "[10:41:03] Reentrancy pattern detected in collateral vault.",
    "[10:41:04] AI Confidence: 99.2% — CRITICAL",
    "[10:41:04] Generating AST rewrite patch...",
    "[10:41:05] SECURE: Patch deployed."
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < initialLogs.length) {
        setLogs(prev => [...prev, initialLogs[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 850);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto mt-16 max-w-2xl text-left">
      <div className="glass-panel overflow-hidden border border-white/5 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[0_0_12px_rgba(255,95,87,0.25)]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[0_0_12px_rgba(254,188,46,0.2)]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_12px_rgba(40,200,64,0.2)]" />
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
              AetherGuard AI Engine
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">Live Session</span>
        </div>
        <div className="p-5 font-mono text-[13px] leading-relaxed text-zinc-400">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASING }}
              className="mb-1"
            >
              {log?.includes("CRITICAL") ? (
                <span className="text-rose-400">{log}</span>
              ) : log?.includes("SECURE") ? (
                <span className="text-emerald-400">{log}</span>
              ) : (
                log
              )}
            </motion.div>
          ))}
          {logs.length < initialLogs.length && (
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mt-1 inline-block h-3.5 w-2 bg-zinc-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20 text-center">
      {/* Subtle background effects */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40"></div>
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-[100%] bg-white/[0.03] blur-[120px]"></div>
      
      {/* Refined Neural Network */}
      <NeuralNetwork />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-xs font-medium tracking-wide text-zinc-300">AetherGuard Copilot is Live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASING }}
          className="text-balance text-5xl font-semibold tracking-[-0.03em] text-white sm:text-7xl"
        >
          The intelligence layer for <br className="hidden sm:block" />
          <span className="text-zinc-500">smart contract security.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASING }}
          className="mx-auto mt-8 max-w-2xl text-[17px] leading-relaxed text-zinc-400"
        >
          Automated vulnerability detection, real-time risk scoring, and zero-day threat analysis. Secure your protocol before deployment with surgical AI precision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASING }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {/* Fixed nested buttons */}
          <Link
            href="/analyze"
            className="flex h-12 items-center justify-center rounded-lg bg-white px-8 text-[15px] font-medium text-black transition hover:scale-[1.02] hover:bg-zinc-100"
          >
            Start Free Scan
          </Link>
          <Link
            href="#demo"
            className="flex h-12 items-center justify-center rounded-lg border border-white/10 bg-transparent px-8 text-[15px] font-medium text-white transition hover:bg-white/5"
          >
            View Documentation
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: EASING }}
        >
          <LiveScanDemo />
        </motion.div>
      </div>
    </section>
  );
}
