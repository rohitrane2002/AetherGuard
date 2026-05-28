import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ALL_SEO_PAGES,
  getPageBySlug,
  getRelatedPages,
  getPagesByCategory,
} from "../../lib/seo/keywords";
import { ChevronRightIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

/* ──────────────────────────────────────────────
   SSG — generate every audit page at build time
   ────────────────────────────────────────────── */
export function generateStaticParams() {
  return getPagesByCategory("audit").map((p) => ({ slug: p.slug }));
}

/* ──────────────────────────────────────────────
   Dynamic Metadata for SEO
   ────────────────────────────────────────────── */
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getPageBySlug(params.slug);
  if (!page) return { title: "Not Found | AetherGuard" };

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords.join(", "),
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: "article",
      siteName: "AetherGuard",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
    },
    alternates: {
      canonical: `https://aetherguard.vercel.app/audit/${page.slug}`,
    },
  };
}

/* ──────────────────────────────────────────────
   Severity badge colors
   ────────────────────────────────────────────── */
const severityTheme = {
  critical: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
  high:     { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  medium:   { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  low:      { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  info:     { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
};

/* ──────────────────────────────────────────────
   JSON-LD Structured Data
   ────────────────────────────────────────────── */
function ArticleJsonLd({ page }: { page: NonNullable<ReturnType<typeof getPageBySlug>> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.h1,
    description: page.metaDescription,
    author: { "@type": "Organization", name: "AetherGuard" },
    publisher: { "@type": "Organization", name: "AetherGuard" },
    keywords: page.keywords.join(", "),
    mainEntityOfPage: `https://aetherguard.vercel.app/audit/${page.slug}`,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

/* ──────────────────────────────────────────────
   PAGE COMPONENT
   ────────────────────────────────────────────── */
export default function AuditPage({ params }: { params: { slug: string } }) {
  const page = getPageBySlug(params.slug);
  if (!page) notFound();

  const theme = severityTheme[page.severity];
  const related = getRelatedPages(page);

  return (
    <>
      <ArticleJsonLd page={page} />

      <div className="min-h-screen bg-[#030712]">
        {/* ─── Top Navigation Bar ─── */}
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-white">AetherGuard</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/audit" className="transition hover:text-white">Security Guides</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="truncate text-slate-300">{page.h1}</span>
          </div>
        </nav>

        <article className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          {/* ─── Header ─── */}
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.border} ${theme.text} border`}>
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {page.severity} severity
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                {page.category === "audit" ? "Vulnerability Guide" : "Security Tool"}
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
              {page.h1}
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
              {page.metaDescription}
            </p>
          </header>

          {/* ─── Inline CTA: Scan Input ─── */}
          <div className="my-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">Is your contract vulnerable to {page.h1.toLowerCase().split(" ")[0]} attacks?</h2>
                <p className="text-sm text-slate-400">Paste your Solidity code and get an instant AI security scan — free.</p>
              </div>
              <Link
                href="/analyze"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(95,231,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(91,124,255,0.22)]"
              >
                Scan Your Contract →
              </Link>
            </div>
          </div>

          {/* ─── Content Sections ─── */}
          <div className="space-y-12">
            {/* What Is It */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">What is {page.h1}?</h2>
              <p className="leading-relaxed text-slate-300">{page.whatIsIt}</p>
            </section>

            {/* Why It Matters */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Why It Matters</h2>
              <p className="leading-relaxed text-slate-300">{page.whyItMatters}</p>
            </section>

            {/* Vulnerable Example */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Vulnerable Code Example</h2>
              <div className="overflow-hidden rounded-xl border border-rose-500/20 bg-black/60">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-mono text-rose-400">Vulnerable Pattern</span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                  <code className="text-slate-300">{page.example}</code>
                </pre>
              </div>
            </section>

            {/* How to Fix */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">How to Fix</h2>
              <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-black/60">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-emerald-400">Safe Pattern</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap p-4 text-sm leading-relaxed">
                  <code className="text-slate-300">{page.howToFix}</code>
                </pre>
              </div>
            </section>
          </div>

          {/* ─── Bottom CTA ─── */}
          <div className="my-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Don&apos;t deploy vulnerable code.</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              AetherGuard scans your Solidity contracts with AI and detects {page.h1.toLowerCase()} and 50+ other vulnerabilities in seconds.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/analyze"
                className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Start Free Scan
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* ─── Related Guides ─── */}
          {related.length > 0 && (
            <section>
              <h2 className="mb-6 text-xl font-bold text-white">Related Security Guides</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => {
                  const rt = severityTheme[r.severity];
                  return (
                    <Link
                      key={r.slug}
                      href={`/audit/${r.slug}`}
                      className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${rt.text}`}>
                        {r.severity}
                      </span>
                      <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-cyan-300">
                        {r.h1}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {r.metaDescription}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Cross-Link CTA ─── */}
          <div className="mt-12 border-t border-white/5 pt-12">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-white/[0.02] p-6 md:flex-row">
              <div>
                <h3 className="text-lg font-bold text-white">Need specialized security tools?</h3>
                <p className="text-sm text-slate-400">Browse our suite of free AI tools for gas optimization, ABI decoding, and more.</p>
              </div>
              <Link
                href="/tools"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Free Tools
              </Link>
            </div>
          </div>
        </article>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} AetherGuard — AI-Powered Smart Contract Security
        </footer>
      </div>
    </>
  );
}
