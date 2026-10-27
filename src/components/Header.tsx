import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang, switchPath } from '../lib/i18n';
import { useSite } from '../lib/site';
import { scrollLock } from '../lib/motion';
import { useEnquiry } from './EnquiryDrawer';

const OVERLAY = [/^\/$/, /^\/about$/, /^\/collections\/[^/]+$/, /^\/applications\/[^/]+$/, /^\/projects\/[^/]+$/, /^\/materials\/[^/]+$/];

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
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => { scrollLock(menu); }, [menu]);

  const light = overlay && !scrolled && !menu;
  const nav = [
    ['/materials', t('materials')], ['/collections', t('collections')], ['/applications', t('applications')],
    ['/projects', t('projects')], ['/about', t('about')], ['/contact', t('contact')],
  ] as const;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-lux ${hidden && !menu ? '-translate-y-full' : ''} ${
          scrolled && !menu ? 'bg-ivory/90 shadow-[0_1px_0_rgba(29,27,25,.06)] backdrop-blur-md' : 'bg-transparent'} ${light ? 'text-ivory' : 'text-charcoal'}`}
      >
        <div className={`wrap flex items-center justify-between transition-all duration-700 ${scrolled ? 'h-[68px]' : 'h-[88px]'}`}>
          <Link to={lp('/')} aria-label="G. M. Andreou Marmi, home" className="relative z-10 block w-[118px] sm:w-[136px]" data-cursor="link">
            <img src={light ? '/brand/logo-light.png' : '/brand/logo-dark.png'} alt="G. M. Andreou Marmi Ltd" className="w-full" />
          </Link>
          <nav className="hidden items-center gap-8 xl:flex">
            {nav.map(([p, l]) => (
              <NavLink key={p} to={lp(p)} className={({ isActive }) => `ulink text-[11px] font-medium uppercase tracking-wide2 ${isActive ? 'active' : ''}`}>
                {l}
              </NavLink>
            ))}
          </nav>
          <div className="relative z-10 flex items-center gap-5">
            <div className="hidden items-center gap-2 text-[11px] font-medium tracking-wide2 sm:flex">
              <Link to={switchPath(pathname, 'en')} className={lang === 'en' ? '' : 'opacity-50 hover:opacity-100'} hrefLang="en">EN</Link>
              <span className="opacity-40">|</span>
              <Link to={switchPath(pathname, 'el')} className={lang === 'el' ? '' : 'opacity-50 hover:opacity-100'} hrefLang="el">GR</Link>
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
        <div className="wrap flex h-full flex-col justify-between pb-10 pt-28">
          <nav className="flex flex-col gap-1">
            {[['/', t('home')], ...nav].map(([p, l], i) => (
              <Link key={p} to={lp(p)} className="display text-[11vw] leading-[1.1] sm:text-6xl" style={{ transition: `opacity .6s ${0.15 + i * 0.05}s, transform .9s cubic-bezier(.22,.8,.2,1) ${0.15 + i * 0.05}s`, opacity: menu ? 1 : 0, transform: menu ? 'none' : 'translateY(30px)' }}>
                {l}
              </Link>
            ))}
          </nav>
          <div className="space-y-6">
            <button onClick={() => { setMenu(false); openEnquiry(); }} className="btn btn-dark w-full justify-center"><span>{t('enquire')}</span></button>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <Link to={switchPath(pathname, 'en')} className={lang === 'en' ? 'font-semibold' : 'text-warm'}>EN</Link>
                <span className="text-taupe">/</span>
                <Link to={switchPath(pathname, 'el')} className={lang === 'el' ? 'font-semibold' : 'text-warm'}>Ελληνικά</Link>
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
