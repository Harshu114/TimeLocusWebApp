// app/api/auth/me/route.ts
// Thin alias so the dashboard's fetch('/api/auth/me') works cleanly.
// This just calls the GET handler of /api/auth internally.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Reuse the same in-memory store (import separately to keep DRY)
// In a real app this would be a shared DB query.
const users: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}[] = [
  {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@timelocus.app',
  },
];

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('tl_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const user = users.find((u) => u.id === sessionId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}