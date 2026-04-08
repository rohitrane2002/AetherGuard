import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { Button, Panel, SectionHeading } from "../../components/ui";
import { ChevronRightIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

// Note: In a production app, fetch from your REAL API /growth/page/{slug}
async function getGrowthPage(slug: string) {
  const res = await fetch(`https://aetherguard-api.onrender.com/growth/page/${slug}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getGrowthPage(params.slug);
  if (!page) return { title: "Vulnerability Not Found | AetherGuard" };

  return {
    title: `${page.title} | AetherGuard Encyclopedia`,
    description: page.meta_description,
    keywords: page.keywords,
  };
}

export default async function AuditVulnerabilityPage({ params }: { params: { slug: string } }) {
  const page = await getGrowthPage(params.slug);

  if (!page) notFound();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-gray-500 space-x-2 items-center">
          <Link href="/" className="hover:text-violet-400">Home</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <Link href="/audit" className="hover:text-violet-400">Audit Hub</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-violet-400 font-medium truncate">{page.title}</span>
        </nav>

        {/* Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Smart Contract Security Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {page.title}
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-light italic">
            {page.meta_description}
          </p>
        </header>

        {/* CTA: Scan Now */}
        <Panel className="border-violet-500/30 bg-gradient-to-br from-violet-600/5 to-transparent">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Is your contract vulnerable?</h3>
              <p className="text-sm text-gray-400">Run an AI security scan in 15 seconds to detect this and 50+ other bugs.</p>
            </div>
            <Link href="/dashboard">
              <Button tone="primary" className="shadow-[0_0_20px_rgba(139,92,246,0.3)] px-8 py-3">
                Start Free Scan
              </Button>
            </Link>
          </div>
        </Panel>

        {/* Main Content */}
        <article 
          className="prose prose-invert prose-violet max-w-none 
          prose-headings:text-white prose-headings:font-black 
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5
          prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: page.content_html }}
        />

        {/* Footer CTA */}
        <div className="pt-12 border-t border-white/5 text-center space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Protect Your Deployment</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            AetherGuard uses deep learning to catch the subtle logic flaws that traditional scanners miss.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pricing">
              <Button tone="ghost">View Pro Plans</Button>
            </Link>
            <Link href="/dashboard">
              <Button tone="primary">Analyze Contract</Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
