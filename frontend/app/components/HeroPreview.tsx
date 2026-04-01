"use client";

import { motion } from "framer-motion";

const alerts = [
  { label: "AI runtime policy drift", tone: "warning" },
  { label: "Prompt injection resistance stable", tone: "safe" },
  { label: "Critical contract path hardened", tone: "critical" },
];

export default function HeroPreview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative pb-12"
    >
      <div className="hero-preview-shell overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-3 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Realtime posture</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">AI defense command stream</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              AetherGuard blends audit findings, live AI safety signals, and contract risk telemetry into one premium control rail.
            </p>

            <div className="mt-5 space-y-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.label}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-200">{alert.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
                        alert.tone === "critical"
                          ? "bg-rose-500/15 text-rose-200"
                          : alert.tone === "warning"
                            ? "bg-amber-400/15 text-amber-200"
                            : "bg-emerald-400/15 text-emerald-200"
                      }`}
                    >
                      {alert.tone}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.92),rgba(7,12,22,0.82))] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Subtle demo preview</p>
                <h3 className="mt-2 text-xl font-semibold text-white">What the workspace feels like</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-300">
                Live AI analysis
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[22px] border border-white/10 bg-slate-950/80 p-4 font-mono text-[12px] leading-6 text-slate-300">
                <div className="space-y-2">
                  <div className="rounded-lg bg-white/[0.03] px-3 py-1.5">1  contract TreasuryVault &#123;</div>
                  <div className="rounded-lg bg-white/[0.03] px-3 py-1.5">2    function withdraw(uint amount) external &#123;</div>
                  <div className="rounded-lg bg-white/[0.03] px-3 py-1.5">3      require(balance[msg.sender] &gt;= amount);</div>
                  <div className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-rose-100">4      (bool ok,) = msg.sender.call&#123;value: amount&#125;("");</div>
                  <div className="rounded-lg bg-white/[0.03] px-3 py-1.5">5      require(ok);</div>
                  <div className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-rose-100">6      balance[msg.sender] -= amount;</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200">Signal</p>
                  <p className="mt-3 text-lg font-semibold text-white">Checks-effects-interactions broken</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Balance mutation should happen before value transfer. Add a reentrancy guard for safer execution paths.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Copilot</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    “I can rewrite this withdraw path, preserve event semantics, and generate a board-ready audit summary.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
