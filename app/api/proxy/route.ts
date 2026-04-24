import { NextRequest, NextResponse } from "next/server";

/**
 * Stable API Proxy Bridge
 * 
 * Replaces client-side rewrites which are unstable in some Vercel environments.
 * This route acts as a server-to-server bridge between Vercel and Render.
 */
export async function POST(request: NextRequest) {
  const backendUrl = "https://aetherguard-api.onrender.com/ops/provision-subscription";
  
  try {
    const body = await request.json();
    const token = request.headers.get("Authorization");

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy Bridge Error:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to communicate with backend gateway" },
      { status: 500 }
    );
  }
}
