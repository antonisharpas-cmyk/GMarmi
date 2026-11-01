import { useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Img } from '../lib/types';
import { Btn, Card, Input, PageHead, useLoad, useToast, Badge } from './common';

type M = Img & { filename: string; bytes: number; used: { type: string; id: any; name: string }[]; created_at: string };

export async function uploadFiles(files: FileList | File[]): Promise<Img[]> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));
  const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Upload failed');
  return d;
}

function DropZone({ onFiles, compact = false }: { onFiles: (f: FileList) => void; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
      onClick={() => input.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center border border-dashed text-center transition-colors ${over ? 'border-charcoal bg-stone/60' : 'border-charcoal/25 hover:border-charcoal/60'} ${compact ? 'aspect-square p-3' : 'p-10'}`}>
      <span className="text-2xl text-bronze">＋</span>
      <span className="mt-1 text-xs text-warm">{compact ? 'Add images' : 'Drop images here or click to upload. Several at once is fine. They are optimised automatically.'}</span>
      <input ref={input} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files?.length && onFiles(e.target.files)} />
    </div>
  );
}

export function MediaPicker({ onPick, onClose, multiple = true }: { onPick: (imgs: Img[]) => void; onClose: () => void; multiple?: boolean }) {
  const [q, setQ] = useState('');
  const { data, reload } = useLoad<M[]>(`/api/admin/media?q=${encodeURIComponent(q)}`, [q]);
  const [sel, setSel] = useState<Img[]>([]);
  const toast = useToast();
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col bg-ivory">
        <div className="flex items-center gap-3 border-b border-charcoal/10 p-4">
          <Input placeholder="Search media" value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn kind="ghost" onClick={onClose}>Close</Btn>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-5 lg:grid-cols-6">
          <DropZone compact onFiles={async (f) => { try { await uploadFiles(f); reload(); } catch (e: any) { toast(e.message, 'err'); } }} />
          {data?.map((m) => {
            const on = sel.some((s) => s.id === m.id);
            return (
              <button key={m.id} onClick={() => setSel((s) => on ? s.filter((x) => x.id !== m.id) : multiple ? [...s, m] : [m])}
                className={`relative aspect-square overflow-hidden bg-stone ${on ? 'ring-2 ring-charcoal ring-offset-2' : ''}`}>
                <img src={m.sm} alt="" className="h-full w-full object-cover" loading="lazy" />
                {on && <span className="absolute right-1 top-1 bg-charcoal px-1.5 text-xs text-ivory">{sel.findIndex((x) => x.id === m.id) + 1}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 border-t border-charcoal/10 p-4">
          <Btn kind="line" onClick={onClose}>Cancel</Btn>
          <Btn disabled={!sel.length} onClick={() => { onPick(sel); onClose(); }}>Use {sel.length || ''} image{sel.length === 1 ? '' : 's'}</Btn>
        </div>
      </div>
    </div>
  );
}

/** Drag and drop gallery manager: add, delete, replace, reorder, choose cover */
export function ImageManager({ images, cover, onChange }: { images: Img[]; cover: number | null; onChange: (images: Img[], cover: number | null) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const coverId = cover ?? images[0]?.id ?? null;
  const move = (from: number, to: number) => {
    if (from === to) return;
    const n = [...images]; const [x] = n.splice(from, 1); n.splice(to, 0, x); onChange(n, coverId);
  };
  const add = (imgs: Img[]) => { const n = [...images, ...imgs.filter((i) => !images.some((x) => x.id === i.id))]; onChange(n, coverId ?? n[0]?.id ?? null); };
  const replace = async (idx: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`/api/admin/media/${images[idx].id}/replace`, { method: 'POST', body: fd });
    const d = await res.json();
    if (!res.ok) return toast(d.error, 'err');
    const n = [...images]; n[idx] = d; onChange(n, coverId); toast('Image replaced everywhere it is used');
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((img, i) => (
          <div key={img.id} draggable onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); }}
            className={`group relative aspect-square cursor-grab overflow-hidden bg-stone active:cursor-grabbing ${drag === i ? 'opacity-40' : ''} ${coverId === img.id ? 'ring-2 ring-bronze ring-offset-2' : ''}`}>
            <img src={img.sm} alt="" className="pointer-events-none h-full w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 bg-ink/70 px-1.5 text-[10px] text-ivory">{i + 1}</span>
            {coverId === img.id && <span className="absolute right-1.5 top-1.5 bg-bronze px-1.5 text-[10px] uppercase tracking-wide text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-1 bg-ink/75 p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" title="Move left" onClick={() => move(i, Math.max(0, i - 1))} className="px-1.5 text-xs text-ivory">◀</button>
              <button type="button" title="Set as cover" onClick={() => onChange(images, img.id)} className="px-1.5 text-xs text-ivory">★</button>
              <label title="Replace file" className="cursor-pointer px-1.5 text-xs text-ivory">⟳<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && replace(i, e.target.files[0])} /></label>
              <button type="button" title="Remove from gallery" onClick={() => { const n = images.filter((x) => x.id !== img.id); onChange(n, coverId === img.id ? n[0]?.id ?? null : coverId); }} className="px-1.5 text-xs text-[#ffb4a3]">✕</button>
              <button type="button" title="Move right" onClick={() => move(i, Math.min(images.length - 1, i + 1))} className="px-1.5 text-xs text-ivory">▶</button>
            </div>
          </div>
        ))}
        <DropZone compact onFiles={async (f) => { setBusy(true); try { add(await uploadFiles(f)); } catch (e: any) { toast(e.message, 'err'); } setBusy(false); }} />
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-taupe">
        <Btn type="button" kind="line" onClick={() => setPicker(true)}>Choose from library</Btn>
        {busy ? 'Uploading and optimising…' : 'Drag thumbnails to reorder. ★ sets the cover. The website uses this order immediately after saving.'}
      </div>
      {picker && <MediaPicker onPick={add} onClose={() => setPicker(false)} />}
    </div>
  );
}

/** Single image field for settings (hero image, etc.) */
export function SingleImage({ value, onChange }: { value: Img | null; onChange: (img: Img | null) => void }) {
  const [picker, setPicker] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-32 overflow-hidden bg-stone">{value && <img src={value.sm} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-col gap-2">
        <Btn type="button" kind="line" onClick={() => setPicker(true)}>{value ? 'Change' : 'Choose'} image</Btn>
        {value && <Btn type="button" kind="ghost" onClick={() => onChange(null)}>Remove</Btn>}
      </div>
      {picker && <MediaPicker multiple={false} onPick={(i) => onChange(i[0] || null)} onClose={() => setPicker(false)} />}
    </div>
  );
}

export default function MediaLibrary() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'unused'>('all');
  const { data, reload } = useLoad<M[]>(`/api/admin/media?q=${encodeURIComponent(q)}`, [q]);
  const [sel, setSel] = useState<M | null>(null);
  const toast = useToast();
  const list = (data || []).filter((m) => filter === 'all' || !m.used.length);
  return (
    <>
      <PageHead title="Media library">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="!w-56" />
        <Btn kind={filter === 'all' ? 'dark' : 'line'} onClick={() => setFilter('all')}>All</Btn>
        <Btn kind={filter === 'unused' ? 'dark' : 'line'} onClick={() => setFilter('unused')}>Unused</Btn>
      </PageHead>
      <div className="mb-6"><DropZone onFiles={async (f) => { try { const r = await uploadFiles(f); toast(`${r.length} image(s) uploaded`); reload(); } catch (e: any) { toast(e.message, 'err'); } }} /></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {list.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className="text-left">
            <div className="aspect-square overflow-hidden bg-stone"><img src={m.sm} alt="" className="h-full w-full object-cover" loading="lazy" /></div>
            <div className="mt-1.5 truncate text-xs">{m.filename}</div>
            <div className="text-[10px] text-taupe">{m.used.length ? `Used in ${m.used.length}` : 'Unused'}</div>
          </button>
        ))}
      </div>
      {sel && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4" onClick={() => setSel(null)}>
          <div className="grid max-h-[90vh] w-full max-w-4xl overflow-auto bg-ivory md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            <img src={sel.md} alt="" className="h-full max-h-[70vh] w-full object-contain bg-stone" />
            <div className="space-y-4 p-6">
              <div className="text-sm">{sel.filename}</div>
              <Card title="Image description">
                <div className="space-y-3">
                  <Input defaultValue={sel.alt_en} placeholder="English" id="alt_en" />
                  <Input defaultValue={sel.alt_el} placeholder="Ελληνικά" id="alt_el" />
                  <Btn onClick={async () => { await api(`/api/admin/media/${sel.id}`, { method: 'PUT', json: { alt_en: (document.getElementById('alt_en') as HTMLInputElement).value, alt_el: (document.getElementById('alt_el') as HTMLInputElement).value } }); toast('Saved'); reload(); }}>Save</Btn>
                </div>
              </Card>
              <Card title="Used in">
                {sel.used.length ? sel.used.map((u, i) => <div key={i} className="flex items-center gap-2 py-1 text-sm"><Badge>{u.type}</Badge>{u.name}</div>) : <span className="text-sm text-taupe">Not used anywhere</span>}
              </Card>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center border border-charcoal/20 px-4 py-2.5 text-[11px] uppercase tracking-wide2">Replace file
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('file', f);
                    const r = await fetch(`/api/admin/media/${sel.id}/replace`, { method: 'POST', body: fd });
                    if (r.ok) { toast('Replaced'); setSel(null); reload(); } else toast((await r.json()).error, 'err');
                  }} /></label>
                <Btn kind="danger" onClick={async () => { if (!confirm(sel.used.length ? 'This image is in use and will be removed from those galleries. Delete?' : 'Delete this image?')) return; await api(`/api/admin/media/${sel.id}`, { method: 'DELETE' }); toast('Deleted'); setSel(null); reload(); }}>Delete</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
