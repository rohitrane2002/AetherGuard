"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={clsx("space-y-4", align === "center" && "text-center")}>
      <div className={clsx("inline-flex items-center gap-3", align === "center" && "justify-center")}>
        <span className="h-px w-12 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">{eyebrow}</p>
        <span className="h-px w-12 bg-gradient-to-r from-transparent via-fuchsia-300/80 to-transparent" />
      </div>
      <h1 className="text-balance text-4xl font-semibold text-white md:text-6xl">
        <span className="gradient-text">{title}</span>
      </h1>
      {subtitle ? <p className="max-w-3xl text-sm text-slate-400 md:text-base">{subtitle}</p> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.002 }}
      transition={{ duration: 0.45 }}
      className={clsx("glass-panel panel-sheen glow-ring rounded-[28px] p-6", className)}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  accent = "cyan",
}: {
  label: string;
  value: string;
  helper: string;
  accent?: "cyan" | "violet" | "emerald" | "rose" | "amber";
}) {
  const accents = {
    cyan: "from-cyan-400/20 to-cyan-500/0 text-cyan-100",
    violet: "from-violet-400/20 to-violet-500/0 text-violet-100",
    emerald: "from-emerald-400/20 to-emerald-500/0 text-emerald-100",
    rose: "from-rose-400/20 to-rose-500/0 text-rose-100",
    amber: "from-amber-400/20 to-amber-500/0 text-amber-100",
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={clsx("panel-sheen glow-ring rounded-[24px] border border-white/10 bg-gradient-to-br p-5", accents[accent])}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </motion.div>
  );
}

export function Button({
  children,
  className,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      className={clsx(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        tone === "primary" &&
          "bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 text-white shadow-[0_12px_40px_rgba(95,231,255,0.18)] hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_50px_rgba(91,124,255,0.22)]",
        tone === "ghost" && "border border-white/10 bg-white/5 text-slate-200 hover:-translate-y-0.5 hover:bg-white/10",
        tone === "danger" && "border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RiskMeter({ score, compact = false }: { score: number; compact?: boolean }) {
  const tone = score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-amber-400" : "bg-emerald-400";
  const label = score >= 70 ? "Critical" : score >= 40 ? "Elevated" : "Stable";

  return (
    <div
      className={clsx(
        "panel-sheen rounded-[24px] border border-white/10 bg-white/5",
        compact ? "self-start p-4" : "p-5"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Risk score</p>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <div className={clsx("overflow-hidden rounded-full bg-slate-900/90", compact ? "mt-4 h-2.5" : "mt-5 h-3")}>
        <div className={clsx("h-full rounded-full transition-all", tone)} style={{ width: `${score}%` }} />
      </div>
      <div className={clsx("font-semibold text-white", compact ? "mt-3 text-3xl" : "mt-4 text-4xl")}>{score}</div>
      {compact ? <p className="mt-2 text-sm text-slate-400">Severity-weighted contract exposure.</p> : null}
    </div>
  );
}
export function BenchmarkingChart({ data }: { data: any }) {
  if (!data) return null;
  const metrics = [
    { label: "You", value: data.current_score, color: "bg-cyan-400" },
    { label: "Industry", value: data.industry_avg, color: "bg-slate-500" },
    { label: "DeFi", value: data.defi_avg, color: "bg-violet-500" },
    { label: "NFT", value: data.nft_avg, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Market Benchmarking</p>
        <span className="text-xs text-slate-500">Percentile: {data.percentile}th</span>
      </div>
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span>{m.label}</span>
              <span>{m.value}/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                className={clsx("h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.2)]", m.color)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
