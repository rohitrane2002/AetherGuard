"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "./AnimatedCounter";

const logos = [
  { name: "Ethereum", char: "Ξ" },
  { name: "Polygon", char: "⬡" },
  { name: "Arbitrum", char: "◈" },
  { name: "Optimism", char: "◉" },
  { name: "Base", char: "◎" },
  { name: "Avalanche", char: "△" },
];

const stats = [
  { target: 50, prefix: "", suffix: "K+", label: "Contracts Scanned" },
  { target: 2.8, prefix: "$", suffix: "B", label: "Assets Protected" },
  { target: 99, prefix: "", suffix: ".7%", label: "Detection Accuracy" },
  { target: 0, prefix: "<", suffix: "", label: "Scan Speed", static: "<1s" },
];

export default function TrustBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center center"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [-40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <section ref={ref} className="py-16 md:py-24">
      <motion.div style={{ x, opacity }}>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Trusted across Web3
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.04]"
            >
              <span className="text-xl text-slate-400 transition-colors group-hover:text-cyan-300">
                {logo.char}
              </span>
              <span className="text-sm font-medium text-slate-400 transition-colors group-hover:text-white">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center"
            >
              <p className="text-3xl font-bold text-white md:text-4xl">
                {stat.static ? (
                  stat.static
                ) : (
                  <AnimatedCounter
                    target={stat.target}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2200}
                  />
                )}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-16 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </motion.div>
    </section>
  );
}
