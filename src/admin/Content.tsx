import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Img } from '../lib/types';
import { Area, Btn, Card, Field, Input, PageHead, Sel, Toggle, useLoad, useToast } from './common';
import { ImageManager, SingleImage } from './Media';

type S = { k: string; label: string; t: 'text' | 'area' | 'img' | 'imgs' | 'lines' | 'bool' | 'rel' | 'multi' | 'why' | 'sections' | 'links'; bi?: boolean; rel?: string; hint?: string; rows?: number };

type G = { title: string; fields: S[]; section?: string; note?: { text: string; to: string; label: string } };
const TABS: Record<string, { title: string; key: string; groups: G[] }> = {
  home: { title: 'Homepage', key: 'home', groups: [
    { title: 'Sections (drag to reorder, toggle to hide)', fields: [{ k: 'sections', label: '', t: 'sections' }] },
    { section: 'hero', title: 'Hero', fields: [{ k: 'hero_image', label: 'Hero image', t: 'img' }, { k: 'hero_kicker', label: 'Small line above title', t: 'text', bi: true }, { k: 'hero_title', label: 'Title', t: 'text', bi: true }, { k: 'hero_sub', label: 'Subtitle', t: 'area', bi: true }, { k: 'cta_primary', label: 'Primary button', t: 'text', bi: true }, { k: 'cta_secondary', label: 'Secondary button', t: 'text', bi: true }] },
    { section: 'intro', title: 'Stone. Surface. Space.', fields: [{ k: 'intro_words', label: 'Three words (one per line)', t: 'lines', bi: true }, { k: 'intro_images', label: 'Three images, in order', t: 'imgs' }] },
    { section: 'materials', title: 'Materials (horizontal)', fields: [], note: { text: 'Shows the published material categories, in the order set under Categories.', to: '/admin/content/category', label: 'Edit categories' } },
    { section: 'story', title: 'Material story', fields: [{ k: 'story_image', label: 'Image', t: 'img' }, { k: 'story_lines', label: 'Lines (first is small, last is the link)', t: 'lines', bi: true }] },
    { section: 'collection', title: 'Featured collection', fields: [{ k: 'featured_collection', label: 'Featured collection', t: 'rel', rel: 'collection' }] },
    { section: 'applications', title: 'Applications', fields: [], note: { text: 'Shows the first six published applications, in the order set under Applications.', to: '/admin/content/application', label: 'Edit applications' } },
    { section: 'showcase', title: 'Featured materials', fields: [{ k: 'featured_products', label: 'Featured materials (in this order)', t: 'multi', rel: 'product' }] },
    { section: 'projects', title: 'Projects', fields: [], note: { text: 'Shows the first four published projects. The section stays hidden on the website until a project is added.', to: '/admin/content/project', label: 'Edit projects' } },
    { section: 'why', title: 'Why GM Andreou Marmi', fields: [{ k: 'why', label: '', t: 'why' }] },
    { section: 'cta', title: 'Final call to action', fields: [{ k: 'cta_title', label: 'Title', t: 'text', bi: true }, { k: 'cta_button', label: 'Button', t: 'text', bi: true }, { k: 'cta_image', label: 'Background image', t: 'img' }] },
  ] },
  site: { title: 'Contact, social and footer', key: 'site', groups: [
    { title: 'Contact', fields: [{ k: 'phone', label: 'Phone (display)', t: 'text' }, { k: 'phone_raw', label: 'Phone (for dialling, no spaces)', t: 'text' }, { k: 'email', label: 'Email', t: 'text' }, { k: 'address', label: 'Address', t: 'text', bi: true }, { k: 'hours', label: 'Opening hours', t: 'area', bi: true, hint: 'Hidden on the website while empty' }, { k: 'map_query', label: 'Google Maps search text', t: 'text' }, { k: 'contact_image', label: 'Contact page background image', t: 'img' }] },
    { title: 'Social', fields: [{ k: 'instagram', label: 'Instagram URL', t: 'text' }, { k: 'facebook', label: 'Facebook URL', t: 'text' }, { k: 'linkedin', label: 'LinkedIn URL', t: 'text' }, { k: 'whatsapp', label: 'WhatsApp number (future use)', t: 'text' }] },
    { title: 'Our Group (menu)', fields: [{ k: 'group_companies', label: 'Companies shown under "Our Group" in the menu. Leave the website empty if a company has none.', t: 'links' }] },
    { title: 'Live chat', fields: [{ k: 'chat_online', label: 'Team online for live chat (off = "Leave us a message", saved as an enquiry)', t: 'bool' }] },
    { title: 'Footer', fields: [{ k: 'company', label: 'Company name', t: 'text' }, { k: 'footer', label: 'Footer line', t: 'text', bi: true }] },
  ] },
  about: { title: 'About page', key: 'about', groups: [
    { title: 'About', fields: [{ k: 'image', label: 'Hero image', t: 'img' }, { k: 'image_2', label: 'Second image', t: 'img' }, { k: 'title', label: 'Title', t: 'text', bi: true }, { k: 'intro', label: 'Introduction', t: 'area', bi: true }, { k: 'since', label: 'Founded (year)', t: 'text' }, { k: 'body', label: 'Story (blank line between paragraphs)', t: 'area', bi: true, rows: 12 }] },
    { title: 'Founder', fields: [{ k: 'founder_name', label: 'Name', t: 'text', bi: true }, { k: 'founder_role', label: 'Role', t: 'text', bi: true }, { k: 'founder_quote', label: 'Quote', t: 'area', bi: true }, { k: 'founder_bio', label: 'About the founder', t: 'area', bi: true, rows: 6 }, { k: 'founder_image', label: 'Photo (optional)', t: 'img' }] },
  ] },
  legal: { title: 'Legal pages', key: 'legal', groups: [
    { title: 'Privacy Policy', fields: [{ k: 'privacy', label: 'Text', t: 'area', bi: true, rows: 14 }] },
    { title: 'Cookie Policy', fields: [{ k: 'cookies', label: 'Text', t: 'area', bi: true, rows: 8 }] },
    { title: 'Terms & Conditions', fields: [{ k: 'terms', label: 'Text', t: 'area', bi: true, rows: 10 }] },
  ] },
};
const SECTION_NAMES: Record<string, string> = { hero: 'Hero', intro: 'Stone. Surface. Space.', materials: 'Materials (horizontal)', story: 'Material story', collection: 'Featured collection', applications: 'Applications', showcase: 'Featured materials', projects: 'Projects (when added)', why: 'Why GM Andreou Marmi', cta: 'Final call to action' };

