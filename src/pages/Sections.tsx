import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite, productPath } from '../lib/site';
import { groupFormats, Slab, SizeLabel } from '../components/SlabFormats';
import { Picture, Reveal, RiseText, FadeUp } from '../components/Reveal';
import { Lightbox, Loading, NotFoundBlock, PageHero, PageTitle, ProductGrid, Tile, useTitle, variantAt } from '../components/ui';
import { useEnquiry } from '../components/EnquiryDrawer';
import type { Entry } from '../lib/types';

type Kind = 'collection' | 'application' | 'project';
const PATH: Record<Kind, string> = { collection: '/collections', application: '/applications', project: '/projects' };

const COPY = {
  collection: { en: ['Collections', 'Curated families of surfaces, each with its own character.'], el: ['Συλλογές', 'Επιλεγμένες οικογένειες επιφανειών, η καθεμία με τον δικό της χαρακτήρα.'] },
  application: { en: ['Applications', 'See how our materials shape kitchens, bathrooms, walls and hospitality spaces.'], el: ['Εφαρμογές', 'Δείτε πώς τα υλικά μας διαμορφώνουν κουζίνες, μπάνια, τοίχους και χώρους φιλοξενίας.'] },
  project: { en: ['Projects', 'Spaces brought to life with our materials.'], el: ['Έργα', 'Χώροι που ζωντάνεψαν με τα υλικά μας.'] },
};

