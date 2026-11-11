import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useApi, useSite } from '../lib/site';
import { track } from '../lib/api';
import { EASE, gsap, reduced } from '../lib/motion';
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
  const companies = ((s.site.group_companies || []) as { name: string; url: string }[]).filter((c) => c.name);
  return (
    <>
      <PageHero short img={s.site.group_image || s.home.cta_image} eyebrow={t('group')} title={t('groupTitle')} />
      <section className="wrap pb-32 pt-20 sm:pt-28">
        <FadeUp><p className="max-w-3xl font-display text-[26px] font-light leading-[1.5] sm:text-[34px]">{tr(s.site, 'group_text')}</p></FadeUp>
        {companies.length > 0 && <GroupList items={companies} />}
      </section>
    </>
  );
}

/** Group companies as an animated, numbered list. Rows draw in on scroll; those with a website open it. */
function GroupList({ items }: { items: { name: string; url: string }[] }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-row]').forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } });
        tl.from(row.querySelector('[data-line]'), { scaleX: 0, duration: 1.2, ease: EASE })
          .from(row.querySelector('[data-num]'), { opacity: 0, y: 12, duration: 0.8, ease: EASE }, 0.15)
          .from(row.querySelector('[data-name]'), { yPercent: 110, duration: 1.1, ease: EASE }, 0.2)
          .from(row.querySelector('[data-end]'), { opacity: 0, x: -12, duration: 0.8, ease: EASE }, 0.45);
      });
    }, ref);
    return () => ctx.revert();
  }, [items.length]);
  return (
    <div ref={ref} className="mt-24">
      <div className="eyebrow mb-8 flex items-center justify-between"><span>{t('groupCompanies')}</span><span className="text-taupe">{String(items.length).padStart(2, '0')}</span></div>
      <ul>
        {items.map((c, i) => {
          const inner = (
            <>
              <span data-line className="absolute inset-x-0 top-0 h-px origin-left bg-charcoal/15" />
              <span className="absolute inset-0 origin-left scale-x-0 bg-charcoal transition-transform duration-700 ease-lux group-hover:scale-x-100" aria-hidden />
              <span data-num className="relative w-12 shrink-0 font-caps text-xs tracking-wide2 text-bronze transition-colors duration-500 sm:w-20">{String(i + 1).padStart(2, '0')}</span>
              <span className="relative flex-1 overflow-hidden py-1">
                <span data-name className="block"><span className="block font-display text-[26px] font-light leading-tight transition-[transform,color] duration-700 ease-lux group-hover:translate-x-3 group-hover:text-ivory sm:text-[40px]">{c.name}</span></span>
              </span>
              <span data-end className="relative shrink-0">
                {c.url
                  ? <span className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide2 transition-colors duration-500 group-hover:text-ivory"><span className="hidden sm:inline">{t('visitSite')}</span><span className="inline-block transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">↗</span></span>
                  : <span className="block h-2.5 w-2.5 rotate-45 border border-taupe transition-all duration-700 ease-lux group-hover:rotate-[225deg] group-hover:border-sand group-hover:bg-sand" />}
              </span>
            </>
          );
          const cls = 'group relative flex items-center gap-4 overflow-hidden px-2 py-7 sm:gap-8 sm:px-4 sm:py-9';
          return (
            <li key={c.name} data-row className="relative">
              {c.url
                ? <a href={c.url} target="_blank" rel="noreferrer" className={cls} data-cursor="link">{inner}</a>
                : <div className={cls}>{inner}</div>}
            </li>
          );
        })}
        <li className="h-px bg-charcoal/15" aria-hidden />
      </ul>
    </div>
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
const LI = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  apps: <><rect x="3" y="3" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" /></>,
  fb: <><circle cx="12" cy="12" r="9" /><path d="M13.5 21v-7h2.5l.5-3h-3V9.5c0-.9.4-1.5 1.6-1.5H16.5V5.4c-.4-.1-1.3-.2-2.3-.2-2.3 0-3.7 1.4-3.7 3.9V11H8v3h2.5v7" /></>,
  ig: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></>,
  phone: <path d="M5 4h3l1.5 4.5-2 1.2a11 11 0 0 0 6.8 6.8l1.2-2L20 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  pin: <><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
};
const LIcon = ({ k }: { k: keyof typeof LI }) => <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-sand" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{LI[k]}</svg>;

export function LinkPage() {
  const s = useSite();
  const { tr, lp, lang } = useLang();
  if (!s) return <Loading />;
  const el = lang === 'el';
  const site = s.site;
  const items: { k: keyof typeof LI; label: string; to?: string; href?: string; main?: boolean }[] = [
    { k: 'home', label: el ? 'Επισκεφθείτε την ιστοσελίδα' : 'Visit our website', to: lp('/') },
    { k: 'apps', label: el ? 'Εφαρμογές' : 'Applications', to: lp('/applications') },
    ...(site.facebook ? [{ k: 'fb' as const, label: 'Facebook', href: site.facebook }] : []),
    ...(site.instagram ? [{ k: 'ig' as const, label: 'Instagram', href: site.instagram }] : []),
    ...(site.phone ? [{ k: 'phone' as const, label: el ? 'Καλέστε μας' : 'Call us', href: `tel:${site.phone_raw || site.phone}`, main: true }] : []),
    ...(site.email ? [{ k: 'mail' as const, label: el ? 'Στείλτε μας email' : 'Email us', href: `mailto:${site.email}` }] : []),
  ];
  const cls = (main?: boolean) => `flex w-full items-center justify-center gap-3 rounded-full py-4 text-[12px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${main
    ? 'bg-bronze text-ivory hover:bg-sand hover:text-ink'
    : 'border border-ivory/20 text-ivory hover:border-sand/70 hover:bg-ivory/[0.04]'}`;
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-5 py-14 text-ivory" data-dark>
      <div className="absolute inset-0 opacity-40"><Picture img={s.home.hero_image} eager /></div>
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative w-full max-w-[560px] text-center">
        <img src="/brand/logo-light.png" alt="G. M. Andreou Marmi Ltd" className="mx-auto w-44" />
        <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.35em] text-sand/80">{el ? 'Μάρμαρα · Γρανίτες · Επιφάνειες' : 'Marble · Granite · Surfaces'}</div>
        <p className="mt-5 font-display text-2xl font-light text-ivory/90">{tr(site, 'footer')}</p>
        <div className="mt-9 space-y-3">
          {items.map((it) => it.to
            ? <Link key={it.label} to={it.to} className={cls(it.main)}><LIcon k={it.k} />{it.label}</Link>
            : <a key={it.label} href={it.href} target={it.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls(it.main)}><LIcon k={it.k} />{it.label}</a>)}
        </div>
        {tr(site, 'address') && (
          <div className="mt-9 flex flex-col items-center gap-2 text-[12px] uppercase leading-relaxed tracking-[0.18em] text-ivory/55">
            <LIcon k="pin" />
            <span className="max-w-sm">{tr(site, 'address')}</span>
          </div>
        )}
        <a href="https://www.ergonsite.com" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-[12px] text-ivory/45 hover:text-ivory/80">
          {el ? 'Ανάπτυξη & σχεδιασμός από' : 'Developed & designed by'}
          <img src="https://ergonsite.com/assets/logo.png" alt="ErgonSite" className="h-5 w-auto opacity-80" onError={(e) => { const i = e.currentTarget; i.style.display = 'none'; i.nextElementSibling?.classList.remove('hidden'); }} />
          <span className="hidden font-semibold text-ivory/80">ErgonSite</span>
        </a>
      </div>
    </section>
  );
}
