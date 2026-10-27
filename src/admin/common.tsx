import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

export type Me = { id: number; email: string; name: string; role: string; perms: string[] };
export const MeCtx = createContext<{ me: Me | null; setMe: (m: Me | null) => void }>({ me: null, setMe: () => {} });
export const useMe = () => useContext(MeCtx);

export function useLoad<T = any>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    if (!url) return;
    api<T>(url).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, [url]);
  useEffect(() => { reload(); }, [reload, ...deps]);
  return { data, setData, error, reload };
}

// Toasts
type Toast = { id: number; text: string; kind: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] space-y-2">
        {list.map((t) => <div key={t.id} className={`page-in px-5 py-3 text-sm shadow-lg ${t.kind === 'ok' ? 'bg-charcoal text-ivory' : 'bg-[#8a3b2a] text-white'}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

export const Btn = ({ kind = 'dark', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'dark' | 'line' | 'ghost' | 'danger' }) => (
  <button {...p} className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide2 transition-colors disabled:opacity-40 ${
    kind === 'dark' ? 'bg-charcoal text-ivory hover:bg-brown' : kind === 'line' ? 'border border-charcoal/20 hover:border-charcoal' : kind === 'danger' ? 'border border-[#8a3b2a]/30 text-[#8a3b2a] hover:bg-[#8a3b2a] hover:text-white' : 'text-warm hover:text-charcoal'} ${className}`} />
);

export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`w-full border border-charcoal/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal ${p.className || ''}`} />;
export const Area = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`w-full border border-charcoal/15 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-charcoal ${p.className || ''}`} />;
export const Sel = ({ options, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[] }) => (
  <select {...p} className={`w-full border border-charcoal/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-charcoal ${p.className || ''}`}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
export const Field = ({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <div className={`block ${className}`}>
    {label && <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide2 text-warm">{label}</span>}
    {children}
    {hint && <span className="mt-1 block text-xs text-taupe">{hint}</span>}
  </div>
);
export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm">
    <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-charcoal' : 'bg-sand'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} /></span>
    {label}
  </button>
);
export const Card = ({ children, className = '', title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) => (
  <div className={`border border-charcoal/10 bg-white p-6 ${className}`}>
    {(title || action) && <div className="mb-5 flex items-center justify-between"><h3 className="text-[11px] font-medium uppercase tracking-wide2 text-warm">{title}</h3>{action}</div>}
    {children}
  </div>
);
export const PageHead = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-4xl font-light">{title}</h1><div className="flex flex-wrap gap-2">{children}</div></div>
);
export const Badge = ({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) => {
  const c: Record<string, string> = { neutral: 'bg-stone text-charcoal', new: 'bg-[#2d4a6b] text-white', contacted: 'bg-[#5a6b7d] text-white', in_progress: 'bg-[#9A7A55] text-white', quoted: 'bg-[#6b5a2d] text-white', won: 'bg-[#3d6b4a] text-white', lost: 'bg-[#8a3b2a] text-white', closed: 'bg-warm text-white', active: 'bg-[#3d6b4a] text-white', waiting: 'bg-[#9A7A55] text-white', warn: 'bg-[#f4e6c8] text-[#6b4d16]' };
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${c[tone] || c.neutral}`}>{children}</span>;
};
export const fmtDate = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'won', 'lost', 'closed'];
export const ENQ_TYPES: Record<string, string> = { general: 'General', product: 'Product info', quote: 'Quote', project: 'Project', showroom: 'Showroom visit', architect: 'Architect / designer', other: 'Other' };
