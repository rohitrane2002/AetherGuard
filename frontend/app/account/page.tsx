"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckBadgeIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import AppShell from "../components/AppShell";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { authFetch, clearAuthSession, isUnauthorizedStatus, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type Account = {
  id: string;
  email: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  stripe_customer_id?: string | null;
  created_at: string;
};

type Usage = {
  subscription_plan: string;
  daily_limit: number;
  analyses_today: number;
  remaining_today: number;
};

function AccountPageContent() {
  const { ready } = useProtectedRoute();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<Account | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription upgraded! Welcome to Pro.", {
        icon: "🚀",
        duration: 6000,
      });
      // Replace URL to clean state
      window.history.replaceState({}, "", "/account");
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const [accountRes, usageRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/account`),
        authFetch(`${API_BASE_URL}/usage`),
      ]);
      if ([accountRes, usageRes].some((res) => isUnauthorizedStatus(res.status))) {
        redirectToAuth(true);
        return;
      }
      setAccount(await accountRes.json());
      setUsage(await usageRes.json());
    };
    if (ready) load();
  }, [ready]);

  const openBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/create-billing-portal-session`, {
        method: "POST",
      });
      if (isUnauthorizedStatus(response.status)) {
        redirectToAuth(true);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Unable to open billing portal");
        return;
      }
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
        return;
      }
      toast.error("Billing portal is unavailable");
    } catch {
      toast.error("Billing portal request failed");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const planNarrative = useMemo(() => {
    if (!account || !usage) return null;
    const plan = account.subscription_plan.toLowerCase();
    if (plan === "enterprise") {
      return "Your workspace is configured for high-throughput contract operations with the broadest entitlement set.";
    }
    if (plan === "pro") {
      return "Your workspace is in premium production mode with higher scan throughput, API access, and stronger operator tooling.";
    }
    return "You are still in evaluation mode. Upgrade to unlock higher throughput, team-oriented workflows, and stronger operating leverage.";
  }, [account, usage]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Account Center"
          title="Manage identity, billing, and entitlement posture."
          subtitle="The account center now behaves more like a real SaaS control layer: subscription state, throughput visibility, and billing operations live together in one place."
        />

        {account ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Account" value={account.email} helper={`User identity active`} />
              <StatCard label="Plan" value={account.subscription_plan} helper={account.subscription_status} accent="violet" />
              <StatCard label="Access" value={account.is_active ? "Active" : "Inactive"} helper={account.stripe_customer_id || "No billing profile"} accent="emerald" />
              <StatCard label="Usage" value={usage ? `${usage.analyses_today}/${usage.daily_limit}` : "--"} helper={usage ? `${usage.remaining_today} scans left today` : "Loading"} accent="amber" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <Panel>
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="h-5 w-5 text-cyan-300" />
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Billing and plan posture</h2>
                    <p className="text-sm text-slate-400">Subscription clarity, entitlement awareness, and direct billing access.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Entitlement narrative</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{planNarrative}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => (window.location.href = "/pricing")}>
                    {account.subscription_plan.toLowerCase() === "free" ? "Upgrade plan" : "Review plans"}
                  </Button>
                  <Button tone="ghost" onClick={openBillingPortal} disabled={isOpeningPortal}>
                    {isOpeningPortal ? "Opening billing..." : "Open billing portal"}
                  </Button>
                  <Button tone="ghost" onClick={() => window.location.reload()}>Refresh state</Button>
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-cyan-300" />
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Access state</h2>
                    <p className="text-sm text-slate-400">How your workspace currently presents itself operationally.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current plan</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{account.subscription_plan}</p>
                    <p className="mt-2 text-sm text-slate-400">Status: {account.subscription_status}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Workspace allowance</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{usage?.daily_limit ?? "--"} scans / day</p>
                    <p className="mt-2 text-sm text-slate-400">{usage?.remaining_today ?? "--"} remaining today</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start gap-3">
                      <CheckBadgeIcon className="mt-1 h-5 w-5 text-cyan-300" />
                      <p className="text-sm text-slate-300">
                        {account.subscription_plan.toLowerCase() === "free"
                          ? "Free mode keeps the platform accessible, but the strongest value shows up once throughput and team workflows expand."
                          : "Your current plan is aligned with a premium operator experience, including richer audit workflows and stronger workspace leverage."}
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Session controls</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button tone="danger" onClick={() => {
                  clearAuthSession();
                  window.location.href = "/auth";
                }}>
                  Logout
                </Button>
              </div>
            </Panel>
          </>
        ) : (
          <Panel>Loading account center...</Panel>
        )}
      </div>
    </AppShell>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageContent />
    </Suspense>
  );
}
