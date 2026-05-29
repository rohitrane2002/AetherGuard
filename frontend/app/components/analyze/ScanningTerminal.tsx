"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandLineIcon, SparklesIcon } from "@heroicons/react/24/solid";

interface ScanningTerminalProps {
  loading: boolean;
  results: any;
  live?: boolean;
}

const liveScanLogs = [
  "TELEMETRY: Connecting to live editor buffer...",
  "PARSING: Building control flow graphs...",
  "RULES: Auditing state modification sequences...",
  "VECTORIZER: Extracting TF-IDF token frequencies...",
  "INFERENCE: Invoking lightweight classifier...",
  "TELEMETRY: Workspace posture synchronized."
];

const fullScanLogs = [
  "AETHERGUARD AI SECURE CORRELATION TERMINAL INITIALIZED...",
  "SYSTEM: Accessing self-hosted model backend...",
  "PARSING: Compiling Solidity AST node trees...",
  "PARSING: Analysis mapping established for active functions...",
  "RULES: Running 12 heuristic security scans...",
  "VECTORIZER: Extracting syntax vector features...",
  "MODEL: Running inference on custom self-hosted model...",
  "MODEL: Computing vulnerability confidence factors...",
  "AUDITOR: Performing risk score matrix computation...",
  "REMEDIATION: Compiling safe AST modifications...",
  "REMEDIATION: Auto-fix preview generated successfully...",
  "AETHERGUARD CORE: Audit finalized. Workspace reports updated."
];

export default function ScanningTerminal({ loading, results, live = false }: ScanningTerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom when logs are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle log streaming when scanning
  useEffect(() => {
    if (!loading) {
      if (results) {
        const timeStr = new Date().toLocaleTimeString();
        setLogs(prev => [
          ...prev,
          `[${timeStr}] SCAN REPORT GENERATED:`,
          `[${timeStr}]   STATUS: ${results.prediction?.toUpperCase() || "COMPLETE"}`,
          `[${timeStr}]   EXPOSURE SCORE: ${results.score}/100`,
          `[${timeStr}]   VULNERABILITIES FOUND: ${results.findings?.length || 0}`,
          `[${timeStr}] SYSTEM IDLE. STANDING BY FOR NEW DEPLOYMENT CONTEXT...`
        ]);
      } else {
        setLogs([`[${new Date().toLocaleTimeString()}] CONSOLE READY. DEPLOYMENT TRIGGER AWAITING CONTEXT...`]);
      }
      setLogIndex(0);
      return;
    }

    setLogs([]);
    setLogIndex(0);

    const logPool = live ? liveScanLogs : fullScanLogs;
    const intervalTime = live ? 100 : 250;

    const timer = setInterval(() => {
      setLogIndex(current => {
        if (current < logPool.length) {
          const timeStr = new Date().toLocaleTimeString();
          setLogs(prev => [...prev, `[${timeStr}] ${logPool[current]}`]);
          return current + 1;
        } else {
          clearInterval(timer);
          return current;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [loading, results, live]);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/80 p-5 font-mono shadow-2xl">
      {/* Scanline overlay for cyberpunk feel */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-20" />
      
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="h-5 w-5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            {live ? "Live Telemetry Feed" : "Security Correlation Console"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {loading ? "Scanning" : "Connected"}
          </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="h-44 overflow-y-auto space-y-2 pr-2 text-xs leading-relaxed text-zinc-400 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const isAlert = log.includes("VULNERABILITIES FOUND:") && !log.includes(" 0");
            const isHeader = log.includes("SCAN REPORT GENERATED:");
            const isSystem = log.includes("AETHERGUARD");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`whitespace-pre-wrap font-mono ${
                  isAlert 
                    ? "text-rose-400 font-bold" 
                    : isHeader 
                    ? "text-cyan-300 font-semibold"
                    : isSystem
                    ? "text-fuchsia-400"
                    : log.includes("MODEL") || log.includes("INFERENCE")
                    ? "text-emerald-400"
                    : "text-zinc-400"
                }`}
              >
                {log}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-block h-3.5 w-1 bg-cyan-400 animate-[blink_1s_infinite]" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest italic animate-pulse">Running telemetry scan...</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
