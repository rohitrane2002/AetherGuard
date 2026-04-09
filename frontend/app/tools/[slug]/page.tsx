import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPageBySlug,
  getRelatedPages,
  getPagesByCategory,
} from "../../lib/seo/keywords";
import { WrenchScrewdriverIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

/* ──────────────────────────────────────────────
   SSG — generate every tool page at build time
   ────────────────────────────────────────────── */
export function generateStaticParams() {
  return getPagesByCategory("tools").map((p) => ({ slug: p.slug }));
}

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
      type: "website",
      siteName: "AetherGuard",
    },
    alternates: {
      canonical: `https://aetherguard.vercel.app/tools/${page.slug}`,
    },
  };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const page = getPageBySlug(params.slug);
  if (!page) notFound();

  const related = getRelatedPages(page);

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-white">AetherGuard</Link>
          <ChevronRightIcon className="h-3 w-3" />
          <Link href="/tools" className="transition hover:text-white">Security Tools</Link>
          <ChevronRightIcon className="h-3 w-3" />
          <span className="truncate text-slate-300">{page.h1}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        {/* ─── Hero ─── */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
            <WrenchScrewdriverIcon className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Security Tool</span>
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
            {page.h1}
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            {page.metaDescription}
          </p>
        </header>

        {/* ─── Primary CTA ─── */}
        <div className="my-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-violet-500/5 p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Try it now — free</h2>
              <p className="text-sm text-slate-400">Paste your Solidity code and get instant vulnerability analysis.</p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex shrink-0 items-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-10 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(95,231,255,0.18)] transition hover:-translate-y-0.5"
            >
              Open Scanner →
            </Link>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">What is {page.h1}?</h2>
            <p className="leading-relaxed text-slate-300">{page.whatIsIt}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Why Use This Tool</h2>
            <p className="leading-relaxed text-slate-300">{page.whyItMatters}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">What You Get</h2>
            <div className="rounded-xl border border-cyan-500/10 bg-black/60 p-5">
              <pre className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{page.example}</pre>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">How It Works</h2>
            <p className="leading-relaxed text-slate-300 whitespace-pre-wrap">{page.howToFix}</p>
          </section>
        </div>

        {/* ─── Related ─── */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-white">Related Tools</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/tools/${r.slug}`}
                  className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
                >
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300">{r.h1}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{r.metaDescription}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Bottom CTA ─── */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ship secure code, every time.</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            AetherGuard's AI finds the bugs that manual reviews miss.
          </p>
          <Link
            href="/analyze"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-600 px-10 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            Start Free Scan
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} AetherGuard — AI-Powered Smart Contract Security
      </footer>
    </div>
  );
}
