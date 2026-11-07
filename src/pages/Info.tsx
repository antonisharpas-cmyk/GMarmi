import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite } from '../lib/site';
import { track } from '../lib/api';
import { Picture, Reveal, RiseText, FadeUp } from '../components/Reveal';
import { Loading, PageHero, PageTitle, useTitle } from '../components/ui';
import EnquiryForm from '../components/EnquiryForm';
import { IconFacebook, IconInstagram, IconLinkedin } from '../components/Header';
import type { Entry } from '../lib/types';

export function About() {
  const s = useSite();
  const { t, tr } = useLang();
  useTitle(t('about'));
  if (!s) return <Loading />;
  const a = s.about;
  const paras = (tr(a, 'body') || '').split(/\n\n+/).filter(Boolean);
  return (
    <>
      <PageHero img={a.image} eyebrow={t('about')} title={tr(a, 'title')} />
      <section className="wrap grid gap-14 py-28 sm:py-40 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {a.since && <FadeUp className="mb-8 flex items-baseline gap-4"><span className="eyebrow">{t('since')}</span><span className="display text-6xl text-bronze sm:text-7xl">{a.since}</span></FadeUp>}
          <FadeUp><p className="font-display text-[28px] font-light leading-[1.4] sm:text-[40px]">{tr(a, 'intro')}</p></FadeUp>
          <div className="prose-gm mt-14 max-w-2xl">{paras.map((p, i) => <FadeUp key={i} delay={i * 0.05}><p>{p}</p></FadeUp>)}</div>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal variant="right" className="aspect-[3/4]"><Picture img={a.image_2} /></Reveal>
        </div>
      </section>
      {tr(a, 'founder_name') && (
        <section className="relative overflow-hidden bg-ink py-28 text-ivory sm:py-40" data-dark>
          <div className="wrap grid gap-14 lg:grid-cols-12">
            <div className={a.founder_image ? 'lg:col-span-4' : 'hidden'}>
              {a.founder_image && <Reveal variant="left" className="aspect-[3/4]"><Picture img={a.founder_image} /></Reveal>}
            </div>
            <div className={a.founder_image ? 'lg:col-span-7 lg:col-start-6' : 'lg:col-span-10'}>
              <div className="eyebrow mb-8 text-sand">{t('founder')}</div>
              {tr(a, 'founder_quote') && <FadeUp><blockquote className="font-display text-[30px] font-light italic leading-[1.35] sm:text-[44px]">“{tr(a, 'founder_quote')}”</blockquote></FadeUp>}
              <FadeUp delay={0.1} className="mt-10">
                <div className="caps text-xl">{tr(a, 'founder_name')}</div>
                <div className="mt-1 text-sm text-ivory/60">{tr(a, 'founder_role')}</div>
              </FadeUp>
              {tr(a, 'founder_bio') && <FadeUp delay={0.15}><p className="mt-10 max-w-2xl leading-[1.85] text-ivory/70">{tr(a, 'founder_bio')}</p></FadeUp>}
            </div>
          </div>
        </section>
      )}
      {s.brands.length > 0 && (
        <section className="wrap py-28">
          <div className="eyebrow mb-10">{t('partners')}</div>
          <div className="grid gap-px bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-3">
            {s.brands.map((b) => {
              const inner = (<>{b.cover ? <img src={b.cover.md} alt={tr(b, 'name')} className="mb-5 h-14 w-auto max-w-[180px] object-contain" loading="lazy" /> : null}<div className="caps text-2xl">{tr(b, 'name')}</div>{tr(b, 'desc') && <p className="mt-3 text-sm leading-relaxed text-warm">{tr(b, 'desc')}</p>}</>);
              // partners are shown without links, so visitors stay on the website
              return <div key={b.id} className="bg-ivory p-8">{inner}</div>;
            })}
          </div>
        </section>
      )}
    </>
  );
}

