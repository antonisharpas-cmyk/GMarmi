import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Img } from '../lib/types';
import { Area, Badge, Btn, Card, Field, Input, PageHead, Sel, Toggle, useLoad, useToast } from './common';
import { ImageManager } from './Media';

type F = { k: string; label: string; type: 'text' | 'area' | 'rel' | 'multi' | 'bool' | 'lines' | 'kv' | 'choice' | 'formats'; rel?: string; choices?: string[]; bi?: boolean; hint?: string; wide?: boolean };

export const TYPES: Record<string, { label: string; plural: string; publicPath?: (e: any, opts: any[]) => string; images: boolean; fields: F[] }> = {
  product: {
    label: 'Product', plural: 'Products', images: true,
    publicPath: (e, o) => `/materials/${o.find((x) => x.id === e.data.category_id)?.slug || 'all'}/${e.slug}`,
    fields: [
      { k: 'name', label: 'Name', type: 'text', bi: true },
      { k: 'tagline', label: 'Tagline', type: 'text', bi: true, wide: true },
      { k: 'desc', label: 'Description', type: 'area', bi: true, wide: true },
      { k: 'category_id', label: 'Category', type: 'rel', rel: 'category' },
      { k: 'brand_id', label: 'Brand', type: 'rel', rel: 'brand' },
      { k: 'exclusive', label: 'Exclusive to GM Andreou Marmi', type: 'bool' },
      { k: 'application_ids', label: 'Applications', type: 'multi', rel: 'application', wide: true },
      { k: 'features', label: 'Highlights (one per line)', type: 'lines', bi: true, wide: true },
      { k: 'specs.material', label: 'Material', type: 'text', bi: true },
      { k: 'specs.finish', label: 'Finish', type: 'text', bi: true },
      { k: 'specs.colour', label: 'Colour', type: 'text', bi: true, hint: 'Used for the colour filter' },
      { k: 'specs.thickness', label: 'Thickness', type: 'text', hint: 'Only confirmed values, e.g. 12 mm' },
      { k: 'specs.dimensions', label: 'Slab dimensions', type: 'text', hint: 'Only confirmed values' },
      { k: 'specs_extra', label: 'Additional specifications', type: 'kv', wide: true },
    ],
  },
  category: { label: 'Category', plural: 'Categories', images: true, publicPath: (e) => `/materials/${e.slug}`,
    fields: [{ k: 'name', label: 'Name', type: 'text', bi: true }, { k: 'kind', label: 'Material type (small line above the name, e.g. Porcelain)', type: 'text', bi: true }, { k: 'desc', label: 'Description', type: 'area', bi: true, wide: true },
      { k: 'formats', label: 'Sizes (shown on the category page with a drawing of each slab)', type: 'formats', wide: true },
      { k: 'custom_sizes', label: 'Cut to any size (shows "Cut to any size" when no sizes are listed)', type: 'bool', wide: true }] },
  application: { label: 'Application', plural: 'Applications', images: true, publicPath: (e) => `/applications/${e.slug}`,
    fields: [{ k: 'name', label: 'Name', type: 'text', bi: true }, { k: 'desc', label: 'Description', type: 'area', bi: true, wide: true },
      { k: 'body', label: 'Extra text', type: 'area', bi: true, wide: true }, { k: 'category_ids', label: 'Material categories for this application', type: 'multi', rel: 'category', wide: true },
      { k: 'product_ids', label: 'Materials', type: 'multi', rel: 'product', wide: true }] },
  brand: { label: 'Brand', plural: 'Brands', images: true, fields: [{ k: 'name', label: 'Name', type: 'text', bi: true }, { k: 'desc', label: 'Description', type: 'area', bi: true, wide: true }] },
  faq: { label: 'FAQ', plural: 'FAQs', images: false,
    fields: [{ k: 'category', label: 'Category', type: 'choice', choices: ['materials', 'products', 'orders', 'showroom', 'general'] },
      { k: 'q', label: 'Question', type: 'text', bi: true, wide: true }, { k: 'a', label: 'Answer', type: 'area', bi: true, wide: true }] },
};

