import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://aetherguard-api.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";

    const backendResponse = await fetch(`${BACKEND_URL}/account`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err: any) {
    console.error("[api/account] proxy error:", err);
    return NextResponse.json(
      { detail: `Backend unreachable: ${err.message}` },
      { status: 502 }
    );
  }
}
