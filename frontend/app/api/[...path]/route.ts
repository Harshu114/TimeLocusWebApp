import { NextRequest, NextResponse } from 'next/server';

async function proxy(req: NextRequest, path: string) {
  const url = new URL(req.url);
  const backendPath = path.startsWith('api/') ? path : `api/${path}`;
  const backendUrl = `http://localhost:8080/${backendPath}${url.search}`;

  const method = req.method;
  // Forward only headers that are safe/needed for backend auth + content negotiation.
  // Passing all incoming headers can break Node fetch (forbidden hop-by-hop headers),
  // which was causing 503s for writes like /api/tasks and /api/planner.
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  const contentType = req.headers.get('content-type');
  const accept = req.headers.get('accept');
  if (auth) headers.authorization = auth;
  if (contentType) headers['content-type'] = contentType;
  if (accept) headers.accept = accept;

  // Content-Type is set automatically by fetch if body is undefined.
  const body = method === 'GET' || method === 'HEAD' ? null : await req.text();

  try {
    const res = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await res.arrayBuffer();
    const response = new NextResponse(data, { status: res.status });
    res.headers.forEach((value, key) => {
      if (['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        return;
      }
      response.headers.set(key, value);
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Backend offline. Make sure Spring Boot is running on port 8080.' },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}
