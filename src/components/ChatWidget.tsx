import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useSite } from '../lib/site';
import { api, track } from '../lib/api';

type Msg = { id: number; sender: string; body: string; created_at: string };
const KEY = 'gm_chat_token';
const get = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
const put = (v: string) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* */ } };

export default function ChatWidget() {
  const { t, lang } = useLang();
  const s = useSite();
  const { pathname } = useLocation();
  const online = s?.site.chat_online !== false;
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(get);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!token || !open) return;
    let alive = true;
    const poll = async () => {
      try {
        const r = await api<{ messages: Msg[] }>(`/api/chat/${token}?after=${last.current}`);
        if (alive && r.messages.length) {
          last.current = r.messages[r.messages.length - 1].id;
          setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
        }
      } catch (e: any) { if (e.status === 404) { put(''); setToken(''); } }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(id); };
  }, [token, open]);
  useEffect(() => { box.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [msgs]);
  if (pathname.startsWith('/admin')) return null;

  const start = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      const r = await api<any>('/api/chat/start', { json: { ...form, page: pathname, lang } });
      track('chat_start');
      if (r.offline) { setDone(true); return; }
      put(r.token); last.current = 0; setMsgs([]); setToken(r.token);
    } catch (e: any) { setErr(e.message); }
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim(); if (!body) return;
    setText('');
    const m = await api<Msg>(`/api/chat/${token}`, { json: { body } });
    last.current = Math.max(last.current, m.id);
    setMsgs((x) => [...x, m]);
  };

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label={t('chatTitle')} data-cursor="link"
        className="fixed bottom-5 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-ivory shadow-[0_12px_40px_rgba(18,17,16,.3)] transition-transform duration-500 hover:scale-105 sm:bottom-8 sm:right-8">
        {open ? <span className="text-lg">✕</span> : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 5h16v11H9l-5 4z" /></svg>
        )}
      </button>
      <div className={`fixed bottom-24 right-3 z-[55] flex w-[calc(100vw-24px)] max-w-[380px] flex-col overflow-hidden bg-marble shadow-[0_30px_80px_rgba(18,17,16,.25)] transition-all duration-500 ease-lux sm:bottom-28 sm:right-8 ${open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'}`}
        style={{ height: token ? 520 : 'auto', maxHeight: 'calc(100vh - 140px)' }} data-lenis-prevent>
        <div className="bg-charcoal px-6 py-5 text-ivory">
          <div className="font-display text-2xl">{online ? t('chatTitle') : t('chatOffline')}</div>
          <p className="mt-1 text-xs text-ivory/60">{online ? t('chatIntro') : t('chatOfflineIntro')}</p>
        </div>
        {done ? (
          <p className="p-6 text-sm text-warm">{t('chatSent')}</p>
        ) : !token ? (
          <form onSubmit={start} className="space-y-4 overflow-y-auto p-6">
            <input type="text" className="hidden" tabIndex={-1} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden />
            <input className="field" placeholder={`${t('yourName')} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" type="email" placeholder={`${t('email')}${online ? '' : ' *'}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" type="tel" placeholder={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <textarea className="field resize-none" rows={3} placeholder={`${t('message')} *`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {err && <p className="text-xs text-[#8a3b2a]">{err}</p>}
            <button className="btn btn-dark w-full justify-center"><span>{online ? t('chatStart') : t('send2')}</span></button>
          </form>
        ) : (
          <>
            <div ref={box} className="flex-1 space-y-3 overflow-y-auto p-5">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed ${m.sender === 'visitor' ? 'bg-charcoal text-ivory' : 'bg-stone text-charcoal'}`}>{m.body}</div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex items-center gap-2 border-t border-charcoal/10 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chatPlaceholder')} className="flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
              <button className="px-3 text-[11px] font-medium uppercase tracking-wide2">{t('send2')}</button>
            </form>
            <button onClick={() => { put(''); setToken(''); setMsgs([]); }} className="pb-3 text-[10px] uppercase tracking-wide2 text-taupe hover:text-charcoal">{t('newChat')}</button>
          </>
        )}
      </div>
    </>
  );
}