const get = (o: any, path: string) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o: any, path: string, v: any) => {
  const ks = path.split('.'); const out = { ...o }; let cur = out;
  ks.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[ks[ks.length - 1]] = v; return out;
};
const titleOf = (e: any) => e.name_en || e.q_en || e.slug;

export function EntityList() {
  const { type = 'product' } = useParams();
  const cfg = TYPES[type];
  const { data, setData, reload } = useLoad<any[]>(`/api/admin/entries/${type}`, [type]);
  const { data: opts } = useLoad<any[]>('/api/admin/options');
  const [drag, setDrag] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const toast = useToast();
  const nav = useNavigate();
  if (!cfg) return null;
  const list = (data || []).filter((e) => !q || JSON.stringify([e.name_en, e.name_el, e.q_en, e.slug]).toLowerCase().includes(q.toLowerCase()));
  const saveOrder = async (n: any[]) => { setData(n); await api(`/api/admin/entries/${type}/reorder`, { json: { ids: n.map((x) => x.id) } }); toast('Order saved'); };
  const patch = async (e: any, body: any) => { await api(`/api/admin/entries/${type}/${e.id}`, { method: 'PUT', json: body }); reload(); };
  return (
    <>
      <PageHead title={cfg.plural}>
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="!w-56" />
        <Btn onClick={async () => { const r = await api(`/api/admin/entries/${type}`, { json: { data: { name_en: `New ${cfg.label.toLowerCase()}`, name_el: '' } } }); nav(`/admin/content/${type}/${r.id}`); }}>＋ Add {cfg.label.toLowerCase()}</Btn>
      </PageHead>
      <p className="mb-4 text-xs text-taupe">Drag rows to change the order shown on the website.</p>
      <div className="border border-charcoal/10 bg-white">
        {list.map((e, i) => (
          <div key={e.id} draggable={!q} onDragStart={() => setDrag(i)} onDragOver={(ev) => ev.preventDefault()}
            onDrop={() => { if (drag === null || drag === i) return; const n = [...list]; const [x] = n.splice(drag, 1); n.splice(i, 0, x); setDrag(null); saveOrder(n); }}
            className={`flex items-center gap-4 border-b border-charcoal/5 px-4 py-3 ${drag === i ? 'opacity-40' : ''}`}>
            <span className="cursor-grab select-none text-taupe" title="Drag to reorder">⋮⋮</span>
            {cfg.images && <div className="h-12 w-12 shrink-0 overflow-hidden bg-stone">{e.cover && <img src={e.cover.sm} alt="" className="h-full w-full object-cover" />}</div>}
            <Link to={`/admin/content/${type}/${e.id}`} className="min-w-0 flex-1">
              <div className="truncate font-medium">{titleOf(e)}</div>
              <div className="truncate text-xs text-taupe">/{e.slug}{e.admin_note ? <span className="ml-2 text-[#9a6a16]">⚠ {e.admin_note}</span> : null}</div>
            </Link>
            <div className="hidden items-center gap-5 md:flex">
              <Toggle checked={e.published} onChange={(v) => patch(e, { published: v })} label="Published" />
              {type !== 'faq' && <Toggle checked={e.featured} onChange={(v) => patch(e, { featured: v })} label="Featured" />}
            </div>
            <div className="flex gap-1">
              {cfg.publicPath && <a href={cfg.publicPath({ ...e, data: e }, (opts || []).filter((o) => o.type === 'category'))} target="_blank" rel="noreferrer" className="px-2 text-xs text-warm hover:text-charcoal">View</a>}
              <button className="px-2 text-xs text-warm hover:text-charcoal" onClick={async () => { const r = await api(`/api/admin/entries/${type}/${e.id}/duplicate`, { method: 'POST' }); toast('Duplicated'); nav(`/admin/content/${type}/${r.id}`); }}>Duplicate</button>
              <button className="px-2 text-xs text-[#8a3b2a]" onClick={async () => { if (!confirm(`Delete "${titleOf(e)}"?`)) return; await api(`/api/admin/entries/${type}/${e.id}`, { method: 'DELETE' }); toast('Deleted'); reload(); }}>Delete</button>
            </div>
          </div>
        ))}
        {!list.length && <div className="p-10 text-center text-sm text-taupe">Nothing here yet.</div>}
      </div>
    </>
  );
}

