import { NextRequest, NextResponse } from 'next/server';

// This file proxies GET /api/auth/check-user → Spring Boot :8080
// Called by the login page to check if an email is registered.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier') || '';
  try {
    const res = await fetch(
      `http://localhost:8080/api/auth/check-user?identifier=${encodeURIComponent(identifier)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { exists: false, error: 'Backend offline' },
      { status: 503 }
    );
  }
}