"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowUpRightIcon,
  BellIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { authFetch, clearAuthSession, getAuthEmail } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

export default function Navbar() {
  const email = getAuthEmail();
  const [plan, setPlan] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!email) return;
    const load = async () => {
      const [accountRes, usageRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/account`),
        authFetch(`${API_BASE_URL}/usage`),
      ]);
      if (accountRes.ok) {
        const account = await accountRes.json();
        setPlan(account.subscription_plan ?? null);
      }
      if (usageRes.ok) {
        const usage = await usageRes.json();
        setRemaining(typeof usage.remaining_today === "number" ? usage.remaining_today : null);
      }
    };
    load();
  }, [email]);

  return (
    <header className="fixed right-0 top-0 z-50 flex w-full items-center justify-end px-4 py-3 md:pl-[304px] md:pr-6">
      <div className="glass-panel panel-sheen flex w-full max-w-[calc(100vw-320px)] flex-wrap items-center justify-between gap-3 rounded-[24px] px-5 py-3.5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">AetherGuard Intelligence Layer</p>
          <h1 className="text-sm font-medium text-slate-200">AI-native smart contract defense platform</h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {plan ? (
            <div className="hidden rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/80">Plan</p>
              <p className="text-sm text-white">{plan}</p>
            </div>
          ) : null}
          {remaining !== null ? (
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Allowance</p>
              <p className="text-sm text-white">{remaining} scans left</p>
            </div>
          ) : null}
          <Link
            href="/analyze"
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:inline-flex"
          >
            <SparklesIcon className="h-4 w-4 text-cyan-300" />
            Scan
          </Link>
          <Link
            href="/workspace"
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:inline-flex"
          >
            <UserGroupIcon className="h-4 w-4 text-violet-300" />
            Team
          </Link>
          <Link
            href="/notifications"
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:inline-flex"
          >
            <BellIcon className="h-4 w-4 text-cyan-300" />
            Alerts
          </Link>
          <Link
            href="/pricing"
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:inline-flex"
          >
            {plan?.toLowerCase() === "free" ? "Upgrade" : "Plans"}
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right md:block">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Workspace</p>
            <p className="max-w-[220px] truncate text-sm text-white">{email ?? "Guest session"}</p>
          </div>
          {email ? (
            <button
              onClick={() => {
                clearAuthSession();
                window.location.href = "/auth";
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(95,231,255,0.18)] transition hover:scale-[1.01]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
