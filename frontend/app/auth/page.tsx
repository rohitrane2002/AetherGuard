"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  CommandLineIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";
import BackgroundGrid from "../components/BackgroundGrid";
import { Button, Panel, SectionHeading, StatCard } from "../components/ui";
import { hasAuthSession, storeAuthSession } from "../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

type AuthSuccessPayload = {
  access_token: string;
  refresh_token: string;
  user: {
    email: string;
  };
};

const onboardingSteps = [
  "Authenticate into your premium workspace",
  "Run a live Solidity scan",
  "Promote the strongest findings into your team archive",
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("founder@aetherguard.dev");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  const destinationLabel =
    nextPath === "/analyze"
      ? "AI Workspace"
      : nextPath === "/workspace"
        ? "Team Workspace"
        : nextPath === "/reports"
          ? "Audit Reports"
          : nextPath === "/notifications"
            ? "Signal Center"
            : "Command Center";

  useEffect(() => {
    if (hasAuthSession()) {
      router.replace("/dashboard");
    }
    if (typeof window !== "undefined") {
      setNextPath(new URLSearchParams(window.location.search).get("next"));
    }
  }, [router]);

  const submit = async () => {
    const slowRequestTimer = window.setTimeout(() => setSlowRequest(true), 6000);
    try {
      setLoading(true);
      setSlowRequest(false);
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const raw = await response.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { detail: raw };
        }
      }
      if (!response.ok) {
        toast.error(typeof data["detail"] === "string" ? data["detail"] as string : "Authentication failed");
        return;
      }
      const authData = data as unknown as AuthSuccessPayload;
      storeAuthSession(authData.access_token, authData.refresh_token, authData.user.email);
      toast.success(mode === "login" ? "Welcome back" : "Workspace created");
      router.push(nextPath || "/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      window.clearTimeout(slowRequestTimer);
      setSlowRequest(false);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <BackgroundGrid />
      <Toaster position="top-right" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Workspace Access"
            title="Enter your premium AI security operating system."
            subtitle="Authenticate to unlock live contract feedback, audit history, billing state, API keys, workspace collaboration, and the context-aware copilot."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Protected" value="JWT" helper="Refresh token-backed auth" />
            <StatCard label="Copilot" value="Context" helper="Uses recent scan history" accent="violet" />
            <StatCard label="Teams" value="Shared" helper="Workspace memory and roles" accent="emerald" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Panel>
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">Guided entry</h2>
                  <p className="text-sm text-slate-400">A premium onboarding surface for founders, auditors, and protocol operators.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {onboardingSteps.map((step, index) => (
                  <div key={step} className="panel-sheen rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cyan-500/10 text-sm font-semibold text-cyan-100">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm text-slate-300">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-3">
                <CommandLineIcon className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">After sign-in</h2>
                  <p className="text-sm text-slate-400">Your next destination is already queued.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Redirect target</p>
                  <div className="mt-3 flex items-center gap-3 text-white">
                    <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm">{destinationLabel}</span>
                    <ArrowRightIcon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300">Immediate access after auth</span>
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <CheckBadgeIcon className="mt-1 h-5 w-5 text-emerald-300" />
                    <p className="text-sm text-slate-300">
                      Sessions are persisted with access and refresh tokens so the workspace behaves like a real operating product, not a temporary demo shell.
                    </p>
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <UserGroupIcon className="mt-1 h-5 w-5 text-violet-300" />
                    <p className="text-sm text-slate-300">
                      Team invitations can now activate automatically when invited users sign in, making onboarding feel continuous across the workspace.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="mx-auto w-full max-w-xl">
          <div className="flex rounded-[22px] border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-slate-950" : "text-slate-300"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                mode === "register" ? "bg-white text-slate-950" : "text-slate-300"
              }`}
            >
              Create account
            </button>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-300">{mode === "login" ? "Sign in" : "Create account"}</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {mode === "login" ? "Return to AetherGuard." : "Create your AI security workspace."}
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            {mode === "login"
              ? `Resume your premium workflow and continue into ${destinationLabel}.`
              : `Start with a persistent workspace and continue directly into ${destinationLabel}.`}
          </p>

          <div className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none"
              placeholder="Password"
            />
            <Button onClick={submit} disabled={loading} className="w-full">
              {loading
                ? slowRequest
                  ? "Waking backend..."
                  : "Processing..."
                : mode === "login"
                  ? `Enter ${destinationLabel}`
                  : "Create workspace"}
            </Button>
            <Button tone="ghost" onClick={() => setMode(mode === "login" ? "register" : "login")} className="w-full">
              {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
            </Button>
          </div>
        </Panel>
      </div>
    </main>
  );
}
