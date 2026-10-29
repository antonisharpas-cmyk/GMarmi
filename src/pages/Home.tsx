import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useSite, useApi, productPath } from '../lib/site';
import { gsap, reduced, ScrollTrigger } from '../lib/motion';
import { Picture, Reveal, RiseText, FadeUp } from '../components/Reveal';
import { Tile, SectionHead, Loading, variantAt } from '../components/ui';
import { useEnquiry } from '../components/EnquiryDrawer';
import { track } from '../lib/api';
import type { Entry, Img } from '../lib/types';

/* ---------------- 1. HERO ---------------- */
function Hero({ h }: { h: any }) {
  const { tr, lp, lang } = useLang();
  const { open } = useEnquiry();
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
      tl.fromTo('.hero-frame', { clipPath: 'inset(14% 0% 14% 62%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.1 })
        .fromTo('.hero-img', { scale: 1.35, xPercent: 12 }, { scale: 1.06, xPercent: 0, duration: 2.6 }, 0)
        .fromTo('.hero-fade', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'power3.out' }, 1.5);
      // scroll out: image keeps settling, content drifts up
      gsap.to('.hero-img', { scale: 1, yPercent: 12, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: '70% top', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink text-ivory" data-dark>
      <div className="hero-frame absolute inset-0 overflow-hidden">
        <div className="hero-img absolute inset-0"><Picture img={h.hero_image} eager /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/40" />
      </div>
      <div className="hero-content wrap relative flex h-full flex-col justify-end pb-16 pt-32 sm:pb-24">
        <div className="hero-fade eyebrow mb-7 text-sand">{tr(h, 'hero_kicker')}</div>
        <RiseText as="h1" className={`display max-w-[14ch] ${lang === 'el' ? 'text-[11vw] sm:text-[8vw] lg:text-[6.2vw]' : 'text-[13vw] sm:text-[10vw] lg:text-[8.2vw]'}`} delay={1.1} trigger={false}>{tr(h, 'hero_title')}</RiseText>
        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="hero-fade max-w-lg text-[15px] leading-[1.8] text-ivory/80">{tr(h, 'hero_sub')}</p>
          <div className="hero-fade flex flex-wrap gap-4">
            <Link to={lp('/materials')} onClick={() => track('cta_click', 'hero_materials')} className="btn btn-light group" data-cursor="explore"><span>{tr(h, 'cta_primary')}</span><span className="arrow">→</span></Link>
            <button onClick={() => { track('cta_click', 'hero_enquire'); open(); }} className="btn border-ivory bg-ivory text-charcoal" data-cursor="enquire"><span>{tr(h, 'cta_secondary')}</span></button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 2. STONE. SURFACE. SPACE. ---------------- */
function Intro({ words, images }: { words: string[]; images: Img[] }) {
  const ref = useRef<HTMLElement>(null);
  const r = reduced();
  useLayoutEffect(() => {
    if (!ref.current || r) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=320%', scrub: 1, pin: true, anticipatePin: 1 } });
      gsap.set('.iw', { yPercent: 110 });
      tl.fromTo('.ii-0', { clipPath: 'inset(30% 34% 30% 34%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0)
        .fromTo('.ii-0 img', { scale: 1.4 }, { scale: 1, duration: 1.2, ease: 'power2.inOut' }, '<')
        .to('.iw-0', { yPercent: 0, duration: 0.5 }, '-=0.3')
        .to('.iw-0', { yPercent: -110, duration: 0.5 }, '+=0.2')
        .fromTo('.ii-1', { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, '<')
        .fromTo('.ii-1 img', { xPercent: 20, scale: 1.2 }, { xPercent: 0, scale: 1, duration: 1, ease: 'power2.inOut' }, '<')
        .to('.iw-1', { yPercent: 0, duration: 0.5 }, '<0.4')
        .to('.iw-1', { yPercent: -110, duration: 0.5 }, '+=0.4')
        .fromTo('.ii-2', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, '<')
        .fromTo('.ii-2 img', { xPercent: -20, scale: 1.2 }, { xPercent: 0, scale: 1, duration: 1, ease: 'power2.inOut' }, '<')
        .to('.iw-2', { yPercent: 0, duration: 0.5 }, '<0.4')
        .to({}, { duration: 0.4 });
    }, ref);
    return () => ctx.revert();
  }, [r, images.length]);
  if (r) {
    return (
      <section className="wrap grid gap-6 py-28 sm:grid-cols-3">
        {words.map((w, i) => (<div key={w}><div className="aspect-[4/5] overflow-hidden"><Picture img={images[i]} /></div><div className="h-md mt-6">{w}</div></div>))}
      </section>
    );
  }
  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden bg-ivory">
      {images.slice(0, 3).map((img, i) => (
        <div key={img.id} className={`ii-${i} absolute inset-0 overflow-hidden`} style={{ clipPath: i === 0 ? undefined : 'inset(0 0 0 100%)' }}>
          <Picture img={img} sizes="100vw" />
          <div className="absolute inset-0 bg-ink/45" />
        </div>
      ))}
      <div className="iwords pointer-events-none absolute inset-0 flex items-center justify-center text-ivory [text-shadow:0_4px_40px_rgba(18,17,16,.35)]">
        {words.slice(0, 3).map((w, i) => (
          <div key={w} className="absolute overflow-hidden">
            <div className={`iw iw-${i} display whitespace-nowrap pb-[0.12em] ${w.length > 7 ? 'text-[13vw] sm:text-[11vw] lg:text-[9vw]' : 'text-[17vw] sm:text-[13vw] lg:text-[10.5vw]'}`}>{w}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 3. MATERIALS (horizontal) ---------------- */
function Materials({ cats }: { cats: Entry[] }) {
  const { tr, t, lp, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const track2 = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const el = track2.current!;
      const dist = () => el.scrollWidth - window.innerWidth;
      const tween = gsap.to(el, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${dist()}`, scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1 } });
      el.querySelectorAll<HTMLElement>('.hp-img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -10, scale: 1.15 }, { xPercent: 10, scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      el.querySelectorAll<HTMLElement>('.hp-name').forEach((n) => {
        gsap.fromTo(n, { xPercent: 12 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: n, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    return () => mm.revert();
  }, [cats.length]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-marble lg:h-[100svh]">
      <div ref={track2} className="flex flex-col gap-16 py-24 lg:h-full lg:flex-row lg:items-center lg:gap-[6vw] lg:py-0 lg:pl-[8vw] lg:pr-[10vw]">
        <div className="wrap shrink-0 lg:w-[34vw] lg:px-0">
          <div className="eyebrow mb-6">{t('materials')}</div>
          <RiseText as="h2" className="display text-5xl sm:text-6xl lg:text-[4.4vw]">{lang === 'el' ? 'Ένας κόσμος επιφανειών' : 'A world of surfaces'}</RiseText>
          <Link to={lp('/materials')} className="group ulink mt-10 inline-block text-[11px] font-medium uppercase tracking-wide3">{t('allMaterials')} <span className="arrow">→</span></Link>
        </div>
        {cats.map((c, i) => (
          <Link key={c.id} to={lp(`/materials/${c.slug}`)} className="tile group relative block shrink-0 px-5 sm:px-8 lg:px-0" data-cursor="explore">
            <div className={`relative overflow-hidden bg-stone ${i % 2 ? 'lg:mt-[14vh]' : 'lg:-mt-[10vh]'} aspect-[4/5] lg:aspect-auto lg:h-[64vh] lg:w-[38vw]`}>
              <div className="hp-img absolute -inset-x-[12%] inset-y-0"><Picture img={c.cover} sizes="(min-width:1024px) 40vw, 100vw" /></div>
              <div className="tile-shade absolute inset-0" />
            </div>
            <div className="pointer-events-none mt-5 flex items-baseline gap-5 lg:absolute lg:bottom-8 lg:left-8 lg:right-8 lg:mt-0 lg:text-ivory">
              <span className="text-xs tracking-wide2 text-bronze lg:text-ivory/70">0{i + 1}</span>
              <span className="hp-name display block text-5xl uppercase leading-[0.9] sm:text-6xl lg:text-[4vw]">{tr(c, 'name')}</span>
            </div>
            <span className="tile-hide absolute right-8 top-8 hidden text-[11px] uppercase tracking-wide3 text-ivory lg:block">{t('explore')} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 4. MATERIAL STORY ---------------- */
function Story({ img, lines, link }: { img: Img; lines: string[]; link: string }) {
  const ref = useRef<HTMLElement>(null);
  const r = reduced();
  useLayoutEffect(() => {
    if (!ref.current || r) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=260%', scrub: 1, pin: true } });
      tl.fromTo('.st-img', { scale: 1.25, xPercent: -6 }, { scale: 1.02, xPercent: 6, duration: 4, ease: 'none' }, 0);
      lines.forEach((_, i) => {
        tl.fromTo(`.st-l${i}`, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6 }, i * 0.95 + 0.1);
        if (i < lines.length - 1) tl.to(`.st-l${i}`, { opacity: i === 0 ? 0.35 : 0, y: i === 0 ? 0 : -40, duration: 0.5 }, i * 0.95 + 0.85);
      });
    }, ref);
    return () => ctx.revert();
  }, [r, lines.length]);
  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden bg-ink text-ivory" data-dark>
      <div className="st-img absolute inset-0"><Picture img={img} /></div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/25 to-transparent" />
      <div className="wrap relative flex h-full flex-col justify-center">
        <div className="st-l0 eyebrow mb-4 text-sand">{lines[0]}</div>
        <div className="relative h-[1.2em] text-[13vw] sm:text-[9vw] lg:text-[7vw]">
          {lines.slice(1, -1).map((l, i) => (
            <div key={l} className={`st-l${i + 1} display absolute left-0 top-0 ${r ? 'relative' : ''}`}>{l}</div>
          ))}
        </div>
        <Link to={link} className={`st-l${lines.length - 1} group mt-14 inline-flex items-center gap-4 self-start border-b border-ivory/40 pb-2 text-[12px] uppercase tracking-wide3`} data-cursor="explore">
          {lines[lines.length - 1]} <span className="arrow">→</span>
        </Link>
      </div>
    </section>
  );
}

/* ---------------- 5. FEATURED COLLECTION (expanding image) ---------------- */
function Collection({ c }: { c: Entry }) {
  const { tr, t, lp } = useLang();
  const ref = useRef<HTMLElement>(null);
  const r = reduced();
  useLayoutEffect(() => {
    if (!ref.current || r) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=200%', scrub: 1, pin: true } });
      tl.fromTo('.cx-frame', { width: '46vw', height: '64vh' }, { width: '100vw', height: '100vh', ease: 'power2.inOut', duration: 2 })
        .fromTo('.cx-frame img', { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: 2 }, 0)
        .to('.cx-side', { opacity: 0, y: -30, duration: 0.6 }, 0.1)
        .fromTo('.cx-over', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, 1.5)
        .to({}, { duration: 0.5 });
    });
    return () => mm.revert();
  }, [r]);
  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ivory py-24 md:h-[100svh] md:py-0">
      <div className="cx-side absolute left-0 top-1/2 hidden w-[27vw] -translate-y-1/2 pl-[4vw] pr-[2vw] md:block">
        <div className="eyebrow mb-6">{t('collection')}</div>
        <div className="display text-[5.6vw] leading-[0.95]">{tr(c, 'name')}</div>
      </div>
      <div className="cx-side absolute right-0 top-1/2 hidden w-[27vw] -translate-y-1/2 pl-[2vw] pr-[4vw] md:block">
        <div className="eyebrow mb-6 leading-relaxed">{tr(c, 'tagline')}</div>
        <p className="text-sm leading-[1.8] text-warm">{tr(c, 'desc')}</p>
      </div>
      <div className="cx-frame relative h-[70vh] w-[90vw] overflow-hidden bg-ink text-ivory md:h-auto md:w-auto" data-dark>
        <Picture img={c.cover} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="cx-over absolute inset-x-0 bottom-0 p-8 sm:p-14 lg:p-20">
          <div className="eyebrow mb-5 text-sand">{t('collection')}</div>
          <h2 className="h-xl">{tr(c, 'name')}</h2>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.8] text-ivory/80">{tr(c, 'body') || tr(c, 'desc')}</p>
          <Link to={lp(`/collections/${c.slug}`)} className="btn btn-light group mt-10" data-cursor="explore"><span>{t('exploreCollection')}</span><span className="arrow">→</span></Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 6. APPLICATIONS ---------------- */
function Applications({ apps }: { apps: Entry[] }) {
  const { t, lp, lang } = useLang();
  const layout = ['lg:col-span-7 aspect-[4/3]', 'lg:col-span-5 aspect-[4/5] lg:mt-40', 'lg:col-span-4 aspect-[3/4]', 'lg:col-span-4 aspect-[3/4] lg:mt-24', 'lg:col-span-4 aspect-[3/4] lg:-mt-10', 'lg:col-span-8 lg:col-start-3 aspect-[16/9]'];
  return (
    <section className="bg-ivory py-28 sm:py-40">
      <div className="wrap">
        <SectionHead eyebrow={t('applications')} title={lang === 'el' ? 'Για κάθε χώρο' : 'Made for every space'} link={lp('/applications')} linkLabel={t('viewAll')} />
        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-12">
          {apps.slice(0, 6).map((a, i) => {
            const [span, aspect] = [layout[i].replace(/aspect-\S+/, ''), layout[i].match(/aspect-\S+/)?.[0] || 'aspect-[4/5]'];
            return <div key={a.id} className={span}><Tile e={a} i={i} to={lp(`/applications/${a.slug}`)} aspect={aspect} sub={`0${i + 1}`} /></div>;
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 7. SHOWCASE (featured materials, editorial) ---------------- */
function Showcase({ items }: { items: Entry[] }) {
  const { t, tr, lp } = useLang();
  const s = useSite();
  const rows = [
    'lg:col-span-7', 'lg:col-span-4 lg:col-start-9 lg:mt-48',
    'lg:col-span-5 lg:col-start-2 lg:-mt-20', 'lg:col-span-6 lg:col-start-7 lg:mt-20',
    'lg:col-span-4 lg:-mt-10', 'lg:col-span-7 lg:col-start-6 lg:mt-28',
  ];
  const aspects = ['aspect-[5/4]', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-[16/10]'];
  return (
    <section className="bg-marble py-28 sm:py-40">
      <div className="wrap">
        <SectionHead eyebrow={t('materials')} title={tr({ title_en: 'Surfaces with character', title_el: 'Επιφάνειες με χαρακτήρα' }, 'title')} link={lp('/materials')} linkLabel={t('allMaterials')} />
        <div className="grid gap-x-6 gap-y-16 lg:grid-cols-12">
          {items.map((p, i) => (
            <div key={p.id} className={rows[i % rows.length]}>
              <Link to={lp(productPath(p, s?.categories))} className="tile group block" data-cursor="view">
                <Reveal variant={variantAt(i)} className={`${aspects[i % aspects.length]} bg-stone`}>
                  <Picture img={p.cover} sizes="(min-width:1024px) 55vw, 100vw" />
                  <div className="tile-shade absolute inset-0" />
                  <div className="tile-hide tile-meta absolute bottom-6 left-6 right-6 flex items-end justify-between text-ivory">
                    <span className="max-w-xs text-sm leading-relaxed">{tr(p, 'tagline')}</span><span className="arrow text-xl">→</span>
                  </div>
                </Reveal>
                <div className="mt-5 flex items-baseline justify-between">
                  <h3 className="font-display text-3xl font-light sm:text-4xl">{tr(p, 'name')}</h3>
                  <span className="text-[11px] tracking-wide2 text-taupe">{String(i + 1).padStart(2, '0')}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Projects (only when the client has added projects) ---------------- */
function Projects() {
  const { t, tr, lp } = useLang();
  const { data } = useApi<Entry[]>('/api/entries/project');
  if (!data?.length) return null;
  const v = ['left', 'right', 'scale', 'mask'] as const;
  return (
    <section className="bg-ivory py-28 sm:py-40">
      <div className="wrap">
        <SectionHead eyebrow={t('projects')} title={t('projects')} link={lp('/projects')} linkLabel={t('viewAll')} />
        <div className="space-y-28">
          {data.slice(0, 4).map((p, i) => (
            <Link key={p.id} to={lp(`/projects/${p.slug}`)} className={`tile group grid items-end gap-8 lg:grid-cols-12 ${i % 2 ? 'lg:text-right' : ''}`} data-cursor="view">
              <div className={`lg:col-span-8 ${i % 2 ? 'lg:order-2 lg:col-start-5' : ''}`}>
                <Reveal variant={v[i % 4]} className="aspect-[16/10] bg-stone"><Picture img={p.cover} /></Reveal>
              </div>
              <div className={`lg:col-span-4 ${i % 2 ? 'lg:order-1 lg:row-start-1' : ''}`}>
                <div className="eyebrow mb-4">{String(i + 1).padStart(2, '0')} · {tr(p, 'location')}</div>
                <h3 className="h-md">{tr(p, 'name')}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 8. WHY ---------------- */
function Why({ items }: { items: any[] }) {
  const { tr } = useLang();
  return (
    <section className="bg-ivory py-28 sm:py-40">
      <div className="wrap">
        <div className="eyebrow mb-16">G. M. Andreou Marmi</div>
        <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((w, i) => (
            <FadeUp key={i} delay={i * 0.1} className="border-t border-charcoal/15 pt-8">
              <div className="mb-10 text-[11px] tracking-wide2 text-bronze">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="caps text-xl leading-snug">{tr(w, 't')}</h3>
              <p className="mt-5 text-sm leading-[1.8] text-warm">{tr(w, 'd')}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 9. CTA ---------------- */
function Cta({ h }: { h: any }) {
  const { tr } = useLang();
  const { open } = useEnquiry();
  return (
    <section className="relative overflow-hidden bg-ink py-40 text-ivory sm:py-56" data-dark>
      <Reveal variant="scale" className="!absolute inset-0 opacity-60"><Picture img={h.cta_image} /></Reveal>
      <div className="absolute inset-0 bg-ink/50" />
      <div className="wrap relative text-center">
        <RiseText as="h2" className="h-lg mx-auto max-w-[16ch]">{tr(h, 'cta_title')}</RiseText>
        <FadeUp delay={0.3}><button onClick={() => { track('cta_click', 'home_final'); open(); }} className="btn btn-light group mt-14" data-cursor="enquire"><span>{tr(h, 'cta_button')}</span><span className="arrow">→</span></button></FadeUp>
      </div>
    </section>
  );
}

export default function Home() {
  const s = useSite();
  const { tr, lang, lp } = useLang();
  useLayoutEffect(() => { const id = setTimeout(() => ScrollTrigger.refresh(), 600); return () => clearTimeout(id); }, [s]);
  if (!s) return <Loading />;
  const h = s.home;
  const sections: { key: string; visible: boolean }[] = h.sections || [];
  const col: Entry | null = h.featured_collection;
  const render: Record<string, () => React.ReactNode> = {
    hero: () => <Hero h={h} />,
    intro: () => (h.intro_images?.length >= 3 ? <Intro words={h[`intro_words_${lang}`] || h.intro_words_en} images={h.intro_images} /> : null),
    materials: () => (s.categories.length ? <Materials cats={s.categories} /> : null),
    story: () => (h.story_image ? <Story img={h.story_image} lines={h[`story_lines_${lang}`] || h.story_lines_en} link={lp(col ? `/collections/${col.slug}` : '/materials')} /> : null),
    collection: () => (col ? <Collection c={col} /> : null),
    applications: () => (s.applications.length ? <Applications apps={s.applications} /> : null),
    showcase: () => (h.featured_products?.length ? <Showcase items={h.featured_products} /> : null),
    projects: () => <Projects />,
    why: () => (h.why?.length ? <Why items={h.why} /> : null),
    cta: () => <Cta h={h} />,
  };
  void tr;
  return <>{sections.filter((x) => x.visible && render[x.key]).map((x) => <div key={x.key}>{render[x.key]()}</div>)}</>;
}
