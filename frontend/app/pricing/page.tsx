"use client";
import React from "react";
import axios from "axios";

const plans = [
  { name: "Free", price: "$0", desc: "Basic access", price_id: "price_free_mock" },
  { name: "Pro", price: "$49/mo", desc: "Unlimited predictions", price_id: "price_pro_mock" },
  { name: "Enterprise", price: "$99/mo", desc: "Team access", price_id: "price_enterprise_mock" },
];

export default function PricingPage() {
  const handleCheckout = async (price_id: string) => {
    try {
      console.log("Calling backend for:", price_id);

      const { data } = await axios.post(
        "https://aetherguard-api.onrender.com/create-checkout-session", // must match FastAPI exactly
        {
          price_id,
          customer_email: "user@example.com",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Response:", data);
      alert("Checkout created!\nSession ID: " + data.sessionId);
    } catch (err: any) {
      console.error("Error:", err);
      alert("Checkout failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-6">
        {plans.map((p) => (
          <div key={p.name} className="bg-gray-800 p-6 rounded-xl text-center">
            <h2 className="text-2xl font-semibold mb-2">{p.name}</h2>
            <p className="text-indigo-400 mb-2">{p.price}</p>
            <p className="text-gray-400 mb-4">{p.desc}</p>
            <button
              type="button"
              onClick={() => handleCheckout(p.price_id)}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium"
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}