import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi } from '../lib/site';
import { track } from '../lib/api';
import Select from './Select';
import type { Entry } from '../lib/types';

const TYPES = ['general', 'product', 'quote', 'project', 'showroom', 'architect', 'other'] as const;
const PROJECTS = ['kitchen', 'bathroom', 'flooring', 'walls', 'stairs', 'commercial', 'outdoor', 'otherp'] as const;

export default function EnquiryForm({ productId, defaultType, onDone }: { productId?: number; defaultType?: string; onDone?: () => void }) {
  const { t, lp, tr, lang } = useLang();
  const { data: products } = useApi<Entry[]>('/api/entries/product');
  const started = useRef(Date.now());
  const [f, setF] = useState({
    name: '', company: '', email: '', phone: '',
    enquiry_type: defaultType || (productId ? 'product' : 'general'),
    product_id: productId ? String(productId) : '', project_type: '', message: '', consent: false, website: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<{ busy: boolean; error: string; ref: string }>({ busy: false, error: '', ref: '' });
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }));
  const productOptions = useMemo(() => [{ value: '', label: t('select') }, ...(products || []).map((p) => ({ value: String(p.id), label: tr(p, 'name') }))], [products, tr, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !f.message.trim() || !f.consent) {
      setState((s) => ({ ...s, error: t('required') }));
      return;
    }
    setState({ busy: true, error: '', ref: '' });
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append('lang', lang);
    fd.append('started', String(started.current));
    fd.append('source', productId ? 'product' : 'form');
    if (file) fd.append('file', file);
    try {
      const res = await fetch('/api/enquiries', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      track(f.enquiry_type === 'quote' ? 'quote_request' : 'enquiry_submit', f.product_id);
      setState({ busy: false, error: '', ref: data.ref });
    } catch (err: any) {
      setState({ busy: false, error: err.message, ref: '' });
    }
  };

  if (state.ref) {
    return (
      <div className="py-10">
        <div className="eyebrow">{t('reference')} · {state.ref}</div>
        <h3 className="h-md mt-5">{t('thanksTitle')}</h3>
        <p className="lead mt-5 max-w-md">{t('thanksBody')}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button className="btn btn-line" onClick={() => { started.current = Date.now(); setF((s) => ({ ...s, message: '' })); setFile(null); setState({ busy: false, error: '', ref: '' }); }}><span>{t('sendAnother')}</span></button>
          {onDone && <button className="btn btn-dark" onClick={onDone}><span>{t('close')}</span></button>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <input type="text" name="website" value={f.website} onChange={(e) => set('website')(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <div><label className="label" htmlFor="ef-name">{t('fullName')} *</label><input id="ef-name" className="field" value={f.name} onChange={(e) => set('name')(e.target.value)} autoComplete="name" required /></div>
      <div><label className="label" htmlFor="ef-company">{t('company')} <span className="normal-case tracking-normal text-taupe">({t('optional')})</span></label><input id="ef-company" className="field" value={f.company} onChange={(e) => set('company')(e.target.value)} autoComplete="organization" /></div>
      <div><label className="label" htmlFor="ef-email">{t('email')} *</label><input id="ef-email" type="email" className="field" value={f.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" required /></div>
      <div><label className="label" htmlFor="ef-phone">{t('phone')}</label><input id="ef-phone" type="tel" className="field" value={f.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" /></div>
      <div><label className="label" htmlFor="ef-type">{t('enquiryType')}</label>
        <Select id="ef-type" value={f.enquiry_type} onChange={set('enquiry_type')} options={TYPES.map((x) => ({ value: x, label: t(`t_${x}` as any) }))} /></div>
      <div><label className="label" htmlFor="ef-product">{t('product')}</label>
        <Select id="ef-product" value={f.product_id} onChange={set('product_id')} options={productOptions} placeholder={t('select')} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="ef-project">{t('projectType')}</label>
        <Select id="ef-project" value={f.project_type} onChange={set('project_type')} placeholder={t('select')} options={PROJECTS.map((x) => ({ value: t(`p_${x}` as any), label: t(`p_${x}` as any) }))} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="ef-msg">{t('message')} *</label>
        <textarea id="ef-msg" rows={4} className="field resize-none" value={f.message} onChange={(e) => set('message')(e.target.value)} required /></div>
      <div className="sm:col-span-2">
        <label className="group flex cursor-pointer items-center gap-4 border border-dashed border-charcoal/20 px-5 py-4 transition-colors hover:border-charcoal/50">
          <svg className="h-5 w-5 shrink-0 text-bronze" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M21 12.5l-8.5 8.5a5 5 0 01-7-7L14 5.5a3.5 3.5 0 015 5L10.5 19a2 2 0 01-3-3l8-8" /></svg>
          <span className="text-sm"><span className="block">{file ? file.name : t('attach')}</span><span className="text-xs text-taupe">{t('attachHint')}</span></span>
          <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.dwg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-warm sm:col-span-2">
        <input type="checkbox" checked={f.consent} onChange={(e) => set('consent')(e.target.checked)} className="mt-1 h-4 w-4 accent-charcoal" />
        <span>{t('consent')} <Link to={lp('/privacy')} className="underline underline-offset-2" target="_blank">{t('privacy')}</Link>. *</span>
      </label>
      {state.error && <p className="text-sm text-[#8a3b2a] sm:col-span-2" role="alert">{state.error}</p>}
      <div className="sm:col-span-2">
        <button disabled={state.busy} className="btn btn-dark group w-full justify-center sm:w-auto" data-cursor="enquire">
          <span>{state.busy ? `${t('sending')}…` : t('send')}</span><span className="arrow">→</span>
        </button>
      </div>
    </form>
  );
}
