"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

  const links = [
    { href: "/", label: "Home" },
    { href: "/auth", label: "Auth" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/analyze", label: "Analyzer" },
    { href: "/pricing", label: "Pricing" },
    { href: "/account", label: "Account" },
    { href: "/reports", label: "Reports" },
    { href: `${apiBaseUrl}/docs`, label: "API Docs" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-gray-800/60 p-2 md:hidden"
      >
        {open ? <XMarkIcon className="h-6 w-6 text-fuchsia-400" /> : <Bars3Icon className="h-6 w-6 text-fuchsia-400" />}
      </button>

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-56 transform border-r border-gray-700 bg-[#0d1117]/90 backdrop-blur-md transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-gray-700 px-4 py-6 text-lg font-bold text-fuchsia-400">
          AetherGuard
        </div>
        <nav className="flex flex-col gap-2 p-4 text-gray-300">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-1 text-sm transition-colors hover:bg-white/5 hover:text-fuchsia-400"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
