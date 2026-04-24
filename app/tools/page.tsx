import { Metadata } from "next";
import Link from "next/link";
import { getPagesByCategory } from "../lib/seo/keywords";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Free Smart Contract Security Tools — AetherGuard",
  description: "Free AI-powered tools for smart contract security. Scan Solidity code for vulnerabilities, check for reentrancy, audit DeFi protocols, and optimize gas usage.",
  keywords: "smart contract tools, solidity scanner, security audit tool, free contract audit, defi security tools",
  openGraph: {
    title: "Free Smart Contract Security Tools — AetherGuard",
    description: "AI-powered security tools for Solidity developers. Scan, audit, and protect your smart contracts.",
    type: "website",
  },
  alternates: {
    canonical: "https://aetherguard.vercel.app/tools",
  },
};

export default function ToolsHubPage() {
  const toolPages = getPagesByCategory("tools");

  return (
    <div className="min-h-screen bg-[#030712]">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-white transition hover:text-cyan-400">
            ← AetherGuard
          </Link>
          <Link
            href="/analyze"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
          >
            Open Scanner
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <header className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5">
            <WrenchScrewdriverIcon className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {toolPages.length} free tools
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
            Free Security<br />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              Tools for Developers
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            AI-powered security tools purpose-built for Solidity developers.
            Scan, audit, and optimize your smart contracts — free.
          </p>
        </header>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {toolPages.map((page) => (
            <Link
              key={page.slug}
              href={`/tools/${page.slug}`}
              className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-200 hover:border-cyan-500/30 hover:bg-white/[0.04] hover:-translate-y-1"
            >
              <WrenchScrewdriverIcon className="h-8 w-8 text-cyan-500 transition group-hover:text-cyan-300" />
              <h2 className="mt-4 text-lg font-bold text-white transition group-hover:text-cyan-300">
                {page.h1}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
                {page.whatIsIt}
              </p>
              <span className="mt-4 text-xs font-semibold text-cyan-500 transition group-hover:text-cyan-300">
                Try free →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-white">Need a custom security audit?</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Our Pro plan includes unlimited AI scans, priority support, and team workspace access.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-10 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            View Pro Plans
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} AetherGuard — AI-Powered Smart Contract Security
      </footer>
    </div>
  );
}
