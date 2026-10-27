import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, reduced } from '../lib/motion';
import type { Img as TImg } from '../lib/types';
import { useLang } from '../lib/i18n';

export type RevealVariant = 'left' | 'right' | 'up' | 'mask' | 'scale' | 'parallax' | 'fade';

/**
 * Reusable premium image reveal.
 * left / right: slides in from the side with a clip and settle
 * up: vertical clip from bottom to top
 * mask: grows out of an inset mask while the image zooms back to 1
 * scale: image settles from 1.12 to 1
 * parallax: image drifts slower than the page (scrubbed)
 */
export function Reveal({ variant = 'up', className = '', children, delay = 0, parallax = true }: {
  variant?: RevealVariant; className?: string; children: React.ReactNode; delay?: number; parallax?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const w = wrap.current, i = inner.current;
    if (!w || !i || reduced()) return;
    const ctx = gsap.context(() => {
      const st = { trigger: w, start: 'top 88%', once: true };
      const d = { duration: 1.6, ease: 'expo.out', delay };
      const mobile = window.innerWidth < 768;
      const dist = mobile ? 8 : 14;
      switch (variant) {
        case 'left':
          gsap.fromTo(w, { xPercent: -dist, clipPath: 'inset(0% 100% 0% 0%)' }, { xPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ...d, scrollTrigger: st });
          gsap.fromTo(i, { scale: 1.15 }, { scale: 1, ...d, duration: 2, scrollTrigger: st });
          break;
        case 'right':
          gsap.fromTo(w, { xPercent: dist, clipPath: 'inset(0% 0% 0% 100%)' }, { xPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ...d, scrollTrigger: st });
          gsap.fromTo(i, { scale: 1.15 }, { scale: 1, ...d, duration: 2, scrollTrigger: st });
          break;
        case 'up':
          gsap.fromTo(w, { y: 60, clipPath: 'inset(100% 0% 0% 0%)' }, { y: 0, clipPath: 'inset(0% 0% 0% 0%)', ...d, scrollTrigger: st });
          gsap.fromTo(i, { scale: 1.12 }, { scale: 1, ...d, duration: 2, scrollTrigger: st });
          break;
        case 'mask':
          gsap.fromTo(w, { clipPath: 'inset(18% 22% 18% 22%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ...d, duration: 1.8, scrollTrigger: st });
          gsap.fromTo(i, { scale: 1.3 }, { scale: 1, ...d, duration: 2.2, scrollTrigger: st });
          break;
        case 'scale':
          gsap.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', delay, scrollTrigger: st });
          gsap.fromTo(i, { scale: 1.12 }, { scale: 1, ...d, duration: 2.2, scrollTrigger: st });
          break;
        case 'fade':
          gsap.fromTo(w, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay, scrollTrigger: st });
          break;
      }
      if ((variant === 'parallax' || parallax) && !mobile) {
        gsap.fromTo(i.firstElementChild || i, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    }, w);
    return () => ctx.revert();
  }, [variant, delay, parallax]);
  return (
    <div ref={wrap} className={`relative overflow-hidden ${className}`}>
      <div ref={inner} className="absolute inset-0 will-change-transform">
        {variant === 'parallax' || parallax ? <div className="absolute -inset-y-[6%] inset-x-0">{children}</div> : children}
      </div>
    </div>
  );
}

export function Picture({ img, className = '', sizes = '100vw', eager = false, alt }: { img?: TImg | null; className?: string; sizes?: string; eager?: boolean; alt?: string }) {
  const { lang } = useLang();
  if (!img) return <div className={`h-full w-full bg-stone ${className}`} />;
  const srcSet = img.sm !== img.lg ? `${img.sm} 520w, ${img.md} 1100w, ${img.lg} 2000w` : undefined;
  return (
    <img
      src={img.lg}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt ?? ((lang === 'el' ? img.alt_el : img.alt_en) || '')}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => ScrollTrigger.refresh()}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/** Split text into lines that rise in one after another */
export function RiseText({ children, className = '', as: Tag = 'div', delay = 0, stagger = 0.08, trigger = true }: {
  children: string; className?: string; as?: any; delay?: number; stagger?: number; trigger?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelectorAll('.rw > span'), { yPercent: 110 }, {
        yPercent: 0, duration: 1.4, ease: 'expo.out', stagger, delay,
        scrollTrigger: trigger ? { trigger: el, start: 'top 90%', once: true } : undefined,
      });
    }, el);
    return () => ctx.revert();
  }, [children, delay, stagger, trigger]);
  return (
    <Tag ref={ref} className={className} aria-label={children}>
      {children.split(' ').map((w, i) => (
        <span key={i} className="rw inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <span className="inline-block">{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  );
}

/** Simple fade up for text blocks */
export function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay, scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true } });
    });
    return () => ctx.revert();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}
