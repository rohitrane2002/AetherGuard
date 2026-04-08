"use client";

import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../../components/ui";
import { 
  RocketLaunchIcon, 
  ArrowPathIcon, 
  ChatBubbleBottomCenterTextIcon, 
  MagnifyingGlassCircleIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function GrowthAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [socialContent, setSocialContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("https://aetherguard-api.onrender.com/growth/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  const generateSEO = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://aetherguard-api.onrender.com/growth/trigger-seo-batch", { method: "POST" });
      const data = await res.json();
      console.log("SEO Response:", data);
      if (res.ok) {
        toast.success("SEO Encyclopedia Batch Triggered!");
        fetchStats();
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSocial = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://aetherguard-api.onrender.com/growth/generate-social", { method: "POST" });
      const data = await res.json();
      console.log("Social Response:", data);
      setSocialContent(data);
      toast.success("Daily Social Content Generated!");
    } finally {
      setLoading(false);
    }
  };

  const testAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://aetherguard-api.onrender.com/growth/test-ai");
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`AI Online: ${data.response}`);
      } else {
        toast.error(`AI Error: ${data.detail}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SectionHeading 
            eyebrow="Strategy"
            title="Growth Engine Admin" 
            subtitle="Automated acquisition, SEO, and social ghostwriting dashboard."
          />
          <div className="flex gap-4">
             <Button tone="ghost" onClick={testAI} disabled={loading} className="flex items-center gap-2">
               Test AI Connectivity
             </Button>
             <Button tone="ghost" onClick={fetchStats} className="flex items-center gap-2">
               <ArrowPathIcon className="w-4 h-4" /> Refresh
             </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="pSEO Encyclopedia Pages" 
            value={String(stats?.seo_pages_live || 0)} 
            helper="Live on /audit/[slug]"
          />
          <StatCard 
            label="Pro Subscription Users" 
            value={String(stats?.pro_users || 0)} 
            accent="violet"
            helper="Active monthly revenue"
          />
          <StatCard 
            label="Growth Engine State" 
            value="Active" 
            accent="emerald"
            helper="Multi-agent system operational"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SEO Management */}
          <Panel className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6 text-violet-400" />
              SEO Encyclopedia
            </h2>
            <p className="text-gray-400 text-sm">
              Batch generate high-quality pSEO guides for [Slug] pages. 
              Targets long-tail keywords for Solidity vulnerabilities.
            </p>
            <Button 
                tone="primary" 
                className="w-full" 
                onClick={generateSEO}
                disabled={loading}
            >
              Generate Encyclopedia Batch
            </Button>
            
            <div className="pt-4 border-t border-white/5 space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Live Routes</h3>
               <div className="space-y-2">
                 {["reentrancy", "flash-loan-attacks", "frontrunning"].map(path => (
                   <a key={path} href={`/audit/${path}`} target="_blank" className="block text-sm text-violet-400 hover:underline">
                     /audit/{path}
                   </a>
                 ))}
               </div>
            </div>
          </Panel>

          {/* Social Social */}
          <Panel className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-emerald-400" />
              Social Media Content
            </h2>
            <p className="text-gray-400 text-sm">
              Generate today's Twitter thread and LinkedIn posts based on latest platform data.
            </p>
            <Button 
                tone="primary" 
                onClick={generateSocial}
                disabled={loading}
            >
              Write Daily Content
            </Button>

            {socialContent && (
              <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
                {socialContent.error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                    <p className="font-bold">Generation Error:</p>
                    <p className="opacity-80">{socialContent.error}</p>
                  </div>
                )}

                {socialContent.twitter_thread && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-emerald-400">Twitter Thread</h3>
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-4">
                        {socialContent.twitter_thread.map((tweet: string, i: number) => (
                          <div key={i} className="text-sm text-gray-300 font-mono pb-4 border-b border-white/5 last:border-0 last:pb-0">
                            {tweet}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {socialContent.linkedin_post && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-blue-400">LinkedIn Post</h3>
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {socialContent.linkedin_post}
                    </div>
                  </div>
                )}

                {!socialContent.twitter_thread && !socialContent.error && socialContent.raw_response && (
                   <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase text-amber-400">Raw AI Response</h3>
                      <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-sm text-gray-400 whitespace-pre-wrap">
                         {socialContent.raw_response}
                      </div>
                   </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
