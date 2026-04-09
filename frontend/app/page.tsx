"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import Hero from "./components/Hero";
import MobileOptimized from "./components/MobileOptimized";
import PerspectiveCards from "./components/PerspectiveCards";
import ScanSection from "./components/ScanSection";
import ScrollStory from "./components/ScrollStory";
import ThreatIntelligence from "./components/ThreatIntelligence";
import WorkflowSteps from "./components/WorkflowSteps";

type DeviceTier = "mobile" | "tablet" | "desktop";
const EASING = [0.22, 1, 0.36, 1];

const productSignals = [
  { label: "Execution Time", value: "240ms", helper: "Instant static & dynamic AST analysis." },
  { label: "Threat Detection", value: "99.8%", helper: "Identifies severe logical zero-days instantly." },
  { label: "Deployment Safeties", value: "100+", helper: "Continuous checks against the EVM." }
];

export default function Home() {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>("desktop");

  useEffect(() => {
    const computeTier = () => {
      if (window.innerWidth < 768) return "mobile";
      if (window.innerWidth < 1200) return "tablet";
      return "desktop";
    };
    const applyTier = () => setDeviceTier(computeTier());
    applyTier();
    window.addEventListener("resize", applyTier);
    return () => window.removeEventListener("resize", applyTier);
  }, []);

  useEffect(() => {
    if (deviceTier !== "desktop") return;
    let destroyed = false;
    let cleanup = () => {};

    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      const lenis = new Lenis({
        duration: 1.2,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        smoothWheel: true,
      });

      let frameId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      };
      frameId = requestAnimationFrame(raf);
      cleanup = () => {
        cancelAnimationFrame(frameId);
        lenis.destroy();
      };
    });

    return () => {
      destroyed = true;
      cleanup();
    };
  }, [deviceTier]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-24 md:px-8">
      {/* ── Subtlest grain overlay covering entire body ── */}
      <div className="noise-overlay"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* ── Navbar ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING }}
          className="absolute left-0 right-0 top-6 z-50 flex items-center justify-between rounded-xl border border-white/5 bg-black/50 px-5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 border border-white/10">
              <ShieldCheckIcon className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-white">AetherGuard</h1>
            </div>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="/audit" className="text-[13px] font-medium text-zinc-400 transition hover:text-white">
              Encyclopedia
            </Link>
            <Link href="/tools" className="text-[13px] font-medium text-zinc-400 transition hover:text-white">
              Security Tools
            </Link>
            <Link href="/pricing" className="text-[13px] font-medium text-zinc-400 transition hover:text-white">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-[13px] font-medium text-zinc-400 transition hover:text-white">
              Docs
            </Link>
            <Link
              href="/auth"
              className="rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200"
            >
              Log in
            </Link>
          </div>
        </motion.header>

        {/* ── 1. Hero ── */}
        <Hero />

        {/* ── 2. Problem / Proof Signals ── */}
        <section className="mx-auto mt-16 max-w-5xl border-t border-white/5 py-20 md:mt-20 md:py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              DeFi security is <span className="text-zinc-500">broken.</span>
            </h2>
            <p className="mt-4 text-[17px] text-zinc-400">
              Manual audits take weeks. Compilers miss logic flaws. Attackers automate. <br className="hidden sm:block" />
              AetherGuard flips the asymmetry by bringing AI into your CI/CD.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {productSignals.map((signal, i) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASING }}
              >
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition hover:bg-white/[0.04]">
                  <p className="text-sm font-medium tracking-tight text-zinc-500">{signal.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{signal.value}</p>
                  <p className="mt-4 text-sm text-zinc-400">{signal.helper}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 3. Solution (Features) ── */}
        <div className="mt-8 md:mt-10">
          <PerspectiveCards deviceTier={deviceTier} />
        </div>

        {/* ── Workflow Steps ── */}
        <div id="demo" className="mt-8 border-t border-white/5 pt-16 md:mt-10 md:pt-20">
          <WorkflowSteps deviceTier={deviceTier} />
        </div>

        {/* ── Deep Demo ── */}
        <div className="mt-20 md:mt-24">
          <ScanSection deviceTier={deviceTier} />
        </div>

        <div className="mt-10 md:mt-12">
          <ScrollStory deviceTier={deviceTier} />
        </div>

        {/* ── Threat Intelligence ── */}
        <div className="mt-6 md:mt-8">
          <ThreatIntelligence deviceTier={deviceTier} />
        </div>

        {/* ── 4. pSEO Hubs (NEW) ── */}
        <section className="mx-auto mt-20 border-t border-white/5 py-20">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
              <div className="relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Free Resource</span>
                <h3 className="mt-4 text-2xl font-semibold text-white">Vulnerability Encyclopedia</h3>
                <p className="mt-3 text-zinc-400">Deep-dives into 80+ smart contract vulnerabilities with code examples, severity analysis, and fix strategies.</p>
                <Link href="/audit" className="mt-6 inline-flex items-center text-sm font-medium text-white hover:underline">
                  Browse Encyclopedia →
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-[60px] transition group-hover:bg-emerald-500/20" />
            </div>

            <div className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
              <div className="relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Security Suite</span>
                <h3 className="mt-4 text-2xl font-semibold text-white">Advanced Security Tools</h3>
                <p className="mt-3 text-zinc-400">Professional-grade tools for gas optimization, ABI decoding, multi-sig auditing, and transaction simulation.</p>
                <Link href="/tools" className="mt-6 inline-flex items-center text-sm font-medium text-white hover:underline">
                  Access Free Tools →
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-[60px] transition group-hover:bg-blue-500/20" />
            </div>
          </div>
        </section>

        {/* ── Fallback ── */}
        <MobileOptimized />

        {/* ── Final CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING }}
          className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] px-8 py-16 text-center md:mt-24 md:py-20"
        >
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Ship untouchable code.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[17px] text-zinc-400">
              Integrate the fastest, smartest vulnerability scanner into your protocol directly from your browser.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {/* Fixed nested buttons */}
              <Link
                href="/analyze"
                className="flex h-12 items-center justify-center rounded-lg bg-white px-8 text-[15px] font-medium text-black transition hover:scale-[1.02] hover:bg-zinc-100"
              >
                Deploy AetherGuard
              </Link>
              <Link
                href="/pricing"
                className="flex h-12 items-center justify-center rounded-lg border border-white/10 bg-transparent px-8 text-[15px] font-medium text-white transition hover:bg-white/5"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
