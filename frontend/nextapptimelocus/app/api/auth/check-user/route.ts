// app/api/auth/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with real DB in production
const users = [
  { email: 'test@example.com', username: 'testuser' },
  { email: 'user@example.com', username: 'user123' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json(
      { error: 'Identifier is required' },
      { status: 400 }
    );
  }

  // Check if user exists by email or username
  const userExists = users.some(
    user => user.email === identifier || user.username === identifier
  );

  return NextResponse.json({ exists: userExists });
}
