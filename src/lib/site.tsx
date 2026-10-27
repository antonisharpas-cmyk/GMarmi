import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import type { SiteData, Entry } from './types';

const SiteCtx = createContext<SiteData | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);
  useEffect(() => { api<SiteData>('/api/site').then(setData).catch(() => setData(null)); }, []);
  return <SiteCtx.Provider value={data}>{children}</SiteCtx.Provider>;
}
export const useSite = () => useContext(SiteCtx);

// simple cached fetch hook
const cache = new Map<string, any>();
export function useApi<T = any>(url: string | null) {
  const [state, setState] = useState<{ data: T | null; error: any; loading: boolean }>(() => ({ data: url ? cache.get(url) ?? null : null, error: null, loading: !!url && !cache.has(url) }));
  useEffect(() => {
    if (!url) return;
    let alive = true;
    if (cache.has(url)) setState({ data: cache.get(url), error: null, loading: false });
    else setState((s) => ({ ...s, loading: true }));
    api<T>(url).then((d) => { cache.set(url, d); if (alive) setState({ data: d, error: null, loading: false }); })
      .catch((e) => alive && setState({ data: null, error: e, loading: false }));
    return () => { alive = false; };
  }, [url]);
  return state;
}

export function productPath(p: Entry, cats: Entry[] | undefined) {
  const c = cats?.find((x) => x.id === p.category_id);
  return `/materials/${c?.slug || 'all'}/${p.slug}`;
}
