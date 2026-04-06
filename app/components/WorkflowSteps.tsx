"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type DeviceTier = "mobile" | "tablet" | "desktop";

const steps = [
  {
    number: "01",
    title: "Paste your contract",
    description: "Drop Solidity code or connect your GitHub repo. AetherGuard indexes the full dependency tree.",
    accent: "cyan",
    icon: "📋",
  },
  {
    number: "02",
    title: "AI analyzes in real-time",
    description: "CodeBERT neural engine scans for 200+ vulnerability patterns, logic flaws, and attack vectors.",
    accent: "violet",
    icon: "🧠",
  },
  {
    number: "03",
    title: "Get actionable results",
    description: "Severity-scored findings with AI-generated fix suggestions, ready for your PR or audit report.",
    accent: "rose",
    icon: "🎯",
  },
];

const accentStyles: Record<string, { line: string; dot: string; badge: string; glow: string }> = {
  cyan: {
    line: "from-cyan-400/60 to-cyan-400/0",
    dot: "bg-cyan-400 shadow-[0_0_12px_rgba(95,231,255,0.5)]",
    badge: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    glow: "from-cyan-400/8 to-transparent",
  },
  violet: {
    line: "from-violet-400/60 to-violet-400/0",
    dot: "bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]",
    badge: "border-violet-400/20 bg-violet-500/10 text-violet-200",
    glow: "from-violet-400/8 to-transparent",
  },
  rose: {
    line: "from-rose-400/60 to-rose-400/0",
    dot: "bg-rose-400 shadow-[0_0_12px_rgba(255,94,168,0.5)]",
    badge: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    glow: "from-rose-400/8 to-transparent",
  },
};

function StepCard({
  step,
  index,
  isLast,
}: {
  step: (typeof steps)[0];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const styles = accentStyles[step.accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-6"
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <motion.div
          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${styles.dot}`}
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.15 + 0.2, type: "spring" }}
        >
          <span className="text-[11px] font-bold text-white">{step.number}</span>
        </motion.div>
        {!isLast && (
          <motion.div
            className={`w-[2px] flex-1 bg-gradient-to-b ${styles.line}`}
            initial={{ scaleY: 0, transformOrigin: "top" }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`relative flex-1 ${isLast ? "" : "pb-10"}`}>
        {/* Glow wash */}
        <div className={`pointer-events-none absolute -left-4 -top-4 h-32 w-full rounded-3xl bg-gradient-to-br ${styles.glow} opacity-60`} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{step.icon}</span>
            <h3 className="text-xl font-semibold text-white md:text-2xl">{step.title}</h3>
          </div>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkflowSteps({ deviceTier }: { deviceTier: DeviceTier }) {
  return (
    <section className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-emerald-300/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
            How it works
          </p>
        </div>
        <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-5xl">
          <span className="gradient-text">Three steps</span>{" "}
          <span className="text-slate-400">to bulletproof security.</span>
        </h2>
      </motion.div>

      <div className={`${deviceTier !== "mobile" ? "ml-8 max-w-2xl" : ""}`}>
        {steps.map((step, i) => (
          <StepCard key={step.number} step={step} index={i} isLast={i === steps.length - 1} />
        ))}
      </div>
    </section>
  );
}