export function Group() {
  const s = useSite();
  const { t, tr } = useLang();
  useTitle(t('group'));
  if (!s) return <Loading />;
  const links = ((s.site.group_companies || []) as { name: string; url: string }[]).filter((c) => c.name && c.url);
  return (
    <>
      <PageTitle eyebrow={t('group')} title={t('groupTitle')} />
      <section className="wrap pb-32">
        <FadeUp><p className="max-w-3xl font-display text-[26px] font-light leading-[1.5] sm:text-[34px]">{tr(s.site, 'group_text')}</p></FadeUp>
        {links.length > 0 && (
          <div className="mt-14 flex flex-wrap gap-4">
            {links.map((c) => <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="btn btn-line group"><span>{c.name}</span><span className="arrow">↗</span></a>)}
          </div>
        )}
      </section>
    </>
  );
}

export function Contact() {
  const s = useSite();
  const { t, tr, lang } = useLang();
  useTitle(t('contact'));
  if (!s) return <Loading />;
  const site = s.site;
  const map = `https://www.google.com/maps?q=${encodeURIComponent(site.map_query || site.address_en)}&output=embed`;
  return (
    <>
      <PageHero short img={site.contact_image || s.home.cta_image} eyebrow={t('contact')} title={lang === 'el' ? 'Ας μιλήσουμε για τον χώρο σας' : 'Let us talk about your space'} />
      <section className="wrap grid gap-20 pb-28 pt-20 sm:pt-28 lg:grid-cols-12">
        <div className="order-2 space-y-10 lg:order-1 lg:col-span-4">
          <div><div className="label">{t('address')}</div><p className="mt-2 leading-relaxed">{tr(site, 'address')}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.map_query || site.address_en)}`} target="_blank" rel="noreferrer" className="ulink mt-3 inline-block text-[11px] uppercase tracking-wide2 text-bronze">{t('directions')} →</a></div>
          <div><div className="label">{t('phone')}</div><a href={`tel:${site.phone_raw || site.phone}`} onClick={() => track('phone_click', 'contact')} className="mt-2 block font-display text-3xl">{site.phone}</a></div>
          <div><div className="label">{t('email')}</div><a href={`mailto:${site.email}`} onClick={() => track('email_click', 'contact')} className="ulink mt-2 inline-block text-lg">{site.email}</a></div>
          {tr(site, 'hours') && <div><div className="label">{t('hours')}</div><p className="mt-2 whitespace-pre-line leading-relaxed">{tr(site, 'hours')}</p></div>}
          <div><div className="label">{t('follow')}</div>
            <div className="mt-3 flex gap-5 text-warm">
              {site.instagram && <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-charcoal"><IconInstagram className="h-5 w-5" /></a>}
              {site.facebook && <a href={site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-charcoal"><IconFacebook className="h-5 w-5" /></a>}
              {site.linkedin && <a href={site.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-charcoal"><IconLinkedin className="h-5 w-5" /></a>}
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6"><EnquiryForm /></div>
      </section>
      <ContactFaq />
      <section className="relative h-[60vh] min-h-[380px] bg-stone">
        <iframe title="Map" src={map} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </section>
    </>
  );
}

function FaqItem({ f, open, onToggle }: { f: Entry; open: boolean; onToggle: () => void }) {
  const { lang } = useLang();
  return (
    <div className="border-t border-charcoal/10">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-6 py-6 text-left" aria-expanded={open}>
        <span className="font-display text-2xl font-light">{f[`q_${lang}`] || f.q_en}</span>
        <span className={`text-xl transition-transform duration-500 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-700 ease-lux ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><p className="max-w-2xl pb-8 leading-[1.8] text-warm">{f[`a_${lang}`] || f.a_en}</p></div>
      </div>
    </div>
  );
}

