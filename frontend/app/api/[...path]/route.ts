import { NextRequest, NextResponse } from 'next/server';

async function proxy(req: NextRequest, path: string) {
  const url = new URL(req.url);
  const backendUrl = `http://localhost:8080/api/${path}${url.search}`;

  const method = req.method;
  const headers = { ...Object.fromEntries(req.headers.entries()) };
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
  } catch (err) {
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
