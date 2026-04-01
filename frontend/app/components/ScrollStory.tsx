"use client";

import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";

type DeviceTier = "mobile" | "tablet" | "desktop";

const storyFrames = [
  {
    eyebrow: "01 — Observe",
    title: "Map live AI exposure before it reaches production.",
    body: "AetherGuard gives platform teams one place to scan contracts, spot risky execution paths, and understand where AI-assisted code needs human review.",
    accent: "cyan",
    icon: "◉",
  },
  {
    eyebrow: "02 — Intervene",
    title: "Catch dangerous flows while they are still editable.",
    body: "Typing, detection, scoring, and remediation guidance converge into a premium command surface instead of disconnected audit steps.",
    accent: "violet",
    icon: "◈",
  },
  {
    eyebrow: "03 — Operate",
    title: "Turn security into an always-on operating rhythm.",
    body: "Workspace notifications, reports, and AI copilots keep signal moving across product, engineering, and security leaders.",
    accent: "rose",
    icon: "⬡",
  },
];

const accentMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  cyan: {
    border: "border-cyan-400/20",
    bg: "bg-cyan-500/10",
    text: "text-cyan-200",
    glow: "shadow-[0_0_30px_rgba(95,231,255,0.12)]",
  },
  violet: {
    border: "border-violet-400/20",
    bg: "bg-violet-500/10",
    text: "text-violet-200",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.12)]",
  },
  rose: {
    border: "border-rose-400/20",
    bg: "bg-rose-500/10",
    text: "text-rose-200",
    glow: "shadow-[0_0_30px_rgba(255,94,168,0.12)]",
  },
};

export default function ScrollStory({ deviceTier }: { deviceTier: DeviceTier }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [activeFrame, setActiveFrame] = useState(0);

  // Split scroll progress into 3 frames
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) setActiveFrame(0);
    else if (latest < 0.66) setActiveFrame(1);
    else setActiveFrame(2);
  });

  // Parallax layers
  const layerOne = useTransform(scrollYProgress, [0, 1], [0, deviceTier === "desktop" ? -160 : -36]);
  const layerTwo = useTransform(scrollYProgress, [0, 1], [0, deviceTier === "desktop" ? -90 : -24]);

  // Progress bar
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  if (deviceTier === "mobile") {
    // Mobile: simple stacked cards with no scroll lock
    return (
      <section className="space-y-4 py-10 md:hidden">
        {storyFrames.map((frame, i) => {
          const colors = accentMap[frame.accent];
          return (
            <motion.div
              key={frame.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`rounded-[24px] border ${colors.border} ${colors.bg} p-5`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg ${colors.text}`}>{frame.icon}</span>
                <p className={`text-[11px] uppercase tracking-[0.28em] ${colors.text}`}>
                  {frame.eyebrow}
                </p>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white">{frame.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{frame.body}</p>
            </motion.div>
          );
        })}
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className={deviceTier === "desktop" ? "relative h-[280vh]" : "py-12"}
    >
      <div className={deviceTier === "desktop" ? "sticky top-0 flex min-h-screen items-center" : ""}>
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Cinematic visual panel */}
          <div className="relative min-h-[36rem] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,16,30,0.85),rgba(6,10,20,0.92))] p-8">
            {/* Animated parallax blobs */}
            <motion.div
              style={{ y: layerOne }}
              className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
            />
            <motion.div
              style={{ y: layerTwo }}
              className="absolute right-0 top-28 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
            />
            <motion.div
              style={{ y: layerOne }}
              className="absolute bottom-8 left-1/3 h-48 w-48 rounded-full bg-fuchsia-500/8 blur-3xl"
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              {/* Top tag */}
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Scroll storytelling
                </div>

                <h2 className="mt-6 max-w-xl text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
                  A security operating system that{" "}
                  <span className="gradient-text">adapts to how you build.</span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-400">
                  Three phases. One continuous flow. From observation to intervention to daily operations — AetherGuard stays with your team at every stage.
                </p>
              </div>

              {/* Progress indicator (desktop) */}
              {deviceTier === "desktop" && (
                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-4">
                    {storyFrames.map((frame, i) => {
                      const isActive = activeFrame === i;
                      const colors = accentMap[frame.accent];
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <motion.div
                            className={`h-2 w-2 rounded-full transition-colors ${
                              isActive ? "bg-cyan-400" : "bg-slate-700"
                            }`}
                            animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                            transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                          />
                          <span
                            className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${
                              isActive ? "text-white" : "text-slate-600"
                            }`}
                          >
                            {frame.eyebrow.split("—")[1]?.trim()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400"
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Story cards */}
          <div className="space-y-4">
            {storyFrames.map((frame, index) => {
              const colors = accentMap[frame.accent];
              const isActive = activeFrame === index;

              return (
                <motion.div
                  key={frame.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className={`relative overflow-hidden rounded-[28px] border p-6 transition-all duration-500 md:p-7 ${
                    isActive && deviceTier === "desktop"
                      ? `${colors.border} ${colors.bg} ${colors.glow} scale-[1.02]`
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                  }`}
                >
                  {/* Active indicator line */}
                  {isActive && deviceTier === "desktop" && (
                    <motion.div
                      className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-cyan-400 via-violet-400 to-rose-400"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${isActive ? colors.text : "text-slate-500"}`}>
                      {frame.icon}
                    </span>
                    <p className={`text-[11px] uppercase tracking-[0.28em] ${isActive ? colors.text : "text-slate-500"}`}>
                      {frame.eyebrow}
                    </p>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white md:text-2xl">
                    {frame.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{frame.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
