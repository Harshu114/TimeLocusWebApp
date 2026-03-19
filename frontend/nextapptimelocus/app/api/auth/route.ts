// app/api/auth/route.ts
// Proxy fallback to Spring Boot. The real routing is handled by next.config.mjs rewrites.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url  = new URL(request.url);
    // Forward to the correct backend endpoint based on action
    const action   = body.action || url.pathname.split('/').pop();
    const endpoint = action === 'login'    ? 'login'
                   : action === 'register' ? 'register'
                   : action === 'signup'   ? 'register'
                   : action;

    const res = await fetch(`http://localhost:8080/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 503 });
  }
}