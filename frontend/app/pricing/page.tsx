"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BoltIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import AppShell from "../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, getAuthToken, isUnauthorizedStatus, redirectToAuth, warmBackend } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For experimentation and solo contract checks.",
    priceId: "price_free_mock",
    features: ["5 scans / day", "AI workspace access", "PDF reports", "Workspace history"],
    ideal: "Best for trying the platform",
    icon: SparklesIcon,
  },
  {
    name: "Pro",
    price: "$49",
    description: "For auditors, founders, and active protocol teams.",
    priceId: "price_pro_mock",
    features: ["100 scans / day", "Priority AI copilot", "API access", "Advanced reports", "Team collaboration"],
    featured: true,
    ideal: "Best for shipping teams",
    icon: BoltIcon,
  },
  {
    name: "Enterprise",
    price: "$149",
    description: "For orgs, security teams, and protocol operations.",
    priceId: "price_enterprise_mock",
    features: ["Unlimited scans", "Workspace controls", "Dedicated support", "Enterprise onboarding", "Premium operating model"],
    ideal: "Best for multi-team operations",
    icon: BuildingOffice2Icon,
  },
];

type Account = {
  subscription_plan: string;
  subscription_status: string;
};

export default function PricingPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    // Warm up the backend if it's been sleeping (Render Free Tier latency)
    warmBackend();
    
    // Diagnostic check for reachability
    fetch(`${API_BASE_URL}/health`).catch(() => {
      toast.error(`DIAGNOSTIC: Backend at ${API_BASE_URL} is unreachable. Check your Vercel URL settings.`, { duration: 10000 });
    });

    const load = async () => {
      const token = getAuthToken();
      if (!token) return;
      const response = await authFetch(`${API_BASE_URL}/account`);
      if (!response.ok) return;
      setAccount(await response.json());
    };
    load();
  }, []);

  const startCheckout = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const response = await authFetch(`${API_BASE_URL}/ops/provision-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId }),
      });
      
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Checkout failed");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.success(data.plan === "free" ? "Plan reverted to Free" : "Plan upgraded successfully");
      setAccount((prev) => prev ? { ...prev, subscription_plan: data.plan, subscription_status: "active" } : null);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Network error: Unable to reach billing server");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const metrics = useMemo(
    () => [
      { label: "Starter access", value: "5", helper: "Daily free scans" },
      { label: "Pro velocity", value: "100", helper: "Daily premium scans", accent: "violet" as const },
      { label: "Enterprise mode", value: "∞", helper: "Ops-grade throughput", accent: "emerald" as const },
      { label: "Copilot", value: "Priority", helper: "Better workflows at paid tiers", accent: "amber" as const },
    ],
    []
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <SectionHeading
          eyebrow="Monetization"
          title="Choose the operating tier that matches your shipping speed."
          subtitle="AetherGuard now frames pricing like a real AI platform: entitlement depth, workspace scale, and contract-security throughput all ladder cleanly from evaluation to enterprise."
        />

        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              accent={metric.accent}
            />
          ))}
        </div>

        {account ? (
          <Panel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Current subscription</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{account.subscription_plan}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your workspace is currently operating in <span className="text-white">{account.subscription_status}</span> mode.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {account.subscription_status}
              </div>
              <Button tone="ghost" onClick={() => (window.location.href = "/account")}>
                Review account
              </Button>
            </div>
          </Panel>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const current = account?.subscription_plan?.toLowerCase() === plan.name.toLowerCase();
            const Icon = plan.icon;
            return (
              <Panel key={plan.name} className={plan.featured ? "border-cyan-400/30 shadow-[0_30px_120px_rgba(95,231,255,0.12)]" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Icon className={`h-5 w-5 ${plan.featured ? "text-cyan-300" : "text-slate-300"}`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.featured ? (
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">Most popular</span>
                    ) : null}
                    {current ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">Current plan</span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">{plan.name}</p>
                  <h2 className="mt-3 text-4xl font-semibold text-white">
                    {plan.price}
                    <span className="text-base text-slate-400">/mo</span>
                  </h2>
                  <p className="mt-4 text-sm text-slate-400">{plan.description}</p>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Ideal for</p>
                  <p className="mt-2 text-sm text-white">{plan.ideal}</p>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      {feature}
                    </div>
                  ))}
                </div>

                <Button 
                  className="mt-6 w-full" 
                  tone={current ? "ghost" : "primary"} 
                  onClick={() => startCheckout(plan.priceId)}
                  disabled={loadingPriceId !== null}
                >
                  {loadingPriceId === plan.priceId ? "Processing..." : (current ? `Stay on ${plan.name}` : `Choose ${plan.name}`)}
                </Button>
              </Panel>
            );
          })}
        </div>

        <Panel>
          <div className="flex items-center gap-3">
            <CheckBadgeIcon className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Why teams upgrade</h2>
              <p className="text-sm text-slate-400">Clearer entitlements, stronger throughput, and a more operational workspace model.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Pro unlocks the AI workspace at meaningful daily volume for founders and auditors who need repetition, not just experimentation.
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Enterprise is about operational confidence: workspace controls, multi-stakeholder reporting, and a more mature upgrade path.
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Paid tiers turn AetherGuard from a demo environment into an always-on AI security operating surface.
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
