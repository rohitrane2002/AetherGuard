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
import { hasAuthSession, isBackendWarm, resilientFetch, storeAuthSession, warmBackend } from "../lib/auth";

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

/* ── SVG Icons for OAuth ─────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [email, setEmail] = useState("founder@aetherguard.dev");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [backendWarming, setBackendWarming] = useState(() => !isBackendWarm());

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

  useEffect(() => {
    let active = true;
    warmBackend().finally(() => {
      if (active) {
        setBackendWarming(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    const slowRequestTimer = window.setTimeout(() => setSlowRequest(true), 6000);
    try {
      setLoading(true);
      setSlowRequest(false);
      if (!isBackendWarm()) {
        await warmBackend();
      }
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await resilientFetch(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        { retries: 1, retryDelayMs: 900 }
      );
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
        if (data["detail"] === "EMAIL_NOT_VERIFIED") {
          toast.success("Please verify your email");
          setMode("verify");
          return;
        }
        toast.error(typeof data["detail"] === "string" ? data["detail"] as string : "Authentication failed");
        return;
      }
      
      if (mode === "register") {
        setMode("verify");
        toast.success("Account created! Check your email for verification code.");
        return;
      }

      const authData = data as unknown as AuthSuccessPayload;
      storeAuthSession(authData.access_token, authData.refresh_token, authData.user.email);
      await warmBackend();
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

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.detail || "Verification failed");
        return;
      }
      toast.success("Email verified! You can now login.");
      setMode("login");
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      toast.loading("Sending new code...", { id: "resend-otp" });
      const resp = await fetch(`${API_BASE_URL}/auth/resend-otp?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      if (resp.ok) {
        toast.success("New code sent!", { id: "resend-otp" });
      } else {
        toast.error("Failed to resend code", { id: "resend-otp" });
      }
    } catch (error) {
      toast.error("Failed to resend code", { id: "resend-otp" });
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${API_BASE_URL}/auth/oauth/${provider}`;
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <BackgroundGrid />
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

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <span className={`h-2 w-2 rounded-full ${backendWarming ? "animate-pulse bg-amber-300" : "bg-emerald-300"}`} />
            {backendWarming ? "Preparing secure runtime..." : "Secure runtime online"}
          </div>

          {/* ── OAuth Buttons ──────────────────────────────────── */}
          <div className="mt-6 space-y-3">
            <button
              id="btn-google-oauth"
              onClick={() => handleOAuth("google")}
              className="group flex w-full items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(66,133,244,0.15)]"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button
              id="btn-github-oauth"
              onClick={() => handleOAuth("github")}
              className="group flex w-full items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <GitHubIcon />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs text-slate-500">or continue with email</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* ── Email/Password Form ──────────────────────────── */}
          <div className="space-y-4">
            {mode === "verify" ? (
              <>
                <p className="text-sm text-slate-300">We've sent a 6-digit code to <span className="font-semibold text-white">{email}</span></p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl tracking-[0.5em] rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none focus:border-cyan-400/40 transition"
                  placeholder="000000"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
                <div className="flex justify-between items-center px-2">
                  <button 
                    onClick={handleResendOtp}
                    className="text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Resend code
                  </button>
                  <button 
                    onClick={() => setMode("login")}
                    className="text-xs text-slate-500 hover:text-slate-400"
                  >
                    Back to login
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none focus:border-cyan-400/40 transition"
                  placeholder="Email"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white outline-none focus:border-cyan-400/40 transition"
                  placeholder="Password"
                />
                <Button
                  onClick={submit}
                  disabled={loading}
                  className="w-full"
                  onMouseEnter={() => {
                    if (!isBackendWarm()) void warmBackend();
                  }}
                  onFocus={() => {
                    if (!isBackendWarm()) void warmBackend();
                  }}
                >
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
              </>
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
