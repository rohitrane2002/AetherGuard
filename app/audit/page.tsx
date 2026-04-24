import { Metadata } from "next";
import Link from "next/link";
import { getPagesByCategory, type SEOPage } from "../lib/seo/keywords";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Smart Contract Security Guides — AetherGuard Vulnerability Encyclopedia",
  description: "Comprehensive security guides for every major smart contract vulnerability. Learn about reentrancy, flash loans, access control, oracle manipulation and more. Free Solidity audit tools included.",
  keywords: "smart contract security, solidity vulnerabilities, contract audit guide, defi security, ethereum security",
  openGraph: {
    title: "Smart Contract Security Guides — AetherGuard",
    description: "The definitive encyclopedia of smart contract vulnerabilities. Expert guides with code examples and fix strategies.",
    type: "website",
  },
  alternates: {
    canonical: "https://aetherguard.vercel.app/audit",
  },
};

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const severityTheme = {
  critical: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  high: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  info: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

export default function AuditHubPage() {
  const auditPages = getPagesByCategory("audit").sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const criticalCount = auditPages.filter((p) => p.severity === "critical").length;
  const highCount = auditPages.filter((p) => p.severity === "high").length;

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-white transition hover:text-cyan-400">
            ← AetherGuard
          </Link>
          <Link
            href="/analyze"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
          >
            Scan Contract
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* ─── Hero ─── */}
        <header className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {auditPages.length} vulnerability guides
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
            Smart Contract<br />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              Security Encyclopedia
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            The definitive guide to every major smart contract vulnerability.
            Expert-written, code-heavy, developer-focused.
            Each guide includes vulnerable examples and battle-tested fixes.
          </p>

          <div className="flex gap-3">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2">
              <span className="text-2xl font-bold text-rose-400">{criticalCount}</span>
              <span className="ml-2 text-xs text-slate-500">Critical</span>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
              <span className="text-2xl font-bold text-amber-400">{highCount}</span>
              <span className="ml-2 text-xs text-slate-500">High</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
              <span className="text-2xl font-bold text-white">{auditPages.length}</span>
              <span className="ml-2 text-xs text-slate-500">Total</span>
            </div>
          </div>
        </header>

        {/* ─── Grid ─── */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auditPages.map((page) => (
            <VulnerabilityCard key={page.slug} page={page} />
          ))}
        </div>

        {/* ─── Bottom CTA ─── */}
        <div className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to protect your contracts?</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            AetherGuard uses deep learning to detect all {auditPages.length} vulnerability classes listed above — and more.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/analyze"
              className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-10 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Start Free Scan
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/10 bg-white/5 px-10 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              View Plans
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} AetherGuard — AI-Powered Smart Contract Security
      </footer>
    </div>
  );
}

function VulnerabilityCard({ page }: { page: SEOPage }) {
  const theme = severityTheme[page.severity];
  return (
    <Link
      href={`/audit/${page.slug}`}
      className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-200 hover:border-cyan-500/30 hover:bg-white/[0.04] hover:-translate-y-1"
    >
      <span className={`self-start rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${theme}`}>
        {page.severity}
      </span>
      <h3 className="mt-3 text-base font-bold text-white transition group-hover:text-cyan-300">
        {page.h1}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
        {page.whatIsIt}
      </p>
      <span className="mt-4 text-xs font-semibold text-cyan-500 transition group-hover:text-cyan-300">
        Read guide →
      </span>
    </Link>
  );
}
