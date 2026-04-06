"use client";

import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState, useEffect } from "react";

type DeviceTier = "mobile" | "tablet" | "desktop";

const threatData = [
  { id: "TH-001", type: "Reentrancy", severity: "Critical", confidence: 98, target: "withdraw()" },
  { id: "TH-002", type: "Flash Loan", severity: "High", confidence: 87, target: "swap()" },
  { id: "TH-003", type: "Oracle Manipulation", severity: "High", confidence: 92, target: "getPrice()" },
  { id: "TH-004", type: "Access Control", severity: "Medium", confidence: 76, target: "setAdmin()" },
  { id: "TH-005", type: "Integer Overflow", severity: "Low", confidence: 64, target: "mint()" },
];

const hexChars = "0123456789abcdef";

function HexStream() {
  const [chars, setChars] = useState("");

  useEffect(() => {
    const generate = () => {
      let hex = "";
      for (let i = 0; i < 48; i++) {
        hex += hexChars[Math.floor(Math.random() * 16)];
        if ((i + 1) % 4 === 0 && i < 47) hex += " ";
      }
      setChars(hex);
    };
    generate();
    const id = setInterval(generate, 120);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-[10px] tracking-[0.12em] text-cyan-400/30">
      {chars}
    </span>
  );
}

function ThreatRow({
  threat,
  index,
  revealed,
}: {
  threat: typeof threatData[0];
  index: number;
  revealed: boolean;
}) {
  const severityColors: Record<string, string> = {
    Critical: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    High: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    Medium: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
      animate={
        revealed
          ? { opacity: 1, x: 0, filter: "blur(0px)" }
          : { opacity: 0, x: -30, filter: "blur(4px)" }
      }
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-cyan-400/15 hover:bg-white/[0.04]"
    >
      {/* Scan line animation on reveal */}
      {revealed && (
        <motion.div
          className="absolute inset-y-0 left-0 w-full"
          initial={{ scaleX: 0, transformOrigin: "left" }}
          animate={{ scaleX: [0, 1, 0] }}
          transition={{ duration: 0.8, delay: index * 0.12 }}
        >
          <div className="h-full w-full bg-gradient-to-r from-cyan-400/10 via-transparent to-transparent" />
        </motion.div>
      )}

      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={revealed ? { boxShadow: ["0 0 0px rgba(95,231,255,0)", "0 0 16px rgba(95,231,255,0.2)", "0 0 0px rgba(95,231,255,0)"] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
        />
        <span className="font-mono text-[10px] text-cyan-300">{threat.id.slice(-3)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{threat.type}</span>
          <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${severityColors[threat.severity]}`}>
            {threat.severity}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500">{threat.target}</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                initial={{ width: "0%" }}
                animate={revealed ? { width: `${threat.confidence}%` } : { width: "0%" }}
                transition={{ duration: 1, delay: 0.3 + index * 0.12 }}
              />
            </div>
            <span className="text-[10px] text-slate-500">{threat.confidence}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ThreatIntelligence({ deviceTier }: { deviceTier: DeviceTier }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 40%"],
  });

  const [revealed, setRevealed] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.15 && !revealed) setRevealed(true);
    setScanProgress(Math.min(latest * 1.4, 1));
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, -4]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-4, 0, 3]);
  const perspective = 1200;

  return (
    <section ref={ref} className="pt-4 pb-16 md:pt-6 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        {/* Section header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-300/60" />
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
              Threat Intelligence
            </p>
          </div>
          <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-5xl">
            <span className="gradient-text">AI that hunts vulnerabilities</span>{" "}
            <span className="text-slate-400">before they hunt you.</span>
          </h2>
        </div>

        <div className={`grid gap-6 ${deviceTier === "mobile" ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
          {/* Left: Threat feed */}
          <motion.div
            style={
              deviceTier === "desktop"
                ? { perspective, rotateX, rotateY, transformStyle: "preserve-3d" }
                : undefined
            }
          >
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,16,30,0.85),rgba(6,10,20,0.92))] p-5 shadow-[0_32px_100px_rgba(2,6,18,0.5)] backdrop-blur-xl">
              {/* Dashboard header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20">
                    <motion.div
                      className="h-2.5 w-2.5 rounded-full bg-cyan-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Live feed</p>
                    <p className="text-sm font-medium text-white">Threat Scanner v3.2</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-[11px] text-emerald-300">ACTIVE</span>
                </div>
              </div>

              {/* Hex stream (desktop aesthetic) */}
              {deviceTier !== "mobile" && (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.04] bg-black/30 px-3 py-2">
                  <HexStream />
                </div>
              )}

              {/* Threat rows */}
              <div className="mt-4 space-y-2">
                {threatData.map((threat, i) => (
                  <ThreatRow key={threat.id} threat={threat} index={i} revealed={revealed} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Stats + visualization */}
          <div className="space-y-4">
            {/* Scan progress */}
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Scan progress</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-5xl font-bold text-white">{Math.round(scanProgress * 100)}</span>
                <span className="mb-1 text-xl text-slate-500">%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                  style={{ width: `${scanProgress * 100}%` }}
                />
              </div>
              {/* Scanline labels */}
              <div className="mt-3 flex justify-between text-[10px] text-slate-600">
                <span>AST Parse</span>
                <span>Pattern Match</span>
                <span>AI Inference</span>
                <span>Report</span>
              </div>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Contracts", value: "2,847", delta: "+12%" },
                { label: "Threats Found", value: "156", delta: "+3" },
                { label: "Avg. Response", value: "0.8s", delta: "-22%" },
                { label: "False Positive", value: "1.2%", delta: "-0.4%" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-emerald-400">{stat.delta}</p>
                </motion.div>
              ))}
            </div>

            {/* Activity heatmap */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Weekly activity</p>
              <div className="mt-3 flex items-end gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const h = 4 + Math.random() * 28;
                  const intensity = h / 32;
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm"
                      initial={{ height: 0 }}
                      whileInView={{ height: h }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.02 }}
                      style={{
                        background: `linear-gradient(to top, rgba(95,231,255,${intensity * 0.6}), rgba(139,92,246,${intensity * 0.4}))`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-slate-600">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
