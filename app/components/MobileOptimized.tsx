"use client";

import { motion } from "framer-motion";
import { Panel, StatCard } from "./ui";

export default function MobileOptimized() {
  return (
    <section className="space-y-4 py-10 md:hidden">
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Mobile optimized</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Fast fades, clear blocks, and no scroll lock.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Mobile keeps the same premium identity, but shifts to lightweight transitions and vertically stacked product blocks for better performance.
          </p>
        </Panel>
      </motion.div>

      <div className="grid gap-4">
        <StatCard label="Realtime scans" value="Fast" helper="Low-latency transitions for handheld devices." />
        <StatCard label="AI guidance" value="Inline" helper="Readable fix guidance without heavy scene changes." accent="violet" />
        <StatCard label="Team reports" value="Ready" helper="Executive summaries and alerts stay accessible on mobile." accent="rose" />
      </div>
    </section>
  );
}
