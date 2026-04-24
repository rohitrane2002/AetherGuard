"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storeAuthSession } from "../../lib/auth";

/**
 * OAuth callback handler.
 * Receives access_token, refresh_token, email, provider from URL params
 * after the backend OAuth flow redirects here.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const email = params.get("email");
    const provider = params.get("provider");

    if (!accessToken || !refreshToken || !email) {
      setStatus("error");
      setErrorMsg("Missing authentication data. Please try signing in again.");
      return;
    }

    // Store session
    storeAuthSession(accessToken, refreshToken, email);

    // Store provider info
    if (typeof window !== "undefined") {
      if (provider) window.localStorage.setItem("aetherguard_provider", provider);
    }

    // Redirect to dashboard
    setTimeout(() => {
      router.replace("/dashboard");
    }, 600);
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        {status === "processing" ? (
          <>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-[3px] border-cyan-400 border-t-transparent" />
            <h1 className="text-2xl font-semibold text-white">Authenticating...</h1>
            <p className="mt-3 text-sm text-slate-400">
              Setting up your secure workspace. You&apos;ll be redirected in a moment.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white">Authentication Failed</h1>
            <p className="mt-3 text-sm text-slate-400">{errorMsg}</p>
            <button
              onClick={() => router.push("/auth")}
              className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              Return to Sign In
            </button>
          </>
        )}
      </div>
    </main>
  );
}
