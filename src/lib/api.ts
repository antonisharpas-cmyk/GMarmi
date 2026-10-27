export async function api<T = any>(url: string, opts: RequestInit & { json?: any } = {}): Promise<T> {
  const init: RequestInit = { credentials: 'same-origin', ...opts };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
    init.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (!init.method) init.method = 'POST';
  }
  const res = await fetch(url, init);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw Object.assign(new Error((data as any)?.error || res.statusText), { status: res.status });
  return data as T;
}

export function track(name: string, ref = '') {
  try {
    const body = JSON.stringify({ name, path: location.pathname, ref });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  } catch {
    /* ignore */
  }
}