export function EntityEdit() {
  const { type = 'product', id } = useParams();
  const cfg = TYPES[type];
  const { data } = useLoad<any>(`/api/admin/entries/${type}/${id}`, [id]);
  const { data: opts } = useLoad<any[]>('/api/admin/options');
  const [e, setE] = useState<any>(null);
  const [gallery, setGallery] = useState<Img[]>([]);
  const [lang, setLang] = useState<'en' | 'el'>('en');
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  const nav = useNavigate();
  useEffect(() => { if (data) { setE(data); setGallery(data.gallery || []); setDirty(false); } }, [data]);
  if (!cfg || !e) return <div className="p-10 text-taupe">Loading…</div>;
  const upd = (patch: any) => { setE((x: any) => ({ ...x, ...patch })); setDirty(true); };
  const setData = (k: string, v: any) => upd({ data: set(e.data, k, v) });
  const relOpts = (rel: string) => (opts || []).filter((o) => o.type === rel);

  const save = async () => {
    try {
      const r = await api(`/api/admin/entries/${type}/${e.id}`, { method: 'PUT', json: { slug: e.slug, published: e.published, featured: e.featured, data: e.data, images: gallery.map((g) => g.id), cover_id: e.cover_id, seo: e.seo } });
      setE((x: any) => ({ ...x, slug: r.slug })); setDirty(false); toast('Saved');
    } catch (err: any) { toast(err.message, 'err'); }
  };

  const renderField = (f: F) => {
    const key = f.bi ? `${f.k}_${lang}` : f.k;
    const v = get(e.data, key);
    switch (f.type) {
      case 'text': return <Input value={v || ''} onChange={(ev) => setData(key, ev.target.value)} />;
      case 'area': return <Area rows={5} value={v || ''} onChange={(ev) => setData(key, ev.target.value)} />;
      case 'lines': return <Area rows={5} value={(v || []).join('\n')} onChange={(ev) => setData(key, ev.target.value.split('\n'))} onBlur={(ev) => setData(key, ev.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />;
      case 'bool': return <Toggle checked={!!v} onChange={(b) => setData(key, b)} label={v ? 'Yes' : 'No'} />;
      case 'choice': return <Sel value={v || ''} onChange={(ev) => setData(key, ev.target.value)} options={(f.choices || []).map((c) => ({ value: c, label: c }))} />;
      case 'rel': return <Sel value={v ?? ''} onChange={(ev) => setData(key, ev.target.value ? Number(ev.target.value) : null)} options={[{ value: '', label: 'None' }, ...relOpts(f.rel!).map((o) => ({ value: o.id, label: o.name || o.slug }))]} />;
      case 'multi': {
        const arr: number[] = v || [];
        return (
          <div className="flex flex-wrap gap-2">
            {relOpts(f.rel!).map((o) => {
              const on = arr.includes(o.id);
              return <button type="button" key={o.id} onClick={() => setData(key, on ? arr.filter((x) => x !== o.id) : [...arr, o.id])}
                className={`border px-3 py-1.5 text-xs ${on ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/15 hover:border-charcoal'}`}>{o.name || o.slug}</button>;
            })}
          </div>
        );
      }
      case 'formats': {
        const arr: { t: string; w: number; l: number }[] = v || [];
        const upd2 = (i: number, k: string, val: any) => setData(key, arr.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] uppercase tracking-wide2 text-warm"><span>Thickness mm (e.g. 12 or 6, 12)</span><span>Width cm</span><span>Length cm</span><span /></div>
            {arr.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <Input value={row.t ?? ''} onChange={(ev) => upd2(i, 't', ev.target.value)} />
                <Input type="number" step="0.5" value={row.w ?? ''} onChange={(ev) => upd2(i, 'w', Number(ev.target.value))} />
                <Input type="number" step="0.5" value={row.l ?? ''} onChange={(ev) => upd2(i, 'l', Number(ev.target.value))} />
                <Btn type="button" kind="ghost" onClick={() => setData(key, arr.filter((_, j) => j !== i))}>✕</Btn>
              </div>
            ))}
            <Btn type="button" kind="line" onClick={() => setData(key, [...arr, { t: '', w: 0, l: 0 }])}>＋ Add size</Btn>
          </div>
        );
      }
      case 'kv': {
        const arr: any[] = v || [];
        return (
          <div className="space-y-2">
            {arr.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input placeholder={`Label (${lang.toUpperCase()})`} value={row[`label_${lang}`] || ''} onChange={(ev) => setData(key, arr.map((r, j) => (j === i ? { ...r, [`label_${lang}`]: ev.target.value } : r)))} />
                <Input placeholder={`Value (${lang.toUpperCase()})`} value={row[`value_${lang}`] || ''} onChange={(ev) => setData(key, arr.map((r, j) => (j === i ? { ...r, [`value_${lang}`]: ev.target.value } : r)))} />
                <Btn type="button" kind="ghost" onClick={() => setData(key, arr.filter((_, j) => j !== i))}>✕</Btn>
              </div>
            ))}
            <Btn type="button" kind="line" onClick={() => setData(key, [...arr, {}])}>＋ Add specification</Btn>
          </div>
        );
      }
    }
  };

  return (
    <>
      <div className="mb-2 text-xs"><Link to={`/admin/content/${type}`} className="text-warm hover:text-charcoal">← {cfg.plural}</Link></div>
      <PageHead title={e.data.name_en || e.data.q_en || cfg.label}>
        <div className="flex border border-charcoal/15">
          {(['en', 'el'] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wide2 ${lang === l ? 'bg-charcoal text-ivory' : ''}`}>{l === 'en' ? 'English' : 'Ελληνικά'}</button>)}
        </div>
        {cfg.publicPath && <a className="inline-flex items-center px-4 text-[11px] uppercase tracking-wide2 text-warm hover:text-charcoal" href={cfg.publicPath(e, relOpts('category'))} target="_blank" rel="noreferrer">View ↗</a>}
        <Btn onClick={save} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</Btn>
      </PageHead>
      {e.data.admin_note && <div className="mb-6 border border-[#e2c98f] bg-[#fbf3e1] px-4 py-3 text-sm text-[#6b4d16]">⚠ {e.data.admin_note} <button className="ml-2 underline" onClick={() => setData('admin_note', '')}>Mark resolved</button></div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title={`Content · ${lang === 'en' ? 'English' : 'Greek'}`}>
            <div className="grid gap-5 sm:grid-cols-2">
              {cfg.fields.map((f) => (
                <Field key={f.k} label={`${f.label}${f.bi ? ` (${lang.toUpperCase()})` : ''}`} hint={f.hint} className={f.wide || f.type === 'area' ? 'sm:col-span-2' : ''}>{renderField(f)}</Field>
              ))}
            </div>
          </Card>
          {cfg.images && (
            <Card title="Images">
              <ImageManager images={gallery} cover={e.cover_id} onChange={(imgs, cover) => { setGallery(imgs); upd({ cover_id: cover }); }} />
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Toggle checked={e.published} onChange={(v) => upd({ published: v })} label="Published on the website" />
              {type !== 'faq' && <Toggle checked={e.featured} onChange={(v) => upd({ featured: v })} label="Featured" />}
              <Field label="URL slug" hint="Clean URL, letters, numbers and hyphens"><Input value={e.slug} onChange={(ev) => upd({ slug: ev.target.value })} /></Field>
            </div>
          </Card>
          {/* SEO (title, description, share image) is filled in automatically from the name, text and cover image */}
          <Card title="Danger zone">
            <Btn kind="danger" onClick={async () => { if (!confirm('Delete permanently?')) return; await api(`/api/admin/entries/${type}/${e.id}`, { method: 'DELETE' }); nav(`/admin/content/${type}`); }}>Delete {cfg.label.toLowerCase()}</Btn>
          </Card>
        </div>
      </div>
      {dirty && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 bg-charcoal px-5 py-3 text-sm text-ivory shadow-xl">Unsaved changes <button onClick={save} className="ml-4 underline">Save</button></div>}
      <span className="hidden"><Badge>x</Badge></span>
    </>
  );
}
