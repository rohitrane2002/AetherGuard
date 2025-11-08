"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#0d1117]/80 backdrop-blur border-b border-gray-800 text-gray-300 flex items-center justify-between px-8 py-3 z-50">
      <h1 className="text-lg font-bold text-fuchsia-400 tracking-wide">
        AetherGuard
      </h1>
      <div className="flex gap-6 text-sm">
        <Link href="/" className="hover:text-fuchsia-400">
          Home
        </Link>
        <Link href="/analyze" className="hover:text-fuchsia-400">
          Analyzer
        </Link>
        <Link href="/reports" className="hover:text-fuchsia-400">
          Reports
        </Link>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hover:text-fuchsia-400"
        >
          API Docs
        </a>
      </div>
    </nav>
  );
}