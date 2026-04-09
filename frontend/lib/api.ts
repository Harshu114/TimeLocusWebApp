export async function api(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('tl_token');
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('tl_token');
    localStorage.removeItem('tl_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let details = '';
    try { details = await res.text(); } catch {}
    throw new Error(`API ${res.status} ${path}${details ? `: ${details}` : ''}`);
  }
  return res;
}
