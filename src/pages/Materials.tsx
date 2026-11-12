import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite } from '../lib/site';
import { track } from '../lib/api';
import { scrollLock } from '../lib/motion';
import { PageHero, PageTitle, Loading, useTitle } from '../components/ui';
import { MaterialRows } from '../components/Carousel';
import Select from '../components/Select';
import { FadeUp } from '../components/Reveal';
import { useEnquiry } from '../components/EnquiryDrawer';
import type { Entry } from '../lib/types';
import SlabFormats from '../components/SlabFormats';

export default function Materials() {
  const { cat } = useParams();
  const { t, tr, lp, lang } = useLang();
  const s = useSite();
  const { open } = useEnquiry();
  const { data: products } = useApi<Entry[]>('/api/entries/product');
  const [sp, setSp] = useSearchParams();
  const category = s?.categories.find((c) => c.slug === cat) || null;
  useTitle(category ? tr(category, 'name') : t('materials'));
  useEffect(() => { if (category) track('material_view', category.slug); }, [category?.slug]);

  const base = useMemo(() => (products || []).filter((p) => !category || p.category_id === category.id), [products, category]);

  // facets: only show filters that have real data and more than one value
  const facets = useMemo(() => {
    const mk = (key: string, label: string, values: { value: string; label: string }[]) => {
      const uniq = values.filter((v, i, a) => v.value && a.findIndex((x) => x.value === v.value) === i);
      return uniq.length > 1 ? { key, label, options: uniq } : null;
    };
    const apps = s?.applications || [];
    return [
      mk('application', t('applications'), apps.filter((a) => base.some((p) => (p.application_ids || []).includes(a.id))).map((a) => ({ value: a.slug, label: tr(a, 'name') }))),
      mk('colour', t('colour'), base.map((p) => ({ value: p.specs?.colour_en || '', label: tr(p.specs, 'colour') }))),
    ].filter(Boolean) as { key: string; label: string; options: { value: string; label: string }[] }[];
  }, [base, s, lang]);

  const filtered = base.filter((p) => {
    const f = (k: string) => sp.get(k);
    if (f('colour') && p.specs?.colour_en !== f('colour')) return false;
    if (f('application')) { const a = s?.applications.find((x) => x.slug === f('application')); if (!a || !(p.application_ids || []).includes(a.id)) return false; }
    return true;
  });
  const setF = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  const active = facets.filter((f) => sp.get(f.key)).length;
  // mobile: filters open in a sheet, chosen values apply only when the visitor taps Apply
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const openSheet = () => { setDraft(Object.fromEntries(facets.map((f) => [f.key, sp.get(f.key) || '']))); setSheet(true); };
  const applySheet = () => { const n = new URLSearchParams(sp); facets.forEach((f) => (draft[f.key] ? n.set(f.key, draft[f.key]) : n.delete(f.key))); setSp(n, { replace: true }); setSheet(false); };
  useEffect(() => { scrollLock(sheet); return () => scrollLock(false); }, [sheet]);
  // in "All", materials are grouped by category, in the category order
  const groups = useMemo(() => {
    if (category || !s) return [];
    const g = s.categories.map((c) => ({ c, items: filtered.filter((p) => p.category_id === c.id) })).filter((x) => x.items.length);
    const rest = filtered.filter((p) => !s.categories.some((c) => c.id === p.category_id));
    return rest.length ? [...g, { c: null as Entry | null, items: rest }] : g;
  }, [filtered, category, s]);

  if (!s) return <Loading />;
  if (cat && !category) return <PageTitle title={t('notFound')} />;

  return (
    <>
      {category ? (
        <>
          <PageHero img={category.cover} imgs={[category.cover, ...(category.gallery || [])]} eyebrow={t('materials')} title={tr(category, 'name')} intro={tr(category, 'desc')} />
          <SlabFormats formats={category.formats || []} custom={category.custom_sizes} />
        </>
      ) : (
        <PageHero imgs={s.categories.map((c) => c.cover)} eyebrow={t('materials')} title={lang === 'el' ? 'Η συλλογή υλικών' : 'The material collection'} intro={tr(s.seo, 'desc')} />
      )}

      <section className="wrap pb-32 pt-14">
        {/* category tabs */}
        <div className="no-scrollbar -mx-5 flex gap-8 overflow-x-auto border-b border-charcoal/10 px-5 sm:mx-0 sm:px-0">
          {[{ slug: '', name: t('all') }, ...s.categories.map((c) => ({ slug: c.slug, name: tr(c, 'name') }))].map((c) => {
            const on = (cat || '') === c.slug;
            return (
              <Link key={c.slug || 'all'} to={lp(c.slug ? `/materials/${c.slug}` : '/materials')} className={`relative shrink-0 pb-4 text-[11px] font-medium uppercase tracking-wide2 ${on ? 'text-charcoal' : 'text-taupe hover:text-charcoal'}`}>
                {c.name}
                <span className={`absolute inset-x-0 -bottom-px h-px bg-charcoal transition-transform duration-500 ${on ? 'scale-x-100' : 'scale-x-0'}`} />
              </Link>
            );
          })}
        </div>

        {facets.length > 0 && (
          <div className="mt-8 hidden max-w-3xl gap-6 md:grid md:grid-cols-2">
            {facets.map((f) => (
              <div key={f.key}>
                <div className="label">{f.label}</div>
                <Select value={sp.get(f.key) || ''} onChange={(v) => setF(f.key, v)} options={[{ value: '', label: t('all') }, ...f.options]} placeholder={t('all')} />
              </div>
            ))}
          </div>
        )}
        <div className="mb-14 mt-6 flex items-center justify-between gap-4 text-[11px] uppercase tracking-wide2 text-taupe">
          {facets.length > 0 && (
            <button onClick={openSheet} className="flex items-center gap-2 border border-charcoal/20 px-4 py-2.5 text-charcoal md:hidden">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              {t('filters')}{active ? <span className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-bronze text-[9px] text-ivory">{active}</span> : null}
            </button>
          )}
          <span className="ml-auto md:ml-0">{products ? filtered.length : ''} {t('results')}</span>
          {active > 0 && <button onClick={() => setSp(new URLSearchParams(), { replace: true })} className="ulink hidden text-charcoal md:inline">{t('clear')}</button>}
        </div>

        {/* mobile filter sheet */}
        <div className={`fixed inset-0 z-[90] md:hidden ${sheet ? '' : 'pointer-events-none'}`} aria-hidden={!sheet}>
          <div onClick={() => setSheet(false)} className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${sheet ? 'opacity-100' : 'opacity-0'}`} />
          <div role="dialog" aria-modal="true" aria-label={t('filters')}
            className={`absolute inset-x-0 bottom-0 flex max-h-[85svh] flex-col bg-ivory transition-transform duration-500 ease-lux ${sheet ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
              <span className="text-[11px] font-medium uppercase tracking-wide2">{t('filters')}</span>
              <button onClick={() => setSheet(false)} aria-label={t('close')} className="grid h-9 w-9 place-items-center text-xl leading-none">×</button>
            </div>
            <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6" data-lenis-prevent>
              {facets.map((f) => (
                <div key={f.key}>
                  <div className="label mb-3">{f.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {[{ value: '', label: t('all') }, ...f.options].map((o) => {
                      const on = (draft[f.key] || '') === o.value;
                      return <button key={o.value || 'all'} onClick={() => setDraft((d) => ({ ...d, [f.key]: o.value }))}
                        className={`border px-4 py-2 text-[13px] transition-colors ${on ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/15 text-charcoal'}`}>{o.label}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 border-t border-charcoal/10 px-5 py-4">
              <button onClick={() => setDraft({})} className="btn btn-line flex-1 justify-center"><span>{t('clear')}</span></button>
              <button onClick={applySheet} className="btn btn-dark flex-1 justify-center"><span>{t('apply')}</span></button>
            </div>
          </div>
        </div>

        {!products ? <Loading /> : filtered.length ? (category ? <MaterialRows items={filtered} /> : (
          <div className="space-y-24">
            {groups.map(({ c, items }) => (
              <div key={c?.id || 'other'}>
                <div className="mb-10 flex items-end justify-between gap-6 border-b border-charcoal/10 pb-5">
                  <div>
                    {c && tr(c, 'kind') && <div className="eyebrow mb-2">{tr(c, 'kind')}</div>}
                    <h2 className="font-display text-3xl font-light sm:text-4xl">{c ? tr(c, 'name') : t('materials')}</h2>
                  </div>
                  {c && <Link to={lp(`/materials/${c.slug}`)} className="ulink shrink-0 text-[11px] uppercase tracking-wide2">{t('viewAll')} →</Link>}
                </div>
                <MaterialRows items={items} />
              </div>
            ))}
          </div>
        )) : (
          <FadeUp className="max-w-xl border-t border-charcoal/10 py-16">
            <p className="font-display text-3xl font-light leading-snug">{base.length ? t('noResults') : t('comingSoon')}</p>
            <button onClick={() => open({ type: 'product' })} className="btn btn-dark mt-10" data-cursor="enquire"><span>{t('enquire')}</span></button>
          </FadeUp>
        )}
      </section>
    </>
  );
}
