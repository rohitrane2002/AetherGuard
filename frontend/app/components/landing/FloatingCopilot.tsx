"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBubbleBottomCenterTextIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex items-end justify-end md:bottom-8 md:right-8">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto mb-4 w-[min(24rem,calc(100vw-2.5rem))] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,24,45,0.95),rgba(6,12,24,0.92))] p-4 shadow-[0_24px_80px_rgba(2,8,24,0.55)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-600">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">AetherGuard Copilot</p>
                  <p className="text-sm text-white">Always-on AI guidance</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">Need a fast security read?</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Ask the copilot to explain a vulnerability, produce a secure patch, or summarize the last scan before you enter the workspace.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {[
                "Explain this vulnerability in simple terms",
                "Fix my contract safely",
                "Prepare an audit summary for my team",
              ].map((prompt) => (
                <div key={prompt} className="rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-slate-300">
                  {prompt}
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((current) => !current)}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="pointer-events-auto relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-cyan-500 via-blue-500 to-fuchsia-600 text-white shadow-[0_18px_48px_rgba(68,158,255,0.38)]"
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-cyan-300/30"
          animate={{ scale: [1, 1.22, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
        />
        <ChatBubbleBottomCenterTextIcon className="h-7 w-7" />
      </motion.button>
    </div>
  );
}
