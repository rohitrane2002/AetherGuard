"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NeuralNetwork from "./NeuralNetwork";
import InteractiveScanner from "./InteractiveScanner";

const EASING = [0.22, 1, 0.36, 1];

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-10 text-center">
      {/* Subtle background effects */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40"></div>
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-[100%] bg-white/[0.03] blur-[120px]"></div>
      
      {/* Refined Neural Network */}
      <NeuralNetwork />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-xs font-medium tracking-wide text-zinc-300">AetherGuard Copilot is Live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASING }}
          className="text-balance text-5xl font-semibold tracking-[-0.03em] text-white sm:text-7xl"
        >
          Audit your contracts <br className="hidden sm:block" />
          <span className="text-zinc-500 text-[0.8em]">with one click.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASING }}
          className="mx-auto mt-8 max-w-2xl text-[17px] leading-relaxed text-zinc-400"
        >
          The first AI security engine that understands intent. Zero login required for your first deep-logic audit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: EASING }}
          className="w-full"
        >
          <InteractiveScanner />
        </motion.div>
      </div>
    </section>
  );
}
