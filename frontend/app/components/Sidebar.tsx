"use client";
import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "🏠 Home" },
    { href: "/analyze", label: "🧠 Analyzer" },
    { href: "/reports", label: "📊 Reports" },
    { href: "http://127.0.0.1:8000/docs", label: "⚙️ API Docs" },
  ];

  return (
    <>
      {/* mobile button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800/60 p-2 rounded-lg border border-white/10"
      >
        {open ? <XMarkIcon className="w-6 h-6 text-fuchsia-400" /> : <Bars3Icon className="w-6 h-6 text-fuchsia-400" />}
      </button>

      {/* sidebar itself */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-[#0d1117]/90 backdrop-blur-md border-r border-gray-700 z-40 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="py-6 px-4 text-fuchsia-400 font-bold text-lg border-b border-gray-700">
          AetherGuard
        </div>
        <nav className="flex flex-col gap-2 p-4 text-gray-300">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-fuchsia-400 transition-colors text-sm"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