// Short FAQ block on the Contact page, above the map
function ContactFaq() {
  const { t, lp } = useLang();
  const { data } = useApi<Entry[]>('/api/entries/faq');
  const [open, setOpen] = useState<number | null>(null);
  if (!data?.length) return null;
  return (
    <section className="bg-marble py-24 sm:py-32">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="eyebrow mb-6">{t('faq')}</div>
          <RiseText as="h2" className="h-md max-w-[12ch]">{t('faqTitle')}</RiseText>
          {<Link to={lp('/faq')} className="group ulink mt-10 inline-block text-[11px] font-medium uppercase tracking-wide3">{t('viewAll')} <span className="arrow">→</span></Link>}
        </div>
        <div className="border-b border-charcoal/10 lg:col-span-7 lg:col-start-6">
          {data.slice(0, 5).map((f) => <FaqItem key={f.id} f={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />)}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { t, tr } = useLang();
  const { data } = useApi<Entry[]>('/api/entries/faq');
  const [open, setOpen] = useState<number | null>(0);
  useTitle(t('faq'));
  const cats = [...new Set((data || []).map((f) => f.category || 'general'))];
  return (
    <>
      <PageTitle eyebrow={t('faq')} title={t('faqTitle')} />
      <section className="wrap max-w-4xl pb-32">
        {!data ? <Loading /> : cats.map((c) => (
          <div key={c} className="mb-16">
            <div className="eyebrow mb-6">{t(`fq_${c}` as any) || c}</div>
            {data.filter((f) => (f.category || 'general') === c).map((f) => (
              <FaqItem key={f.id} f={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
            ))}
          </div>
        ))}
        <span className="hidden">{tr({}, 'x')}</span>
      </section>
    </>
  );
}

export function Legal({ k }: { k: 'privacy' | 'cookies' | 'terms' }) {
  const { t, lang } = useLang();
  const { data } = useApi<{ en: string; el: string }>(`/api/legal/${k}`);
  const title = t(k === 'privacy' ? 'privacy' : k === 'cookies' ? 'cookies' : 'terms');
  useTitle(title);
  return (
    <>
      <PageTitle eyebrow={t('legal')} title={title} />
      <section className="wrap max-w-3xl pb-32">
        {!data ? <Loading /> : <div className="prose-gm">{(data[lang] || data.en).split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>}
      </section>
    </>
  );
}

// Hidden "link in bio" page for Instagram and Facebook
export function LinkPage() {
  const s = useSite();
  const { t, tr, lp } = useLang();
  if (!s) return <Loading />;
  const links: [string, string, boolean?][] = [
    [lp('/materials'), t('materials')], [lp('/applications'), t('applications')],
    [lp('/contact'), t('contact')], [`tel:${s.site.phone_raw}`, `${t('phone')} · ${s.site.phone}`, true], [`mailto:${s.site.email}`, s.site.email, true],
  ];
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-6 py-20 text-ivory" data-dark>
      <div className="absolute inset-0 opacity-40"><Picture img={s.home.hero_image} eager /></div>
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative w-full max-w-sm text-center">
        <img src="/brand/logo-light.png" alt="G. M. Andreou Marmi Ltd" className="mx-auto w-48" />
        <p className="mt-6 font-display text-2xl font-light">{tr(s.site, 'footer')}</p>
        <div className="mt-10 space-y-3">
          {links.map(([href, label, ext]) => ext
            ? <a key={href} href={href} className="block border border-ivory/30 py-4 text-[11px] uppercase tracking-wide2 transition-colors hover:bg-ivory hover:text-charcoal">{label}</a>
            : <Link key={href} to={href} className="block border border-ivory/30 py-4 text-[11px] uppercase tracking-wide2 transition-colors hover:bg-ivory hover:text-charcoal">{label}</Link>)}
        </div>
        <div className="mt-10 flex justify-center gap-6 text-ivory/70">
          {s.site.instagram && <a href={s.site.instagram} aria-label="Instagram"><IconInstagram className="h-5 w-5" /></a>}
          {s.site.facebook && <a href={s.site.facebook} aria-label="Facebook"><IconFacebook className="h-5 w-5" /></a>}
        </div>
        <RiseText as="span" className="sr-only">G. M. Andreou Marmi</RiseText>
      </div>
    </section>
  );
}
