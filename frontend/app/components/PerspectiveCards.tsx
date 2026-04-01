"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

type DeviceTier = "mobile" | "tablet" | "desktop";

const features = [
  {
    title: "Neural Scan Engine",
    description:
      "CodeBERT-powered analysis that understands intent, not just patterns. Detects zero-day vulnerability classes before they become exploits.",
    icon: "⚡",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    borderGlow: "group-hover:shadow-[0_0_40px_rgba(95,231,255,0.15)]",
    stat: "< 0.8s",
    statLabel: "avg scan time",
  },
  {
    title: "Autonomous Remediation",
    description:
      "AI generates secure patches that preserve your contract's logic while eliminating attack vectors. Production-ready fixes, not suggestions.",
    icon: "🛡️",
    gradient: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    borderGlow: "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
    stat: "97.2%",
    statLabel: "fix accuracy",
  },
  {
    title: "Real-time Sentinel",
    description:
      "Continuous monitoring feeds that track emerging threat patterns across deployed contracts. Get alerts before exploits reach mainnet.",
    icon: "🔮",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    borderGlow: "group-hover:shadow-[0_0_40px_rgba(255,94,168,0.15)]",
    stat: "24/7",
    statLabel: "monitoring",
  },
];

function FeatureCard({
  feature,
  index,
  deviceTier,
}: {
  feature: typeof features[0];
  index: number;
  deviceTier: DeviceTier;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [deviceTier === "desktop" ? 15 : 6, 0]);
  const rotateY = useTransform(
    scrollYProgress,
    [0, 1],
    [deviceTier === "desktop" ? (index === 0 ? 12 : index === 2 ? -12 : 0) : 0, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={
        deviceTier !== "mobile"
          ? { rotateX, rotateY, scale, opacity, perspective: 1000, transformStyle: "preserve-3d" }
          : { opacity }
      }
    >
      <div
        className={`group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(12,18,32,0.88),rgba(6,10,20,0.75))] p-6 transition-all duration-500 hover:border-white/[0.14] md:p-8 ${feature.borderGlow}`}
      >
        {/* Top gradient wash */}
        <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${feature.gradient} opacity-60 transition-opacity duration-500 group-hover:opacity-100`} />

        {/* Sheen on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.03) 45%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
            {feature.icon}
          </div>

          {/* Title */}
          <h3 className="mt-5 text-xl font-semibold text-white md:text-2xl">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {feature.description}
          </p>

          {/* Stat */}
          <div className="mt-6 flex items-end gap-2 border-t border-white/[0.06] pt-5">
            <span className="text-3xl font-bold text-white">{feature.stat}</span>
            <span className="mb-0.5 text-xs uppercase tracking-[0.2em] text-slate-500">
              {feature.statLabel}
            </span>
          </div>

          {/* Hover detail line */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function PerspectiveCards({ deviceTier }: { deviceTier: DeviceTier }) {
  return (
    <section className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-300/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-300">
            Core capabilities
          </p>
        </div>
        <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-5xl">
          <span className="gradient-text">Three pillars</span>{" "}
          <span className="text-slate-400">of intelligent security.</span>
        </h2>
      </motion.div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {features.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} deviceTier={deviceTier} />
        ))}
      </div>

      {/* CTA row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center"
      >
        <Link
          href="/analyze"
          className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(95,231,255,0.18)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_50px_rgba(91,124,255,0.22)]"
        >
          Try Live Scan →
        </Link>
        <Link
          href="/pricing"
          className="hero-secondary-button rounded-2xl px-8 py-4 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5"
        >
          View Pricing
        </Link>
      </motion.div>
    </section>
  );
}
