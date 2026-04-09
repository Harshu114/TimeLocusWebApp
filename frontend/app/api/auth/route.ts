import { NextRequest, NextResponse } from 'next/server';

// This file proxies POST /api/auth/* → Spring Boot :8080
// Handles: /api/auth/login, /api/auth/register, /api/auth/forgot-password etc.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname; // e.g. /api/auth/login
  const body = await req.text();

  try {
    const res = await fetch(`http://localhost:8080${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Backend offline. Make sure Spring Boot is running on port 8080.' },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const qs = url.search;

  try {
    const res = await fetch(`http://localhost:8080${path}${qs}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Backend offline' },
      { status: 503 }
    );
  }
}