export function ListPage({ kind }: { kind: Kind }) {
  const { t, tr, lp, lang } = useLang();
  const { data } = useApi<Entry[]>(`/api/entries/${kind}`);
  const [title, intro] = COPY[kind][lang];
  useTitle(title);
  const layouts = ['lg:col-span-7', 'lg:col-span-5 lg:mt-32', 'lg:col-span-5', 'lg:col-span-7 lg:mt-20'];
  return (
    <>
      <PageTitle eyebrow="G. M. Andreou Marmi" title={title} intro={intro} />
      <section className="wrap pb-32">
        {!data ? <Loading /> : data.length === 0 ? (
          <FadeUp className="max-w-2xl border-t border-charcoal/10 py-16">
            <p className="font-display text-3xl font-light leading-snug">{kind === 'project' ? t('projectsSoon') : t('comingSoon')}</p>
            <div className="mt-10 flex gap-4"><Link to={lp('/materials')} className="btn btn-dark"><span>{t('materials')}</span></Link><Link to={lp('/contact')} className="btn btn-line"><span>{t('visitShowroom')}</span></Link></div>
          </FadeUp>
        ) : (
          <div className="grid gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-12">
            {data.map((e, i) => (
              <div key={e.id} className={layouts[i % layouts.length]}>
                <Tile e={e} i={i} to={lp(`${PATH[kind]}/${e.slug}`)} aspect={i % 4 === 0 || i % 4 === 3 ? 'aspect-[4/3]' : 'aspect-[4/5]'}
                  sub={kind === 'project' ? [tr(e, 'location'), tr(e, 'category')].filter(Boolean).join(' · ') : String(i + 1).padStart(2, '0')}
                  cursor={kind === 'project' ? 'view' : 'explore'} />
                {kind !== 'project' && tr(e, 'desc') && <p className="mt-3 max-w-md text-sm leading-relaxed text-warm">{tr(e, 'desc')}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/** Category tile; on desktop hover a card shows its sizes and the colours available for this application */
function CategoryCard({ c, i }: { c: Entry; i: number }) {
  const { t, tr, lp } = useLang();
  const s = useSite();
  const formats: { t: string; w: number; l: number }[] = c.formats || [];
  const colours: Entry[] = c.colours || [];
  return (
    <div className="group/cat relative">
      <Tile e={c} i={i} to={lp(`/materials/${c.slug}`)} aspect="aspect-[4/3]" />
      {(formats.length > 0 || colours.length > 0 || c.custom_sizes) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden translate-y-2 opacity-0 transition-all duration-500 ease-lux group-hover/cat:pointer-events-auto group-hover/cat:translate-y-0 group-hover/cat:opacity-100 md:block">
          <div className="max-h-[440px] overflow-y-auto border border-charcoal/10 bg-ivory p-6 shadow-[0_30px_70px_rgba(29,27,25,.18)]" data-lenis-prevent>
            <Link to={lp(`/materials/${c.slug}`)} className="font-display text-2xl">{tr(c, 'name')}</Link>
            <div className="eyebrow mb-2 mt-5">{t('formats')}</div>
            {formats.length ? (
              <ul className="space-y-3 text-sm">
                {groupFormats(formats).map((f, k) => {
                  const max = Math.max(...formats.map((x) => Math.max(x.w, x.l)), 1);
                  return (
                    <li key={k} className="flex items-center gap-4">
                      <Slab w={f.w} l={f.l} t={Number(f.th[f.th.length - 1]) || 12} max={max} className="h-12 w-20 shrink-0" />
                      <SizeLabel w={f.w} l={f.l} th={f.th} />
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-warm">{t('customSizes')}</p>}
            {colours.length > 0 && (
              <>
                <div className="eyebrow mb-3 mt-6">{t('colours')}</div>
                <div className="grid grid-cols-3 gap-3">
                  {colours.map((p) => (
                    <Link key={p.id} to={lp(productPath({ ...p, category_id: c.id } as Entry, s?.categories))} className="block">
                      <div className="aspect-square overflow-hidden bg-stone">{p.cover && <img src={p.cover.sm} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
                      <div className="mt-1.5 truncate text-[11px]">{tr(p, 'name')}</div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DetailPage({ kind }: { kind: Kind }) {
  const { slug } = useParams();
  const { t, tr, lp } = useLang();
  const { open } = useEnquiry();
  const s = useSite();
  const { data, error } = useApi<{ item: Entry; related: any }>(`/api/entries/${kind}/${slug}`);
  const [lb, setLb] = useState<number | null>(null);
  const e = data?.item;
  useTitle(e ? tr(e, 'name') : undefined);
  if (error) return <NotFoundBlock />;
  if (!e || !s) return <Loading />;
  const r = data!.related;
  const gallery = e.gallery || [];
  const eyebrow = kind === 'project' ? [tr(e, 'location'), tr(e, 'category')].filter(Boolean).join(' · ') : t(kind === 'collection' ? 'collection' : 'applications');
  return (
    <>
      <PageHero img={e.cover} eyebrow={eyebrow} title={tr(e, 'name')} intro={tr(e, 'tagline') || tr(e, 'desc')} />

      {kind !== 'application' && <section className="wrap grid gap-14 py-24 sm:py-32 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="eyebrow">{t('overview')}</div>
          {r.brand && <div className="mt-6 text-sm text-warm">{t('brand')}: <span className="text-charcoal">{tr(r.brand, 'name')}</span></div>}
          {kind === 'project' && tr(e, 'location') && <div className="mt-3 text-sm text-warm">{t('location')}: <span className="text-charcoal">{tr(e, 'location')}</span></div>}
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <FadeUp><p className="font-display text-[26px] font-light leading-[1.45] sm:text-[34px]">{tr(e, 'desc')}</p></FadeUp>
          {tr(e, 'body') && <FadeUp delay={0.1} className="prose-gm mt-10"><p>{tr(e, 'body')}</p></FadeUp>}
          {r.applications?.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {r.applications.map((a: Entry) => <Link key={a.id} to={lp(`/applications/${a.slug}`)} className="border border-charcoal/15 px-4 py-2 text-xs transition-colors hover:bg-charcoal hover:text-ivory">{tr(a, 'name')}</Link>)}
            </div>
          )}
          <button onClick={() => open({ type: kind === 'project' ? 'project' : 'product' })} className="btn btn-dark group mt-12" data-cursor="enquire">
            <span>{kind === 'project' ? t('enquireMaterial') : t('requestInfo')}</span><span className="arrow">→</span>
          </button>
        </div>
      </section>}

      {gallery.length > 1 && (
        <section className="bg-marble py-24 sm:py-32">
          <div className="wrap grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
            {gallery.map((g, i) => (
              <button key={g.id} onClick={() => setLb(i)} data-cursor="view"
                className={`tile block ${['lg:col-span-8', 'lg:col-span-4 lg:mt-32', 'lg:col-span-5', 'lg:col-span-7 lg:-mt-16'][i % 4]}`}>
                <Reveal variant={variantAt(i)} className={i % 4 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'}><Picture img={g} sizes="(min-width:1024px) 60vw, 100vw" /></Reveal>
              </button>
            ))}
          </div>
        </section>
      )}

      {r.categories?.length > 0 && (
        <section className="wrap py-24 sm:py-32">
          <RiseText as="h2" className="h-md mb-14">{t('materialsFor')}</RiseText>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {r.categories.map((c: Entry, i: number) => <CategoryCard key={c.id} c={c} i={i} />)}
          </div>
          <button onClick={() => open({ type: 'product' })} className="btn btn-dark group mt-16" data-cursor="enquire"><span>{t('requestInfo')}</span><span className="arrow">→</span></button>
        </section>
      )}
      {kind !== 'application' && r.products?.length > 0 && (
        <section className="wrap py-24 sm:py-32">
          <div className="mb-14 flex items-end justify-between">
            <RiseText as="h2" className="h-md">{kind === 'project' ? t('materialsUsed') : t('materials')}</RiseText>
          </div>
          <ProductGrid items={r.products} />
        </section>
      )}
      {r.collections?.length > 0 && (
        <section className="wrap pb-24">
          <div className="eyebrow mb-10">{t('collections')}</div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{r.collections.map((c: Entry, i: number) => <Tile key={c.id} e={c} i={i} to={lp(`/collections/${c.slug}`)} />)}</div>
        </section>
      )}
      {r.projects?.length > 0 && (
        <section className="wrap pb-24">
          <div className="eyebrow mb-10">{t('relatedProjects')}</div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{r.projects.map((c: Entry, i: number) => <Tile key={c.id} e={c} i={i} to={lp(`/projects/${c.slug}`)} cursor="view" />)}</div>
        </section>
      )}
      <Lightbox images={gallery} index={lb} onClose={() => setLb(null)} />
    </>
  );
}
