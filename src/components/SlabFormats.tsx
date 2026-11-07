import { useLang } from '../lib/i18n';
import { FadeUp } from './Reveal';

export type Format = { t: string; w: number; l: number };

const inch = (cm: number) => (cm / 2.54).toFixed(2);
const inchMm = (mm: number) => (mm / 25.4).toFixed(2);

/** Isometric drawing of one slab, drawn to scale (thickness slightly exaggerated so it reads). */
function Slab({ w, l, t, max }: { w: number; l: number; t: number; max: number }) {
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
    <svg viewBox={`0 0 ${W + 12} ${H + 12}`} className="h-36 w-full" aria-hidden>
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
          {formats.map((f, i) => {
            const th = String(f.t).split(',').map((x) => x.trim()).filter(Boolean);
            return (
              <FadeUp key={i} delay={i * 0.05} className="bg-marble p-8">
                <Slab w={f.w} l={f.l} t={Number(th[th.length - 1]) || 12} max={max} />
                <div className="mt-6 font-display text-3xl font-light">{f.w} × {f.l} cm</div>
                <div className="mt-1 text-sm text-warm">{inch(f.w)}" × {inch(f.l)}"</div>
                <div className="mt-4 text-[11px] uppercase tracking-wide2 text-bronze">
                  {t('thickness')}: {th.map((x) => `${x} mm`).join(' · ')}
                  <span className="ml-2 normal-case tracking-normal text-taupe">({th.map((x) => `${inchMm(Number(x))}"`).join(' · ')})</span>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
