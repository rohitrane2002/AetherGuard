"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Panel } from "./ui";

type DeviceTier = "mobile" | "tablet" | "desktop";

const codeLines = [
  "contract AgentVault {",
  "  mapping(address => uint256) credit;",
  "  function deposit() external payable {",
  "    credit[msg.sender] += msg.value;",
  "  }",
  "  function withdraw(uint256 amount) external {",
  "    require(credit[msg.sender] >= amount, 'insufficient');",
  "    (bool ok,) = msg.sender.call{value: amount}(\"\");",
  "    require(ok, 'transfer failed');",
  "    credit[msg.sender] -= amount;",
  "  }",
  "}",
];

const scanLog = [
  { time: "00:00.12", msg: "Parsing AST...", type: "info" },
  { time: "00:00.34", msg: "Analyzing control flow graph", type: "info" },
  { time: "00:00.56", msg: "Running CodeBERT inference", type: "info" },
  { time: "00:00.72", msg: "⚠ Reentrancy pattern detected", type: "warn" },
  { time: "00:00.81", msg: "⚠ State mutation after external call", type: "warn" },
  { time: "00:00.94", msg: "Generating remediation...", type: "info" },
  { time: "00:01.02", msg: "✓ Scan complete — 2 issues found", type: "done" },
];

function MacWindowChrome({ title, status }: { title: string; status?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[0_0_12px_rgba(255,95,87,0.25)]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[0_0_12px_rgba(254,188,46,0.2)]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_12px_rgba(40,200,64,0.2)]" />
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400">
          {title}
        </span>
      </div>
      {status ? (
        <div className="flex items-center gap-2">
          <motion.div
            className="h-2 w-2 rounded-full"
            animate={
              status === "Issues Found"
                ? { backgroundColor: ["rgba(251,191,36,1)", "rgba(248,113,113,1)"], scale: [1, 1.2, 1] }
                : { backgroundColor: "rgba(74,222,128,1)" }
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{status}</span>
        </div>
      ) : null}
    </div>
  );
}

