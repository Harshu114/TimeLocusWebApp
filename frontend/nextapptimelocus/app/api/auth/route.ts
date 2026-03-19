// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─────────────────────────────────────────────
// Mock in-memory user store (replace with a real DB)
// In production: use Prisma / Supabase / Drizzle etc.
// ─────────────────────────────────────────────
const users: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // In production: store hashed (bcrypt)
}[] = [
  {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@timelocus.app',
    password: 'password123',
  },
];

function findUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Very minimal session: store user id in a cookie
// In production: use next-auth / jose signed JWT / iron-session
function createSession(userId: string) {
  const cookieStore = cookies();
  cookieStore.set('tl_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // ── LOGIN ──────────────────────────────────
    if (action === 'login') {
      const { email, password } = data as { email: string; password: string };

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required.' },
          { status: 400 }
        );
      }

      const user = findUserByEmail(email);

      if (!user || user.password !== password) {
        // Generic message to avoid user enumeration
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      createSession(user.id);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    }

    // ── SIGNUP ─────────────────────────────────
    if (action === 'signup') {
      const { firstName, lastName, email, password } = data as {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
      };

      if (!firstName || !lastName || !email || !password) {
        return NextResponse.json(
          { error: 'All fields are required.' },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters.' },
          { status: 400 }
        );
      }

      if (findUserByEmail(email)) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }

      const newUser = {
        id: String(Date.now()),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password, // hash in production!
      };

      users.push(newUser);
      createSession(newUser.id);

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
        },
      });
    }

    // ── LOGOUT ─────────────────────────────────
    if (action === 'logout') {
      const cookieStore = cookies();
      cookieStore.delete('tl_session');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('[auth] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ── GET /api/auth  →  returns current session user ──
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

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (error) {
    console.error('[auth] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}