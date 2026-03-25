"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { CreditCardIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/solid";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BackgroundGrid from "../components/BackgroundGrid";
import { clearAuthSession, isUnauthorizedError, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type Account = {
  id: number;
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

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, ready } = useProtectedRoute();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");

  useEffect(() => {
    const loadAccount = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: accountData }, { data: usageData }] = await Promise.all([
          axios.get<Account>(`${API_BASE_URL}/account`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Usage>(`${API_BASE_URL}/usage`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAccount(accountData);
        setUsage(usageData);
      } catch (error) {
        console.error("Account fetch error", error);
        if (isUnauthorizedError(error)) {
          redirectToAuth(true);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    if (ready) {
      loadAccount();
    }
  }, [checkoutState, ready, token]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1117] text-gray-200 md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />

      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            <UserCircleIcon className="h-4 w-4" />
            Account Center
          </div>
          <h1 className="text-5xl font-extrabold text-white">Account & Billing</h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Review your authenticated account state, active subscription tier,
            and Stripe customer linkage.
          </p>
        </motion.div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          {checkoutState === "success" && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
              Checkout returned successfully. Your account state has been refreshed from the backend.
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-400">Loading account...</p>
          ) : !account ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Login from `/auth` to load your protected account profile.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <InfoCard
                icon={<UserCircleIcon className="h-5 w-5 text-cyan-300" />}
                label="User"
                value={account.email}
                subtitle={`Account #${account.id}`}
              />
              <InfoCard
                icon={<CreditCardIcon className="h-5 w-5 text-fuchsia-300" />}
                label="Plan"
                value={account.subscription_plan}
                subtitle={`Status: ${account.subscription_status}`}
              />
              <InfoCard
                icon={<ShieldCheckIcon className="h-5 w-5 text-emerald-300" />}
                label="Access"
                value={account.is_active ? "Active" : "Inactive"}
                subtitle={account.stripe_customer_id || "No Stripe customer yet"}
              />
              <InfoCard
                icon={<ShieldCheckIcon className="h-5 w-5 text-amber-300" />}
                label="Usage"
                value={
                  usage
                    ? `${usage.analyses_today}/${usage.daily_limit}`
                    : "Unavailable"
                }
                subtitle={
                  usage
                    ? `${usage.remaining_today} scans remaining today`
                    : "No usage stats loaded"
                }
              />
            </div>
          )}

          <button
            onClick={() => {
              clearAuthSession();
              window.location.reload();
            }}
            className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
          >
            Clear Local Session
          </button>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
