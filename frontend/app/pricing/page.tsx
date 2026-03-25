"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BackgroundGrid from "../components/BackgroundGrid";
import { isUnauthorizedError, redirectToAuth } from "../lib/auth";
import { useProtectedRoute } from "../lib/useProtectedRoute";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Starter access for evaluation and demos.",
    price_id: "price_free_mock",
    features: ["5 scans per day", "Dashboard access"],
  },
  {
    name: "Pro",
    price: "$49/mo",
    desc: "Best for solo auditors and active builders.",
    price_id: "price_pro_mock",
    features: ["100 scans per day", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "$99/mo",
    desc: "High-volume usage for teams and platforms.",
    price_id: "price_enterprise_mock",
    features: ["Unlimited scans", "Dedicated support"],
  },
];

type Account = {
  subscription_plan: string;
  subscription_status: string;
};

export default function PricingPage() {
  const { token, ready } = useProtectedRoute();
  const [account, setAccount] = useState<Account | null>(null);
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");

  useEffect(() => {
    const loadAccount = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAccount(data);
      } catch (err) {
        console.error("Account fetch error:", err);
      }
    };

    if (ready && token) {
      loadAccount();
    }
  }, [checkoutState, ready, token]);

  const handleCheckout = async (price_id: string) => {
    try {
      if (!token) {
        alert("Login first from /auth before selecting a plan.");
        return;
      }
      const res = await fetch(
        `${API_BASE_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price_id,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        alert(`Request failed: ${res.status}\n${text}`);
        return;
      }

      const data = await res.json();
      setAccount({
        subscription_plan: data.plan,
        subscription_status: "checkout_created",
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      alert("Checkout created!\nSession ID: " + data.sessionId + "\nRedirecting you to /account next is recommended.");
    } catch (err: any) {
      console.error("Checkout error:", err);
      if (isUnauthorizedError(err)) {
        redirectToAuth(true);
        return;
      }
      alert("Checkout request failed: " + err.message);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-black text-white md:pl-56">
      <Sidebar />
      <Navbar />
      <BackgroundGrid />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pt-20">
        <h1 className="mb-8 text-center text-4xl font-bold">Choose Your Plan</h1>
        {checkoutState === "cancelled" && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Checkout was cancelled. Your current plan is unchanged and you can try again anytime.
          </div>
        )}
        {account && (
          <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
            Active plan: <span className="font-semibold">{account.subscription_plan}</span>
            {" · "}
            Status: <span className="font-semibold">{account.subscription_status}</span>
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border-2 bg-gray-800 p-6 text-center transition-all hover:border-indigo-500 ${
                account?.subscription_plan === plan.name.toLowerCase()
                  ? "border-cyan-400"
                  : "border-gray-700"
              }`}
            >
              <h2 className="mb-2 text-2xl font-semibold">{plan.name}</h2>
              <p className="mb-4 text-xl text-indigo-400">{plan.price}</p>
              <p className="mb-6 text-gray-400">{plan.desc}</p>
              <ul className="mb-6 space-y-2 text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout(plan.price_id)}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Stripe test mode activates automatically when backend Stripe keys are configured.
        </p>
      </div>
    </main>
  );
}
