"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bars3Icon,
  BellAlertIcon,
  ChartBarSquareIcon,
  CodeBracketSquareIcon,
  CreditCardIcon,
  HomeModernIcon,
  KeyIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { authFetch, getAuthEmail } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const email = getAuthEmail();

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

  const links = useMemo(
    () => [
      { href: "/", label: "Overview", icon: HomeModernIcon },
      { href: "/dashboard", label: "Command Center", icon: RectangleGroupIcon },
      { href: "/analyze", label: "AI Workspace", icon: SparklesIcon },
      { href: "/repos", label: "GitHub Scanner", icon: CodeBracketSquareIcon },
      { href: "/workspace", label: "Team Workspace", icon: UserGroupIcon },
      { href: "/notifications", label: "Alerts", icon: BellAlertIcon },
      { href: "/reports", label: "Audit Reports", icon: ChartBarSquareIcon },
      { href: "/pricing", label: "Plans", icon: CreditCardIcon },
      { href: "/account", label: "Account", icon: UserCircleIcon },
      { href: `${API_BASE_URL}/docs`, label: "API Docs", icon: KeyIcon, external: true },
    ],
    []
  );

  return (
    <>
      <button
        onClick={() => setOpen((current) => !current)}
        className="fixed left-4 top-4 z-[70] rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-slate-100 backdrop-blur md:hidden"
      >
        {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[280px] transform px-4 pb-5 pt-5 transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="glass-panel flex h-full flex-col rounded-[28px] p-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_40px_rgba(95,231,255,0.22)]">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">AetherGuard</p>
                <h2 className="text-lg font-semibold text-white">AI Security OS</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Premium contract defense for teams shipping on-chain software.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan ? (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                  {plan}
                </span>
              ) : null}
              {remaining !== null ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {remaining} scans left
                </span>
              ) : null}
            </div>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = !link.external && pathname === link.href;
              const className = `glow-ring rounded-2xl px-4 py-3 transition ${
                active
                  ? "bg-white/10 text-white shadow-[0_10px_40px_rgba(91,124,255,0.18)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`;

              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </div>
                  </a>
                );
              }

              return (
                <Link key={link.href} href={link.href} className={className} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3">
            <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Live posture</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-white">Operational</p>
                  <p className="text-sm text-slate-400">{plan?.toLowerCase() === "free" ? "Evaluation mode active" : "Premium workspace online"}</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(45,212,191,0.8)]" />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick actions</p>
              <div className="mt-3 grid gap-2">
                <Link href="/analyze" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:text-white">
                  Run live scan
                </Link>
                <Link href="/repos" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400/30 hover:text-white">
                  GitHub Scanner
                </Link>
                <Link href="/workspace" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-violet-400/30 hover:text-white">
                  Open team workspace
                </Link>
                <Link href="/pricing" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/30 hover:text-white">
                  {plan?.toLowerCase() === "free" ? "Unlock Pro" : "Review plans"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
