import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://aetherguard-api.onrender.com";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/ops/provision-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err: any) {
    console.error("[api/checkout] proxy error:", err);
    return NextResponse.json(
      { detail: `Backend unreachable: ${err.message}` },
      { status: 502 }
    );
  }
}
