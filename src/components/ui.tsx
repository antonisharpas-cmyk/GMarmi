import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useSite, productPath } from '../lib/site';
import { gsap, reduced, scrollLock } from '../lib/motion';
import { Picture, Reveal, RiseText, type RevealVariant } from './Reveal';
import type { Entry, Img } from '../lib/types';

const ROT: RevealVariant[] = ['left', 'right', 'up', 'mask', 'scale', 'right'];
export const variantAt = (i: number) => ROT[i % ROT.length];

/** Material / entry tile with premium hover */
export function Tile({ e, to, i = 0, aspect = 'aspect-[4/5]', label, sizes = '(min-width:1024px) 33vw, 100vw', sub, cursor = 'explore' }: {
  e: Entry; to: string; i?: number; aspect?: string; label?: string; sizes?: string; sub?: string; cursor?: string;
}) {
  const { tr, t } = useLang();
  return (
    <Link to={to} className="tile group block" data-cursor={cursor}>
      <Reveal variant={variantAt(i)} className={`${aspect} bg-stone`}>
        <Picture img={e.cover} sizes={sizes} />
        <div className="tile-shade absolute inset-0" />
        {e.exclusive && <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1.5 text-[9px] font-medium uppercase tracking-wide3 text-charcoal">{t('exclusive')}</span>}
      </Reveal>
      <div className="tile-meta mt-5 flex items-start justify-between gap-6">
        <div>
          {(label || sub) && <div className="eyebrow mb-2">{label || sub}</div>}
          <h3 className="font-display text-[28px] font-light leading-none sm:text-3xl">{tr(e, 'name')}</h3>
        </div>
        <span className="arrow mt-1 text-lg">→</span>
      </div>
    </Link>
  );
}

export function ProductGrid({ items }: { items: Entry[] }) {
  const s = useSite();
  const { lp, tr } = useLang();
  return (
    <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => {
        const brand = s?.brands.find((b) => b.id === p.brand_id);
        return <Tile key={p.id} e={p} i={i} to={lp(productPath(p, s?.categories))} label={brand ? tr(brand, 'name') : undefined} cursor="view" />;
      })}
    </div>
  );
}

/** Full bleed page hero with slow zoom and rising title */
export function PageHero({ img, eyebrow, title, intro, children, short = false }: { img?: Img | null; eyebrow?: string; title: string; intro?: string; children?: React.ReactNode; short?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.ph-img', { scale: 1.18, clipPath: 'inset(0 0 0 100%)' }, { scale: 1, clipPath: 'inset(0 0 0 0%)', duration: 2.2, ease: 'expo.inOut' });
      gsap.to('.ph-img', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo('.ph-fade', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, delay: 1.2, stagger: 0.1, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [img?.lg]);
  return (
    <section ref={ref} className={`relative flex ${short ? 'h-[68svh] min-h-[480px]' : 'h-[88svh] min-h-[560px]'} items-end overflow-hidden bg-ink text-ivory`} data-dark>
      <div className="ph-img absolute inset-0"><Picture img={img} eager /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30" />
      <div className="wrap relative pb-16 sm:pb-20">
        {eyebrow && <div className="ph-fade eyebrow mb-6 text-sand">{eyebrow}</div>}
        <RiseText as="h1" className="h-xl max-w-[14ch]" delay={0.8} trigger={false}>{title}</RiseText>
        {intro && <p className="ph-fade mt-8 max-w-xl text-[15px] leading-[1.8] text-ivory/80">{intro}</p>}
        {children && <div className="ph-fade mt-10">{children}</div>}
      </div>
    </section>
  );
}

/** Simple page header for light pages */
export function PageTitle({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="wrap pb-16 pt-40 sm:pt-48">
      {eyebrow && <div className="eyebrow mb-6">{eyebrow}</div>}
      <RiseText as="h1" className="h-xl max-w-[16ch]" trigger={false} delay={0.15}>{title}</RiseText>
      {intro && <p className="lead mt-8 max-w-2xl">{intro}</p>}
    </section>
  );
}

/** Fullscreen gallery with keyboard navigation and zoom */
export function Lightbox({ images, index, onClose }: { images: Img[]; index: number | null; onClose: () => void }) {
  const [i, setI] = useState(index ?? 0);
  const [zoom, setZoom] = useState(false);
  useEffect(() => { if (index !== null) { setI(index); setZoom(false); } scrollLock(index !== null); }, [index]);
  useEffect(() => {
    if (index === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % images.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [index, images.length, onClose]);
  if (index === null || !images[i]) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 text-ivory" role="dialog" aria-modal="true" data-dark>
      <button onClick={onClose} className="absolute right-6 top-6 z-10 text-[11px] uppercase tracking-wide2">Close ✕</button>
      <div className="absolute left-6 top-6 text-[11px] tracking-wide2 text-ivory/60">{String(i + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</div>
      <div className={`h-full w-full ${zoom ? 'cursor-zoom-out overflow-auto' : 'flex cursor-zoom-in items-center justify-center p-6 sm:p-16'}`} onClick={() => setZoom((z) => !z)} data-lenis-prevent>
        <img key={images[i].lg} src={images[i].lg} alt="" className={`page-in ${zoom ? 'max-w-none w-[180%]' : 'max-h-full max-w-full object-contain'}`} />
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => setI((x) => (x - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-2xl" aria-label="Previous">←</button>
          <button onClick={() => setI((x) => (x + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-2xl" aria-label="Next">→</button>
        </>
      )}
    </div>
  );
}

export function Loading() {
  return <div className="flex h-[70vh] items-center justify-center"><span className="h-px w-24 animate-pulse bg-charcoal/30" /></div>;
}

export function NotFoundBlock() {
  const { t, lp } = useLang();
  return (
    <section className="wrap flex min-h-[80vh] flex-col items-start justify-center pt-32">
      <div className="eyebrow">404</div>
      <h1 className="h-lg mt-6">{t('notFound')}</h1>
      <Link to={lp('/')} className="btn btn-line mt-10"><span>{t('backHome')}</span></Link>
    </section>
  );
}

export function SectionHead({ eyebrow, title, link, linkLabel }: { eyebrow?: string; title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-14 flex flex-wrap items-end justify-between gap-6 sm:mb-20">
      <div>
        {eyebrow && <div className="eyebrow mb-5">{eyebrow}</div>}
        <RiseText as="h2" className="h-lg max-w-[18ch]">{title}</RiseText>
      </div>
      {link && <Link to={link} className="group ulink text-[11px] font-medium uppercase tracking-wide3">{linkLabel} <span className="arrow">→</span></Link>}
    </div>
  );
}

export function useTitle(title?: string) {
  useEffect(() => { if (title) document.title = `${title} | G. M. Andreou Marmi`; }, [title]);
}
