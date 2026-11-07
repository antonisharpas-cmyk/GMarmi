import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite } from '../lib/site';
import { track } from '../lib/api';
import { PageHero, PageTitle, ProductGrid, Loading, useTitle } from '../components/ui';
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
      mk('brand', t('brand'), base.map((p) => { const b = s?.brands.find((x) => x.id === p.brand_id); return { value: b?.slug || '', label: b ? tr(b, 'name') : '' }; })),
      mk('colour', t('colour'), base.map((p) => ({ value: p.specs?.colour_en || '', label: tr(p.specs, 'colour') }))),
      mk('finish', t('finish'), base.map((p) => ({ value: p.specs?.finish_en || '', label: tr(p.specs, 'finish') }))),
      mk('application', t('applications'), apps.filter((a) => base.some((p) => (p.application_ids || []).includes(a.id))).map((a) => ({ value: a.slug, label: tr(a, 'name') }))),
      mk('thickness', t('thickness'), base.map((p) => ({ value: p.specs?.thickness || '', label: p.specs?.thickness || '' }))),
      mk('size', t('dimensions'), base.map((p) => ({ value: p.specs?.dimensions || '', label: p.specs?.dimensions || '' }))),
    ].filter(Boolean) as { key: string; label: string; options: { value: string; label: string }[] }[];
  }, [base, s, lang]);

  const filtered = base.filter((p) => {
    const f = (k: string) => sp.get(k);
    if (f('brand') && s?.brands.find((x) => x.id === p.brand_id)?.slug !== f('brand')) return false;
    if (f('colour') && p.specs?.colour_en !== f('colour')) return false;
    if (f('finish') && p.specs?.finish_en !== f('finish')) return false;
    if (f('thickness') && p.specs?.thickness !== f('thickness')) return false;
    if (f('size') && p.specs?.dimensions !== f('size')) return false;
    if (f('application')) { const a = s?.applications.find((x) => x.slug === f('application')); if (!a || !(p.application_ids || []).includes(a.id)) return false; }
    return true;
  });
  const setF = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  const active = facets.some((f) => sp.get(f.key));

  if (!s) return <Loading />;
  if (cat && !category) return <PageTitle title={t('notFound')} />;

  return (
    <>
      {category ? (
        <>
          <PageHero img={category.cover} eyebrow={t('materials')} title={tr(category, 'name')} intro={tr(category, 'desc')} />
          <SlabFormats formats={category.formats || []} custom={category.custom_sizes} />
        </>
      ) : (
        <PageTitle eyebrow={t('materials')} title={lang === 'el' ? 'Η συλλογή υλικών' : 'The material collection'} intro={tr(s.seo, 'desc')} />
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {facets.map((f) => (
              <div key={f.key}>
                <div className="label">{f.label}</div>
                <Select value={sp.get(f.key) || ''} onChange={(v) => setF(f.key, v)} options={[{ value: '', label: t('all') }, ...f.options]} placeholder={t('all')} />
              </div>
            ))}
          </div>
        )}
        <div className="mb-14 mt-6 flex items-center justify-between text-[11px] uppercase tracking-wide2 text-taupe">
          <span>{products ? filtered.length : ''} {t('results')}</span>
          {active && <button onClick={() => setSp(new URLSearchParams(), { replace: true })} className="ulink text-charcoal">{t('clear')}</button>}
        </div>

        {!products ? <Loading /> : filtered.length ? <ProductGrid items={filtered} /> : (
          <FadeUp className="max-w-xl border-t border-charcoal/10 py-16">
            <p className="font-display text-3xl font-light leading-snug">{base.length ? t('noResults') : t('comingSoon')}</p>
            <button onClick={() => open({ type: 'product' })} className="btn btn-dark mt-10" data-cursor="enquire"><span>{t('enquire')}</span></button>
          </FadeUp>
        )}
      </section>
    </>
  );
}
