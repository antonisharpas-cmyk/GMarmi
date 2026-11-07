import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang, switchPath, saveLang } from '../lib/i18n';
import { useSite } from '../lib/site';
import { scrollLock, scrollTopSmooth } from '../lib/motion';
import { useEnquiry } from './EnquiryDrawer';

const OVERLAY = [/^\/$/, /^\/about$/, /^\/contact$/, /^\/collections\/[^/]+$/, /^\/applications\/[^/]+$/, /^\/projects\/[^/]+$/, /^\/materials\/[^/]+$/];

export function IconInstagram({ className = 'h-4 w-4' }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>;
}
export function IconFacebook({ className = 'h-4 w-4' }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" /></svg>;
}
export function IconLinkedin({ className = 'h-4 w-4' }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M5 9h3v11H5zM6.5 4a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zM10 9h2.9v1.5c.4-.8 1.4-1.7 3-1.7 3.1 0 3.6 2 3.6 4.7V20h-3v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20H10z" /></svg>;
}

export default function Header() {
  const { t, lp, lang } = useLang();
  const site = useSite();
  const { pathname } = useLocation();
  const { open: openEnquiry } = useEnquiry();
  const base = pathname === '/el' ? '/' : pathname.startsWith('/el/') ? pathname.slice(3) : pathname;
  const overlay = OVERLAY.some((r) => r.test(base));
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sub, setSub] = useState<string | null>(null); // open list in the mobile menu
  const [drop, setDrop] = useState<string | null>(null); // open dropdown on desktop

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 300 && y > last + 2);
      if (y < last - 2) setHidden(false);
      last = y;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenu(false); setDrop(null); }, [pathname]);
  useEffect(() => { if (!menu) setSub(null); }, [menu]);
  // clicking the page you are already on closes the menu and takes you back to the top
  const same = (to: string) => () => {
    if (to !== pathname) return;
    setMenu(false);
    setTimeout(scrollTopSmooth, 50);
  };
  useEffect(() => { scrollLock(menu); }, [menu]);

  const light = overlay && !scrolled && !menu;
  // Applications and Projects are grouped under one "Inspiration" dropdown
  // and the owner's other companies sit under "Our Group" (edited in the admin)
  type Item = { to: string; label: string; external?: boolean };
  const groups: Record<string, { label: string; items: Item[] }> = {
    inspo: { label: t('inspiration'), items: [{ to: '/applications', label: t('applications') }, { to: '/projects', label: t('projects') }] },
  };
  const nav: (readonly [string, string] | 'inspo')[] = [
    ['/', t('home')], ['/materials', t('materials')], ['/collections', t('collections')], 'inspo',
    ['/about', t('about')], ['/contact', t('contact')], ['/group', t('group')],
  ];
  const isActive = (k: string) => groups[k].items.some((it) => !it.external && (base === it.to || base.startsWith(it.to + '/')));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-lux ${hidden && !menu ? '-translate-y-full' : ''} ${
          scrolled && !menu ? 'bg-ivory/90 shadow-[0_1px_0_rgba(29,27,25,.06)] backdrop-blur-md' : 'bg-transparent'} ${light ? 'text-ivory' : 'text-charcoal'}`}
      >
        <div className={`wrap flex items-center justify-between transition-all duration-700 ${scrolled ? 'h-[68px]' : 'h-[88px]'}`}>
          <Link to={lp('/')} onClick={same(lp('/'))} aria-label="G. M. Andreou Marmi, home" className="relative z-10 block w-[118px] sm:w-[136px]" data-cursor="link">
            <img src={light ? '/brand/logo-light.png' : '/brand/logo-dark.png'} alt="G. M. Andreou Marmi Ltd" className="w-full" />
          </Link>
          <nav className="hidden items-center gap-6 xl:flex 2xl:gap-8">
            {nav.map((item) => typeof item === 'string' ? (
              <div key={item} className="relative" onMouseEnter={() => setDrop(item)} onMouseLeave={() => setDrop(null)}>
                <button type="button" onClick={() => setDrop((d) => (d === item ? null : item))} aria-expanded={drop === item} aria-haspopup="true"
                  className={`ulink flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide2 ${isActive(item) ? 'active' : ''}`}>
                  {groups[item].label}
                  <svg className={`h-2.5 w-2.5 transition-transform duration-300 ${drop === item ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4l4 4 4-4" /></svg>
                </button>
                <div className={`absolute top-full pt-5 transition-all duration-300 left-1/2 -translate-x-1/2 ${drop === item ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                  <div className="min-w-[220px] whitespace-nowrap border border-charcoal/10 bg-ivory py-2 text-charcoal shadow-[0_20px_50px_rgba(29,27,25,.12)]">
                    {groups[item].items.map((it) => it.external ? (
                      it.to
                        ? <a key={it.label} href={it.to} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-6 px-6 py-3 text-[11px] font-medium uppercase tracking-wide2 transition-colors hover:bg-stone/60">{it.label}<span className="text-taupe">↗</span></a>
                        : <span key={it.label} className="block px-6 py-3 text-[11px] font-medium uppercase tracking-wide2 text-warm">{it.label}</span>
                    ) : (
                      <NavLink key={it.to} to={lp(it.to)} onClick={same(lp(it.to))} className={({ isActive: on }) => `block px-6 py-3 text-[11px] font-medium uppercase tracking-wide2 transition-colors hover:bg-stone/60 ${on ? 'text-bronze' : ''}`}>
                        {it.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={item[0]} to={lp(item[0])} onClick={same(lp(item[0]))} end={item[0] === '/'} className={({ isActive }) => `ulink text-[11px] font-medium uppercase tracking-wide2 ${isActive ? 'active' : ''}`}>
                {item[1]}
              </NavLink>
            ))}
          </nav>
          <div className="relative z-10 flex items-center gap-5">
            <div className="hidden items-center gap-2 text-[11px] font-medium tracking-wide2 sm:flex">
              <Link to={switchPath(pathname, 'en')} onClick={() => saveLang('en')} className={lang === 'en' ? '' : 'opacity-50 hover:opacity-100'} hrefLang="en">EN</Link>
              <span className="opacity-40">|</span>
              <Link to={switchPath(pathname, 'el')} onClick={() => saveLang('el')} className={lang === 'el' ? '' : 'opacity-50 hover:opacity-100'} hrefLang="el">GR</Link>
            </div>
            {site?.site.instagram && (
              <a href={site.site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hidden opacity-80 hover:opacity-100 md:block"><IconInstagram /></a>
            )}
            <button onClick={() => openEnquiry()} data-cursor="enquire"
              className={`btn hidden py-3 sm:inline-flex ${light ? 'btn-light' : 'btn-dark'}`}><span>{t('enquire')}</span></button>
            <button onClick={() => setMenu((m) => !m)} className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] xl:hidden" aria-label={t('menu')} aria-expanded={menu}>
              <span className={`h-px w-6 bg-current transition-transform duration-500 ${menu ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <span className={`h-px w-6 bg-current transition-transform duration-500 ${menu ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* mobile / tablet menu */}
      <div className={`fixed inset-0 z-40 bg-ivory transition-[clip-path] duration-[900ms] ease-lux xl:hidden ${menu ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_0)] pointer-events-none'}`}>
        <div className="wrap flex h-full flex-col justify-between gap-8 overflow-y-auto pb-10 pt-28" data-lenis-prevent>
          <nav className="flex flex-col gap-1">
            {nav.map((item, i) => {
              const anim = { transition: `opacity .6s ${0.15 + i * 0.05}s, transform .9s cubic-bezier(.22,.8,.2,1) ${0.15 + i * 0.05}s`, opacity: menu ? 1 : 0, transform: menu ? 'none' : 'translateY(30px)' };
              if (typeof item === 'string') return (
                <div key={item} style={anim}>
                  <button type="button" onClick={() => setSub((v) => (v === item ? null : item))} aria-expanded={sub === item} className="display flex items-center gap-4 text-[10vw] leading-[1.1] sm:text-6xl">
                    {groups[item].label}
                    <svg className={`h-5 w-5 transition-transform duration-500 ${sub === item ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 4l4 4 4-4" /></svg>
                  </button>
                  <div className={`grid transition-all duration-500 ease-lux ${sub === item ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-1 border-l border-charcoal/15 py-2 pl-5">
                        {groups[item].items.map((it) => it.external ? (
                          it.to
                            ? <a key={it.label} href={it.to} target="_blank" rel="noreferrer" className="display text-[6vw] leading-[1.25] text-warm sm:text-3xl">{it.label} ↗</a>
                            : <span key={it.label} className="display text-[6vw] leading-[1.25] text-taupe sm:text-3xl">{it.label}</span>
                        ) : (
                          <Link key={it.to} to={lp(it.to)} onClick={same(lp(it.to))} className="display text-[7vw] leading-[1.2] text-warm sm:text-4xl">{it.label}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
              return (
                <Link key={item[0]} to={lp(item[0])} onClick={same(lp(item[0]))} className="display text-[10vw] leading-[1.1] sm:text-6xl" style={anim}>
                  {item[1]}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-6">
            <button onClick={() => { setMenu(false); openEnquiry(); }} className="btn btn-dark w-full justify-center"><span>{t('enquire')}</span></button>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <Link to={switchPath(pathname, 'en')} onClick={() => saveLang('en')} className={lang === 'en' ? 'font-semibold' : 'text-warm'}>EN</Link>
                <span className="text-taupe">/</span>
                <Link to={switchPath(pathname, 'el')} onClick={() => saveLang('el')} className={lang === 'el' ? 'font-semibold' : 'text-warm'}>Ελληνικά</Link>
              </div>
              <div className="flex gap-4 text-warm">
                {site?.site.instagram && <a href={site.site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram className="h-5 w-5" /></a>}
                {site?.site.facebook && <a href={site.site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><IconFacebook className="h-5 w-5" /></a>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
