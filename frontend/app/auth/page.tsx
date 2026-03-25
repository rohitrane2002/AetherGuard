"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import BackgroundGrid from "../components/BackgroundGrid";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { hasAuthSession, storeAuthSession } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("founder@aetherguard.dev");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasAuthSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const submit = async () => {
    try {
      setLoading(true);
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.detail || "Authentication failed");
        return;
      }
      storeAuthSession(data.access_token, data.refresh_token, data.user.email);
      toast.success(mode === "login" ? "Logged in successfully" : "Account created successfully");
      router.push(searchParams.get("next") || "/dashboard");
    } catch (error) {
      console.error("Auth error", error);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1117] text-gray-200 md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />
      <Toaster position="top-right" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl items-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Account Access
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white">
            {mode === "login" ? "Sign in to AetherGuard" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Secure your analysis history, billing state, API keys, and AI chat workspace.
          </p>
          {searchParams.get("next") && (
            <p className="mt-3 text-xs text-amber-300">
              Sign in to continue to {searchParams.get("next")}
            </p>
          )}

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <button
              onClick={submit}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
            </button>
          </div>

          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-5 text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            {mode === "login" ? "Need an account? Create one" : "Already registered? Sign in"}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
