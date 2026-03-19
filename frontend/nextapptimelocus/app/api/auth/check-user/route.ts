// app/api/auth/check-user/route.ts
// This is only used as a FALLBACK during development without the Spring Boot backend.
// In production, next.config.mjs proxies all /api/* to localhost:8080 automatically.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json({ error: 'identifier required' }, { status: 400 });
  }

  // Forward to Spring Boot
  try {
    const res = await fetch(
      `http://localhost:8080/api/auth/check-user?identifier=${encodeURIComponent(identifier)}`
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Dev fallback: mock response so UI doesn't break when backend is offline
    return NextResponse.json({ exists: false, firstName: null });
  }
}
