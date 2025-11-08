"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0d1117] text-gray-200 flex flex-col items-center justify-center overflow-hidden">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-6"
      >
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400 text-transparent bg-clip-text mb-4">
          AetherGuard
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          AI‑powered Smart‑Contract Security Copilot  
          — analyze, audit, and export vulnerability reports in seconds.
        </p>
        <Link
          href="/analyze"
          className="inline-block mt-8 bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white px-10 py-3 rounded-lg font-semibold hover:scale-105 transition-transform shadow"
        >
          🔍 Launch Analyzer
        </Link>
      </motion.div>
    </main>
  );
}