"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { clearAuthSession, getAuthEmail } from "../lib/auth";

export default function Navbar() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getAuthEmail());
  }, []);

  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between border-b border-gray-800 bg-[#0d1117]/80 px-8 py-3 text-gray-300 backdrop-blur">
      <h1 className="text-lg font-bold tracking-wide text-fuchsia-400">AetherGuard</h1>
      <div className="flex gap-6 text-sm">
        <Link href="/" className="hover:text-fuchsia-400">
          Home
        </Link>
        <Link href="/dashboard" className="hover:text-fuchsia-400">
          Dashboard
        </Link>
        <Link href="/analyze" className="hover:text-fuchsia-400">
          Analyzer
        </Link>
        <Link href="/pricing" className="hover:text-fuchsia-400">
          Pricing
        </Link>
        <Link href="/reports" className="hover:text-fuchsia-400">
          Reports
        </Link>
        <a
          href={`${apiBaseUrl}/docs`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-fuchsia-400"
        >
          API Docs
        </a>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <span className="max-w-[220px] truncate text-xs text-slate-400">{email ?? "Guest"}</span>
        {email && (
          <button
            onClick={() => {
              clearAuthSession();
              window.location.href = "/auth";
            }}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
