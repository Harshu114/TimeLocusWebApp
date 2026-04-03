import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/forgot-password → Spring Boot /auth/forgot-password
export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const res = await fetch('http://localhost:8080/api/auth/forgot-password', {
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
