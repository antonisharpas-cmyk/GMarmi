import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi } from '../lib/site';
import { track } from '../lib/api';
import { gsap, reduced } from '../lib/motion';
import { Picture, Reveal, RiseText, FadeUp } from '../components/Reveal';
import { Lightbox, Loading, NotFoundBlock, ProductGrid, Tile, useTitle, variantAt } from '../components/ui';
import { useEnquiry } from '../components/EnquiryDrawer';
import type { Entry } from '../lib/types';

export default function Product() {
  const { slug } = useParams();
  const { t, tr, lp, lang } = useLang();
  const { open } = useEnquiry();
  const { data, error } = useApi<{ item: Entry; related: any }>(`/api/entries/product/${slug}`);
  const [lb, setLb] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const p = data?.item;
  useTitle(p ? tr(p, 'name') : undefined);
  useEffect(() => { if (p) track('product_view', p.slug); }, [p?.slug]);
  useLayoutEffect(() => {
    if (!ref.current || reduced() || !p) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.pd-main', { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.8, ease: 'expo.inOut' });
      gsap.fromTo('.pd-main img', { scale: 1.3 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
      gsap.fromTo('.pd-fade', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, delay: 0.7, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [p?.id]);

  if (error) return <NotFoundBlock />;
  if (!p) return <Loading />;
  const r = data!.related;
  const specs: [string, string][] = ([
    [t('material'), tr(p.specs, 'material')],
    [t('brand'), r.brand ? tr(r.brand, 'name') : ''],
    [t('collection'), r.collection ? tr(r.collection, 'name') : ''],
    [t('finish'), tr(p.specs, 'finish')],
    [t('thickness'), p.specs?.thickness],
    [t('dimensions'), p.specs?.dimensions],
    [t('colour'), tr(p.specs, 'colour')],
    ...((p.specs_extra || []) as any[]).map((x) => [x[`label_${lang}`] || x.label_en, x[`value_${lang}`] || x.value_en]),
  ] as [string, string][]).filter(([, v]) => v);
  const features: string[] = p[`features_${lang}`] || p.features_en || [];
  const gallery = p.gallery.length ? p.gallery : p.cover ? [p.cover] : [];

  return (
    <div ref={ref}>
      <section className="wrap grid gap-10 pb-20 pt-28 sm:pt-32 lg:grid-cols-12 lg:gap-14">
        <button onClick={() => setLb(0)} className="pd-main relative aspect-[4/5] overflow-hidden bg-stone lg:col-span-7 lg:aspect-auto lg:h-[calc(100svh-9rem)]" data-cursor="view">
          <Picture img={p.cover} eager sizes="(min-width:1024px) 60vw, 100vw" />
        </button>
        <div className="flex flex-col justify-end lg:col-span-5 lg:pb-4">
          <nav className="pd-fade mb-10 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide2 text-taupe">
            <Link to={lp('/materials')} className="ulink">{t('materials')}</Link><span>/</span>
            {r.category && <><Link to={lp(`/materials/${r.category.slug}`)} className="ulink">{tr(r.category, 'name')}</Link><span>/</span></>}
            <span className="text-charcoal">{tr(p, 'name')}</span>
          </nav>
          <div className="pd-fade eyebrow mb-5 flex gap-3">
            {r.collection && <span>{tr(r.collection, 'name')}</span>}{r.brand && <span className="text-taupe">by {tr(r.brand, 'name')}</span>}
          </div>
          <RiseText as="h1" className="h-xl" trigger={false} delay={0.4}>{tr(p, 'name')}</RiseText>
          {tr(p, 'tagline') && <p className="pd-fade mt-6 font-display text-2xl font-light italic leading-snug text-brown">{tr(p, 'tagline')}</p>}
          <div className="pd-fade mt-6 flex flex-wrap gap-2">
            {p.exclusive && <span className="border border-bronze/50 px-3 py-1.5 text-[10px] uppercase tracking-wide2 text-bronze">{t('exclusive')}</span>}
            {/3d/i.test(p.specs?.finish_en || '') && <span className="border border-charcoal/20 px-3 py-1.5 text-[10px] uppercase tracking-wide2">{t('texture3d')}</span>}
          </div>
          <div className="pd-fade mt-10 flex flex-wrap gap-3">
            <button onClick={() => { track('cta_click', 'product_info'); open({ product: p, type: 'product' }); }} className="btn btn-dark group" data-cursor="enquire"><span>{t('requestInfo')}</span><span className="arrow">→</span></button>
            <button onClick={() => { track('cta_click', 'product_quote'); open({ product: p, type: 'quote' }); }} className="btn btn-line" data-cursor="enquire"><span>{t('requestQuote')}</span></button>
          </div>
        </div>
      </section>

      <section className="wrap grid gap-16 border-t border-charcoal/10 py-24 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="eyebrow mb-8">{t('overview')}</div>
          <FadeUp><p className="font-display text-[26px] font-light leading-[1.45] sm:text-[32px]">{tr(p, 'desc')}</p></FadeUp>
          {features.length > 0 && (
            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <FadeUp key={f} delay={i * 0.05}><li className="flex items-start gap-3 border-t border-charcoal/10 pt-4 text-sm"><span className="text-bronze">◆</span>{f}</li></FadeUp>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          {specs.length > 0 && (
            <>
              <div className="eyebrow mb-8">{t('specifications')}</div>
              <dl>
                {specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 border-t border-charcoal/10 py-4 text-sm"><dt className="text-warm">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </>
          )}
          {r.applications?.length > 0 && (
            <div className="mt-12">
              <div className="eyebrow mb-5">{t('usedIn')}</div>
              <div className="flex flex-wrap gap-2">
                {r.applications.map((a: Entry) => <Link key={a.id} to={lp(`/applications/${a.slug}`)} className="border border-charcoal/15 px-4 py-2 text-xs transition-colors hover:bg-charcoal hover:text-ivory">{tr(a, 'name')}</Link>)}
              </div>
            </div>
          )}
        </div>
      </section>

      {gallery.length > 1 && (
        <section className="bg-marble py-24">
          <div className="wrap">
            <div className="eyebrow mb-12">{t('gallery')}</div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
              {gallery.map((g, i) => (
                <button key={g.id} onClick={() => setLb(i)} className={`tile block text-left ${i % 3 === 0 ? 'lg:col-span-7' : i % 3 === 1 ? 'lg:col-span-5 lg:mt-24' : 'lg:col-span-6 lg:col-start-4'}`} data-cursor="view">
                  <Reveal variant={variantAt(i)} className={i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'}><Picture img={g} sizes="(min-width:1024px) 55vw, 100vw" /></Reveal>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {r.projects?.length > 0 && (
        <section className="wrap py-24">
          <div className="eyebrow mb-12">{t('relatedProjects')}</div>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {r.projects.map((x: Entry, i: number) => <Tile key={x.id} e={x} i={i} to={lp(`/projects/${x.slug}`)} cursor="view" />)}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-ink py-28 text-ivory" data-dark>
        <div className="wrap flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <h2 className="h-lg max-w-[14ch]">{t('enquireMaterial')}</h2>
          <button onClick={() => open({ product: p, type: 'quote' })} className="btn btn-light group" data-cursor="enquire"><span>{t('requestQuote')}</span><span className="arrow">→</span></button>
        </div>
      </section>

      {r.products?.length > 0 && (
        <section className="wrap py-28">
          <div className="eyebrow mb-12">{t('relatedMaterials')}</div>
          <ProductGrid items={r.products.slice(0, 3)} />
        </section>
      )}
      <Lightbox images={gallery} index={lb} onClose={() => setLb(null)} />
    </div>
  );
}