export default function Content() {
  const { tab = 'home' } = useParams();
  const cfg = TABS[tab];
  const { data } = useLoad<any>(`/api/admin/settings/${cfg.key}`, [tab]);
  const { data: media } = useLoad<any[]>('/api/admin/media');
  const { data: opts } = useLoad<any[]>('/api/admin/options');
  const [v, setV] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'el'>('en');
  const [drag, setDrag] = useState<number | null>(null);
  const toast = useToast();
  useEffect(() => { if (data) setV(data); }, [data]);
  if (!v) return <div className="p-10 text-taupe">Loading…</div>;
  const img = (id: number | null): Img | null => (media || []).find((m) => m.id === id) || null;
  const put = (k: string, val: any) => setV((x: any) => ({ ...x, [k]: val }));
  const save = async () => { await api(`/api/admin/settings/${cfg.key}`, { method: 'PUT', json: v }); toast('Saved. Changes are live.'); };

  const render = (f: S) => {
    const key = f.bi ? `${f.k}_${lang}` : f.k;
    const val = v[key];
    switch (f.t) {
      case 'text': return <Input value={val || ''} onChange={(e) => put(key, e.target.value)} />;
      case 'area': return <Area rows={f.rows || 4} value={val || ''} onChange={(e) => put(key, e.target.value)} />;
      case 'lines': return <Area rows={4} value={(val || []).join('\n')} onChange={(e) => put(key, e.target.value.split('\n'))} />;
      case 'bool': return <Toggle checked={val !== false} onChange={(b) => put(key, b)} label={val !== false ? 'Yes' : 'No'} />;
      case 'img': return <SingleImage value={img(val)} onChange={(i) => put(key, i?.id ?? null)} />;
      case 'imgs': return <ImageManager images={(val || []).map(img).filter(Boolean)} cover={null} onChange={(imgs) => put(key, imgs.map((i) => i.id))} />;
      case 'rel': return <Sel value={val ?? ''} onChange={(e) => put(key, e.target.value ? Number(e.target.value) : null)} options={[{ value: '', label: 'None' }, ...(opts || []).filter((o) => o.type === f.rel).map((o) => ({ value: o.id, label: o.name }))]} />;
      case 'multi': {
        const arr: number[] = val || [];
        const all = (opts || []).filter((o) => o.type === f.rel);
        return (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">{arr.map((id, i) => <span key={id} className="inline-flex items-center gap-2 bg-charcoal px-3 py-1.5 text-xs text-ivory">{i + 1}. {all.find((o) => o.id === id)?.name}
              <button onClick={() => put(key, arr.filter((x) => x !== id))}>✕</button></span>)}</div>
            <Sel value="" onChange={(e) => e.target.value && put(key, [...arr, Number(e.target.value)])} options={[{ value: '', label: '＋ Add' }, ...all.filter((o) => !arr.includes(o.id)).map((o) => ({ value: o.id, label: o.name }))]} />
          </div>
        );
      }
      case 'links': {
        const arr: { name: string; url: string }[] = val || [];
        const set2 = (i: number, k: string, x: string) => put(key, arr.map((r, j) => (j === i ? { ...r, [k]: x } : r)));
        return (
          <div className="space-y-2">
            {arr.map((r, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input placeholder="Company name" value={r.name || ''} onChange={(e) => set2(i, 'name', e.target.value)} />
                <Input placeholder="Website (optional), e.g. https://www.example.com" value={r.url || ''} onChange={(e) => set2(i, 'url', e.target.value)} />
                <Btn kind="ghost" onClick={() => put(key, arr.filter((_, j) => j !== i))}>✕</Btn>
              </div>
            ))}
            <Btn kind="line" onClick={() => put(key, [...arr, { name: '', url: '' }])}>＋ Add company</Btn>
          </div>
        );
      }
      case 'why': {
        const arr: any[] = val || [];
        return (
          <div className="space-y-4">
            {arr.map((w, i) => (
              <div key={i} className="grid gap-2 border border-charcoal/10 p-3 sm:grid-cols-[1fr_2fr_auto]">
                <Input placeholder="Title" value={w[`t_${lang}`] || ''} onChange={(e) => put(key, arr.map((x, j) => (j === i ? { ...x, [`t_${lang}`]: e.target.value } : x)))} />
                <Input placeholder="Text" value={w[`d_${lang}`] || ''} onChange={(e) => put(key, arr.map((x, j) => (j === i ? { ...x, [`d_${lang}`]: e.target.value } : x)))} />
                <Btn kind="ghost" onClick={() => put(key, arr.filter((_, j) => j !== i))}>✕</Btn>
              </div>
            ))}
            <Btn kind="line" onClick={() => put(key, [...arr, {}])}>＋ Add point</Btn>
          </div>
        );
      }
      case 'sections': {
        const arr: any[] = val || [];
        return (
          <div className="space-y-1">
            {arr.map((s, i) => (
              <div key={s.key} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (drag === null) return; const n = [...arr]; const [x] = n.splice(drag, 1); n.splice(i, 0, x); setDrag(null); put(key, n); }}
                className="flex cursor-grab items-center justify-between border border-charcoal/10 bg-ivory px-4 py-2.5">
                <span className="text-sm"><span className="mr-3 text-taupe">⋮⋮</span>{SECTION_NAMES[s.key] || s.key}</span>
                <Toggle checked={s.visible} onChange={(b) => put(key, arr.map((x, j) => (j === i ? { ...x, visible: b } : x)))} />
              </div>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <>
      <PageHead title="Website content">
        <div className="flex border border-charcoal/15">
          {(['en', 'el'] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wide2 ${lang === l ? 'bg-charcoal text-ivory' : ''}`}>{l === 'en' ? 'English' : 'Ελληνικά'}</button>)}
        </div>
        <Btn onClick={save}>Save</Btn>
      </PageHead>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-charcoal/10">
        {Object.entries(TABS).map(([k, t]) => <Link key={k} to={`/admin/website/${k}`} className={`-mb-px border-b-2 px-4 py-3 text-[11px] uppercase tracking-wide2 ${tab === k ? 'border-charcoal' : 'border-transparent text-warm'}`}>{t.title}</Link>)}
      </div>
      <div className="space-y-6">
        {(() => {
          // homepage groups follow the same order as the sections on the website (and update when you drag them)
          const order: any[] = tab === 'home' ? v.sections || [] : [];
          const pos = (g: G) => (g.section ? order.findIndex((x) => x.key === g.section) : -1);
          return [...cfg.groups].sort((a, b) => (a.section && b.section ? pos(a) - pos(b) : 0));
        })().map((g) => {
          const sec = tab === 'home' && g.section ? (v.sections || []).find((x: any) => x.key === g.section) : null;
          const num = sec ? (v.sections || []).indexOf(sec) + 1 : 0;
          return (
          <Card key={g.title} title={num ? `${String(num).padStart(2, '0')} · ${g.title}` : g.title} className={sec && !sec.visible ? 'opacity-60' : ''}
            action={sec && !sec.visible ? <span className="text-[10px] uppercase tracking-wide2 text-taupe">Hidden on website</span> : undefined}>
            {g.note && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-warm"><span>{g.note.text}</span><Link to={g.note.to} className="text-[11px] uppercase tracking-wide2 text-charcoal underline underline-offset-4">{g.note.label} →</Link></div>}
            <div className="grid gap-5 md:grid-cols-2">
              {g.fields.map((f) => <Field key={f.k} label={f.label ? `${f.label}${f.bi ? ` (${lang.toUpperCase()})` : ''}` : ''} hint={f.hint} className={['area', 'imgs', 'why', 'sections', 'multi', 'links'].includes(f.t) ? 'md:col-span-2' : ''}>{render(f)}</Field>)}
            </div>
          </Card>
          );
        })}
      </div>
    </>
  );
}
