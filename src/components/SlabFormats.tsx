import { useLang } from '../lib/i18n';
import { FadeUp } from './Reveal';

export type Format = { t: string; w: number; l: number };

const inch = (cm: number) => (cm / 2.54).toFixed(2);
const inchMm = (mm: number) => (mm / 25.4).toFixed(2);

/** Isometric drawing of one slab, drawn to scale (thickness slightly exaggerated so it reads). */
/** Same width and length with several thicknesses become one row: 163 × 324 cm with 12, 20 mm */
export function groupFormats(formats: Format[]) {
  const out: { w: number; l: number; th: string[] }[] = [];
  for (const f of formats || []) {
    const th = String(f.t ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const g = out.find((o) => o.w === f.w && o.l === f.l);
    if (g) th.forEach((x) => !g.th.includes(x) && g.th.push(x)); else out.push({ w: f.w, l: f.l, th });
  }
  out.forEach((g) => g.th.sort((a, b) => Number(a) - Number(b)));
  return out;
}

/** 163cm × 324cm × then the thicknesses stacked: 12mm / 20mm / 36mm */
export function SizeLabel({ w, l, th, className = '' }: { w: number; l: number; th: string[]; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="whitespace-nowrap">{w}cm × {l}cm{th.length ? ' ×' : ''}</span>
      {th.length > 0 && <span className="flex flex-col leading-tight">{th.map((x) => <span key={x} className="whitespace-nowrap">{x}mm</span>)}</span>}
    </div>
  );
}

export function Slab({ w, l, t, max, className = 'h-36 w-full' }: { w: number; l: number; t: number; max: number; className?: string }) {
  const S = 150 / max; // px per cm, shared by all slabs of a category so sizes compare
  const a = l * S, b = w * S, h = Math.max(4, t * 0.45);
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  const P = (x: number, y: number, z: number) => [(x - y) * c, (x + y) * s - z];
  const top = [P(0, 0, h), P(a, 0, h), P(a, b, h), P(0, b, h)];
  const left = [P(0, b, h), P(a, b, h), P(a, b, 0), P(0, b, 0)];
  const right = [P(a, 0, h), P(a, b, h), P(a, b, 0), P(a, 0, 0)];
  const all = [...top, ...left, ...right];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), W = Math.max(...xs) - minX, H = Math.max(...ys) - minY;
  const pts = (arr: number[][]) => arr.map(([x, y]) => `${x - minX + 6},${y - minY + 6}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W + 12} ${H + 12}`} className={className} aria-hidden>
      <defs>
        <linearGradient id="slabTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6F2EC" /><stop offset="1" stopColor="#D6CBBB" />
        </linearGradient>
      </defs>
      <polygon points={pts(left)} fill="#A3968A" />
      <polygon points={pts(right)} fill="#6F675F" />
      <polygon points={pts(top)} fill="url(#slabTop)" stroke="#1D1B19" strokeOpacity=".15" strokeWidth=".6" />
    </svg>
  );
}

export default function SlabFormats({ formats, custom }: { formats: Format[]; custom?: boolean }) {
  const { t } = useLang();
  if (!formats?.length && !custom) return null;
  const max = Math.max(...formats.map((f) => Math.max(f.w, f.l)), 1);
  return (
    <section className="border-y border-charcoal/10 bg-marble py-20">
      <div className="wrap">
        <div className="eyebrow mb-10">{t('formats')}</div>
        {custom && !formats.length && <p className="max-w-xl font-display text-3xl font-light leading-snug">{t('customSizes')}</p>}
        <div className="grid gap-px bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-3">
          {groupFormats(formats).map((f, i) => (
              <FadeUp key={i} delay={i * 0.05} className="bg-marble p-8">
                <Slab w={f.w} l={f.l} t={Number(f.th[f.th.length - 1]) || 12} max={max} />
                <SizeLabel w={f.w} l={f.l} th={f.th} className="mt-6 font-display text-2xl font-light" />
                <div className="mt-2 text-xs text-taupe">{inch(f.w)}" × {inch(f.l)}"{f.th.length ? ` × ${f.th.map((x) => `${inchMm(Number(x))}"`).join(' / ')}` : ''}</div>
              </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