function ScanLog({ revealed }: { revealed: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    setVisibleCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= scanLog.length) clearInterval(timer);
    }, 280);
    return () => clearInterval(timer);
  }, [revealed]);

  return (
    <div className="space-y-1 font-mono text-[11px]">
      {scanLog.slice(0, visibleCount).map((entry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2 ${
            entry.type === "warn"
              ? "text-amber-300"
              : entry.type === "done"
              ? "text-emerald-300"
              : "text-slate-500"
          }`}
        >
          <span className="flex-shrink-0 text-slate-600">{entry.time}</span>
          <span>{entry.msg}</span>
        </motion.div>
      ))}
      {visibleCount < scanLog.length && revealed && (
        <motion.span
          className="inline-block text-cyan-400"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          ▊
        </motion.span>
      )}
    </div>
  );
}

export default function ScanSection({ deviceTier }: { deviceTier: DeviceTier }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scoreValue, setScoreValue] = useState(24);
  const [revealed, setRevealed] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 35%"],
  });

  const riskScore = useTransform(scrollYProgress, [0, 1], [24, 86]);
  const riskWidth = useTransform(scrollYProgress, [0, 1], ["24%", "86%"]);

  useMotionValueEvent(riskScore, "change", (latest) => {
    setScoreValue(Math.round(latest));
    if (latest > 30 && !revealed) setRevealed(true);
  });

  const riskColor =
    scoreValue >= 70 ? "from-rose-500 via-rose-400 to-amber-400" :
    scoreValue >= 40 ? "from-amber-400 via-amber-300 to-yellow-300" :
    "from-emerald-400 via-emerald-300 to-cyan-300";

  const riskLabel =
    scoreValue >= 70 ? "CRITICAL" :
    scoreValue >= 40 ? "ELEVATED" :
    "SCANNING";

  return (
    <section ref={ref} className="py-12 md:py-20">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 space-y-3"
      >
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-rose-300/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-300">
            Live Analysis
          </p>
        </div>
        <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-5xl">
          <span className="gradient-text">Watch AI dissect</span>{" "}
          <span className="text-slate-400">a vulnerable contract in real time.</span>
        </h2>
      </motion.div>

      <div className={`grid items-stretch gap-6 ${deviceTier === "mobile" ? "" : "lg:grid-cols-[1.08fr_0.92fr]"}`}>
        {/* Code editor panel */}
        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,16,30,0.9),rgba(6,10,20,0.95))] shadow-[0_32px_100px_rgba(2,6,18,0.5)]">
          <MacWindowChrome title="AgentVault.sol" status={revealed ? "Issues Found" : "Scanning..."} />

          {/* Code content */}
          <div className="p-4 font-mono text-[12px] leading-7 text-slate-300">
            {codeLines.map((line, index) => {
              const isVuln = index === 7 || index === 9;
              return (
                <motion.div
                  key={`${index}-${line}`}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.45) }}
                  className={`relative mt-1 rounded-xl px-3 py-1.5 ${
                    isVuln ? "bg-rose-500/12 text-rose-100" : "bg-white/[0.02]"
                  }`}
                >
                  <span className="mr-4 inline-block w-4 text-right text-slate-600 select-none">
                    {index + 1}
                  </span>
                  <span>{line}</span>

                  {/* Vulnerability pulse */}
                  {isVuln && (
                    <>
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-xl border border-rose-400/30"
                        animate={{
                          opacity: [0.2, 0.9, 0.2],
                          boxShadow: [
                            "0 0 0 rgba(251,113,133,0.1)",
                            "0 0 24px rgba(251,113,133,0.25)",
                            "0 0 0 rgba(251,113,133,0.1)",
                          ],
                        }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Inline vulnerability label */}
                      <motion.span
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-rose-500/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-rose-300"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        {index === 7 ? "Reentrancy risk" : "State after call"}
                      </motion.span>
                    </>
                  )}
                </motion.div>
              );
            })}

            {/* Blinking cursor */}
            <motion.div
              className="ml-8 mt-2 h-5 w-[2px] bg-cyan-300/60"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          {/* Terminal log */}
          <div className="border-t border-white/[0.06] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-600">
              Scan output
            </p>
            <ScanLog revealed={revealed} />
          </div>
        </div>

        {/* Right: Analysis panel */}
        <div className="grid gap-4 lg:grid-rows-[auto_auto_1fr]">
          {/* AI explanation */}
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">
                AI Diagnosis
              </p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Checks-effects-interactions violated
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              State is updated <span className="text-rose-300">after</span> a value transfer. That creates room for reentrant execution and inconsistent contract accounting. An attacker can drain the vault by recursively calling <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-cyan-300">withdraw()</code> before the balance updates.
            </p>

            {/* Suggested fix */}
            <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                Recommended fix
              </p>
              <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                <div className="text-rose-300">
                  <span className="text-slate-600">-</span> credit[msg.sender] -= amount; // line 10
                </div>
                <div className="text-emerald-300">
                  <span className="text-slate-600">+</span> credit[msg.sender] -= amount; // move before call
                </div>
                <div className="text-emerald-300">
                  <span className="text-slate-600">+</span> (bool ok,) = msg.sender.call&#123;value: amount&#125;(&quot;&quot;);
                </div>
              </div>
            </div>
          </Panel>

          {/* Risk meter */}
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Threat level
              </p>
              <motion.span
                className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  scoreValue >= 70
                    ? "bg-rose-500/20 text-rose-300"
                    : scoreValue >= 40
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
                key={riskLabel}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                {riskLabel}
              </motion.span>
            </div>

            {/* Score display */}
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{scoreValue}</span>
              <span className="mb-1 text-lg text-slate-500">/ 100</span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/90">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${riskColor}`}
                style={{ width: riskWidth }}
              />
            </div>

            {/* Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Reentrancy", val: 42 },
                { label: "Access Ctrl", val: 28 },
                { label: "Logic", val: 16 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[10px] text-slate-600">{item.label}</p>
                  <p className="text-sm font-medium text-white">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(8,12,22,0.88),rgba(8,10,18,0.94))]">
            <MacWindowChrome title="execution-trace.log" />
            <div className="grid gap-4 p-5 md:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Runtime timeline</p>
                {[
                  ["Parse", "00:00.12", "AST + CFG ready"],
                  ["Detect", "00:00.72", "External call before state mutation"],
                  ["Patch", "00:01.02", "Safe ordering generated"],
                ].map(([label, time, body], index) => (
                  <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{label}</span>
                      <span className="font-mono text-[10px] text-slate-500">{time}</span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-slate-400">{body}</p>
                    {index < 2 ? <div className="mt-3 h-px w-full bg-white/[0.04]" /> : null}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Attack path snapshot</p>
                <div className="mt-4 space-y-3">
                  {[
                    "User requests withdraw(amount)",
                    "Contract performs external value transfer",
                    "Attacker re-enters before balance update",
                    "Vault accounting desyncs from true reserves",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[10px] text-cyan-200">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300">Root cause</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The value transfer executes before the internal balance mutation, leaving the contract re-enterable during the most sensitive phase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
