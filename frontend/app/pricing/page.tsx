"use client";
import React from "react";

// --------------------------------------------------
// AetherGuard Pricing Page - Final working version
// --------------------------------------------------

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Basic access. Limited usage.",
    price_id: "price_free_mock",
    features: ["Limited Predictions", "Community Support"],
  },
  {
    name: "Pro",
    price: "$49/mo",
    desc: "For professionals.",
    price_id: "price_pro_mock",
    features: ["Unlimited Predictions", "Priority Support"],
  },
  {
    name: "Enterprise",
    price: "$99/mo",
    desc: "For organizations and teams.",
    price_id: "price_enterprise_mock",
    features: ["Team Access", "Dedicated Support"],
  },
];

// --------------------------------------------------

export default function PricingPage() {
  // This version uses fetch() instead of axios
  // It matches your backend /create-checkout-session exactly
  const handleCheckout = async (price_id: string) => {
    try {
      console.log("Calling backend for plan:", price_id);

      const res = await fetch(
        "https://aetherguard-api.onrender.com/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price_id,
            customer_email: "user@example.com",
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend returned ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("Response from backend:", data);

      alert("Checkout created!\nSession ID: " + data.sessionId);
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Unknown error");
    }
  };

  // --------------------------------------------------

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Choose Your Plan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-gray-800 rounded-xl p-6 text-center border-2 border-gray-700 hover:border-indigo-500 transition-all"
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-indigo-400 text-xl mb-4">{plan.price}</p>
            <p className="text-gray-400 mb-6">{plan.desc}</p>
            <ul className="text-gray-300 mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleCheckout(plan.price_id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition"
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      <p className="text-gray-500 mt-8 text-sm">
        Mock checkout for demo purposes only — no real payments.
      </p>
    </div>
  );
}