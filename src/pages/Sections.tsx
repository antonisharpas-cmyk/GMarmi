import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite, productPath } from '../lib/site';
import { groupFormats, Slab, SizeLabel } from '../components/SlabFormats';
import { RiseText, FadeUp } from '../components/Reveal';
import { Loading, NotFoundBlock, PageHero, PageTitle, Tile, useTitle } from '../components/ui';
import { useEnquiry } from '../components/EnquiryDrawer';
import type { Entry } from '../lib/types';

const COPY = {
  en: ['Applications', 'See how our materials shape kitchens, bathrooms, walls and hospitality spaces.'],
  el: ['Εφαρμογές', 'Δείτε πώς τα υλικά μας διαμορφώνουν κουζίνες, μπάνια, τοίχους και χώρους φιλοξενίας.'],
};

export function ListPage() {
  const { t, tr, lp, lang } = useLang();
  const { data } = useApi<Entry[]>('/api/entries/application');
  const [title, intro] = COPY[lang];
  useTitle(title);
  const layouts = ['lg:col-span-7', 'lg:col-span-5 lg:mt-32', 'lg:col-span-5', 'lg:col-span-7 lg:mt-20'];
  return (
    <>
      <PageTitle eyebrow="G. M. Andreou Marmi" title={title} intro={intro} />
      <section className="wrap pb-32">
        {!data ? <Loading /> : data.length === 0 ? (
          <FadeUp className="max-w-2xl border-t border-charcoal/10 py-16">
            <p className="font-display text-3xl font-light leading-snug">{t('comingSoon')}</p>
            <div className="mt-10 flex gap-4"><Link to={lp('/materials')} className="btn btn-dark"><span>{t('materials')}</span></Link><Link to={lp('/contact')} className="btn btn-line"><span>{t('visitShowroom')}</span></Link></div>
          </FadeUp>
        ) : (
          <div className="grid gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-12">
            {data.map((e, i) => (
              <div key={e.id} className={layouts[i % layouts.length]}>
                <Tile e={e} i={i} to={lp(`/applications/${e.slug}`)} aspect={i % 4 === 0 || i % 4 === 3 ? 'aspect-[4/3]' : 'aspect-[4/5]'}
                  sub={String(i + 1).padStart(2, '0')} cursor="explore" />
                {tr(e, 'desc') && <p className="mt-3 max-w-md text-sm leading-relaxed text-warm">{tr(e, 'desc')}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/** Horizontal list that the mouse wheel scrolls sideways (the page does not move while it can still scroll) */
function HScroll({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = (ev: WheelEvent) => {
      if (Math.abs(ev.deltaY) <= Math.abs(ev.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = Math.min(max, Math.max(0, el.scrollLeft + ev.deltaY));
      if (next === el.scrollLeft) return;
      el.scrollLeft = next;
      ev.preventDefault();
    };
    el.addEventListener('wheel', on, { passive: false });
    return () => el.removeEventListener('wheel', on);
  }, []);
  return <ul ref={ref} className={className} data-lenis-prevent>{children}</ul>;
}

/** Category tile; on desktop hover a card shows its sizes and the colours available for this application */
function CategoryCard({ c, i }: { c: Entry; i: number }) {
  const { t, tr, lp } = useLang();
  const { open } = useEnquiry();
  const s = useSite();
  const formats: { t: string; w: number; l: number }[] = c.formats || [];
  const colours: Entry[] = c.colours || [];
  return (
    <div className="group/cat relative">
      <Tile e={c} i={i} to={lp(`/materials/${c.slug}`)} aspect="aspect-[4/3]" label={tr(c, 'kind') || undefined} />
      {(
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden translate-y-2 opacity-0 transition-all duration-500 ease-lux group-hover/cat:pointer-events-auto group-hover/cat:translate-y-0 group-hover/cat:opacity-100 md:block">
          <div className="max-h-[440px] overflow-y-auto border border-charcoal/10 bg-ivory p-6 shadow-[0_30px_70px_rgba(29,27,25,.18)]" data-lenis-prevent>
            {tr(c, 'kind') && <div className="eyebrow mb-2">{tr(c, 'kind')}</div>}
            <Link to={lp(`/materials/${c.slug}`)} className="font-display text-2xl">{tr(c, 'name')}</Link>
            <div className="eyebrow mb-2 mt-5">{t('formats')}</div>
            {formats.length ? (groupFormats(formats).length > 3 ? (
              /* many sizes (RAK, Porcelanato): one row that scrolls sideways, the mouse wheel moves it too */
              <div className="relative -mx-6">
                <HScroll className="slim-scroll flex gap-6 overflow-x-auto px-6 pb-3 text-[13px]">
                  {groupFormats(formats).map((f, k) => {
                    const max = Math.max(...formats.map((x) => Math.max(x.w, x.l)), 1);
                    return (
                      <li key={k} className="flex shrink-0 flex-col items-start gap-2">
                        <Slab w={f.w} l={f.l} t={Number(f.th[f.th.length - 1]) || 12} max={max} className="h-12 w-20" />
                        <SizeLabel w={f.w} l={f.l} th={f.th} />
                      </li>
                    );
                  })}
                </HScroll>
                <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ivory to-transparent" aria-hidden />
              </div>
            ) : (
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
            )) : <p className="text-sm text-warm">{t('customSizes')}</p>}
            {colours.length > 0 && (
              <>
                <div className="eyebrow mb-3 mt-6">{t('colours')}</div>
                <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                  {colours.map((p) => (
                    <Link key={p.id} to={lp(productPath({ ...p, category_id: c.id } as Entry, s?.categories))} className="group/sw block">
                      <div className="aspect-square overflow-hidden bg-stone">{p.cover && <img src={p.cover.sm} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/sw:scale-110" loading="lazy" />}</div>
                      <div className="mt-1.5 truncate text-[11px] leading-tight">{tr(p, 'name')}</div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            <button type="button" onClick={() => open({ type: 'product' })} className="ulink mt-6 text-[11px] font-medium uppercase tracking-wide2 text-bronze">{t('requestSample')} →</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DetailPage() {
  const { slug } = useParams();
  const { t, tr } = useLang();
  const { open } = useEnquiry();
  const s = useSite();
  const { data, error } = useApi<{ item: Entry; related: any }>(`/api/entries/application/${slug}`);
  const e = data?.item;
  useTitle(e ? tr(e, 'name') : undefined);
  if (error) return <NotFoundBlock />;
  if (!e || !s) return <Loading />;
  const r = data!.related;
  const gallery = e.gallery || [];
  return (
    <>
      <PageHero img={e.cover} imgs={[e.cover, ...gallery]} eyebrow={t('applications')} title={tr(e, 'name')} intro={tr(e, 'tagline') || tr(e, 'desc')} />

      {r.categories?.length > 0 && (
        <section className="wrap py-24 sm:py-32">
          <RiseText as="h2" className="h-md mb-14">{t('materialsFor')}</RiseText>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {r.categories.map((c: Entry, i: number) => <CategoryCard key={c.id} c={c} i={i} />)}
          </div>
          <button onClick={() => open({ type: 'product' })} className="btn btn-dark group mt-16" data-cursor="enquire"><span>{t('requestInfo')}</span><span className="arrow">→</span></button>
        </section>
      )}
    </>
  );
}
