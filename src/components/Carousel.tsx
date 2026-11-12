import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { productPath, useSite } from '../lib/site';
import { Tile } from './ui';
import type { Entry, Img } from '../lib/types';

/** One row that moves to the next item every few seconds, with left and right arrows and swipe on touch */
export function Carousel({ children, item, gap = 24, every = 2000 }: { children: React.ReactNode; item: string; gap?: number; every?: number }) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [m, setM] = useState({ step: 0, max: 0 });
  const [hold, setHold] = useState(false);
  const n = Children.count(children);
  const measure = useCallback(() => {
    const first = track.current?.children[0] as HTMLElement | undefined;
    if (!box.current || !first) return;
    const step = first.offsetWidth + gap;
    const visible = Math.max(1, Math.round((box.current.offsetWidth + gap) / step));
    setM({ step, max: Math.max(0, n - visible) });
  }, [n, gap]);
  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => { window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, [measure]);
  useEffect(() => { setIdx((i) => Math.min(i, m.max)); }, [m.max]);
  const go = useCallback((d: number) => setIdx((i) => (d > 0 ? (i >= m.max ? 0 : i + 1) : (i <= 0 ? m.max : i - 1))), [m.max]);
  useEffect(() => {
    if (hold || !m.max || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => { if (!document.hidden) go(1); }, every);
    return () => window.clearInterval(id);
  }, [hold, m.max, every, go, idx]);
  const touch = useRef(0);
  const arrow = 'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-charcoal shadow-[0_8px_24px_rgba(29,27,25,.15)] transition hover:bg-charcoal hover:text-ivory';
  return (
    <div className="relative" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setHold(true); }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); setHold(false); }}>
      <div ref={box} className="overflow-hidden">
        <div ref={track} className="flex transition-transform duration-700 ease-lux" style={{ gap, transform: `translateX(${-idx * m.step}px)` }}>
          {Children.map(children, (c) => <div className={`shrink-0 ${item}`}>{c}</div>)}
        </div>
      </div>
      {m.max > 0 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={t('prev')} className={`${arrow} left-2 sm:-left-5`}>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label={t('next')} className={`${arrow} right-2 sm:-right-5`}>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 3l5 5-5 5" /></svg>
          </button>
        </>
      )}
    </div>
  );
}

// the slab photo of a colour: an image named "swatch", otherwise its last photo
export const swatchOf = (p: Entry): Img | null => (p.gallery || []).find((g: Img) => /swatch/i.test(g.lg || '')) || (p.gallery || [])[(p.gallery || []).length - 1] || p.cover || null;

/** The materials of one surface in two moving rows: photos in real spaces, then the colours */
export function MaterialRows({ items }: { items: Entry[] }) {
  const s = useSite();
  const { lp, tr, t } = useLang();
  const spaces = items.filter((p) => p.cover && swatchOf(p)?.lg !== p.cover.lg);
  return (
    <div className="space-y-12">
      {spaces.length > 0 && (
        <Carousel item="w-[85%] sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)]">
          {spaces.map((p, i) => {
            const brand = s?.brands.find((b) => b.id === p.brand_id);
            return <Tile key={p.id} e={p} i={i % 3} to={lp(productPath(p, s?.categories))} label={brand ? tr(brand, 'name') : undefined} cursor="view" />;
          })}
        </Carousel>
      )}
      <div>
        <div className="eyebrow mb-5">{t('colours')}</div>
        <Carousel item="w-[calc((100%-24px)/3)] sm:w-[calc((100%-48px)/5)] lg:w-[calc((100%-84px)/8)]" gap={12}>
          {items.map((p) => {
            const sw = swatchOf(p);
            return (
              <Link key={p.id} to={lp(productPath(p, s?.categories))} className="group block" title={tr(p, 'name')}>
                <div className="aspect-square overflow-hidden bg-stone">{sw && <img src={sw.sm} alt={tr(p, 'name')} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />}</div>
                <div className="mt-2 truncate text-[12px]">{tr(p, 'name')}</div>
              </Link>
            );
          })}
        </Carousel>
      </div>
    </div>
  );
}
