"use client";

import type { ReactNode } from "react";
import BackgroundGrid from "./BackgroundGrid";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={`relative min-h-screen overflow-hidden ${className}`}>
      <BackgroundGrid />
      <Sidebar />
      <Navbar />
      <div className="relative min-h-screen px-4 pb-16 pt-28 md:pl-[304px] md:pr-6">{children}</div>
    </main>
  );
}
