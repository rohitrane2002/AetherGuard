"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

type DeviceTier = "mobile" | "tablet" | "desktop";

const testimonials = [
  {
    quote:
      "AetherGuard caught a reentrancy vulnerability that three manual auditors missed. It saved us from a potential $4M exploit.",
    name: "Elena Voss",
    role: "Head of Security, Nexus Protocol",
    initials: "EV",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    quote:
      "We integrated AetherGuard into our CI pipeline. Every commit is scanned before merge. Our security posture went from reactive to proactive overnight.",
    name: "Marcus Chen",
    role: "CTO, DeFi Labs",
    initials: "MC",
    gradient: "from-violet-400 to-fuchsia-500",
  },
  {
    quote:
      "The AI-generated fix suggestions are remarkably accurate. What used to take our team days now takes minutes.",
    name: "Aisha Patel",
    role: "Lead Engineer, ShieldDAO",
    initials: "AP",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    quote:
      "Not just a scanner — it's an AI security co-pilot. The real-time analysis while we code is a game-changer for our velocity.",
    name: "James Thornton",
    role: "VP Engineering, Apex Chain",
    initials: "JT",
    gradient: "from-amber-400 to-orange-500",
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group relative flex min-w-[320px] flex-col rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(12,18,32,0.85),rgba(6,10,20,0.75))] p-6 transition-colors hover:border-white/[0.12] md:min-w-[380px]"
    >
      {/* Hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(95,231,255,0.06), transparent 60%)",
        }}
      />

      {/* Quote */}
      <p className="relative z-10 flex-1 text-[15px] leading-7 text-slate-300">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${testimonial.gradient} text-sm font-bold text-white shadow-lg`}
        >
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{testimonial.name}</p>
          <p className="text-[12px] text-slate-500">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials({ deviceTier }: { deviceTier: DeviceTier }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 20%"],
  });

  // Horizontal scroll effect for desktop
  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    deviceTier === "desktop" ? ["0%", "-25%"] : ["0%", "0%"]
  );

  return (
    <section ref={ref} className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300">
            What teams say
          </p>
        </div>
        <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-5xl">
          <span className="gradient-text">Trusted by teams</span>{" "}
          <span className="text-slate-400">building the future of DeFi.</span>
        </h2>
      </motion.div>

      {/* Cards container */}
      <div className="mt-10 overflow-hidden" ref={scrollContainerRef}>
        <motion.div
          className="flex gap-5"
          style={deviceTier === "desktop" ? { x: translateX } : undefined}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </motion.div>
      </div>

      {/* Mobile: horizontal scroll hint */}
      {deviceTier === "mobile" && (
        <p className="mt-4 text-center text-[11px] text-slate-600">
          ← Swipe to see more →
        </p>
      )}
    </section>
  );
}
