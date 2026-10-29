import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useSite } from '../lib/site';
import { track } from '../lib/api';
import { IconFacebook, IconInstagram, IconLinkedin } from './Header';

export default function Footer() {
  const { t, lp, tr, lang } = useLang();
  const s = useSite();
  const site = s?.site || {};
  return (
    <footer className="bg-ink text-ivory/80">
      <div className="wrap pb-10 pt-24">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <img src="/brand/logo-light.png" alt="G. M. Andreou Marmi Ltd" className="w-44 opacity-95" loading="lazy" />
            <p className="mt-8 max-w-sm font-display text-3xl font-light leading-tight text-ivory">{tr(site, 'footer')}</p>
            <div className="mt-8 flex gap-5">
              {site.instagram && <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-ivory"><IconInstagram className="h-5 w-5" /></a>}
              {site.facebook && <a href={site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-ivory"><IconFacebook className="h-5 w-5" /></a>}
              {site.linkedin && <a href={site.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-ivory"><IconLinkedin className="h-5 w-5" /></a>}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="eyebrow mb-6 text-taupe">{t('explore2')}</div>
            <ul className="space-y-3 text-sm">
              {[['/materials', t('materials')], ['/collections', t('collections')], ['/applications', t('applications')], ['/projects', t('projects')], ['/about', t('about')], ['/faq', t('faq')]].map(([p, l]) => (
                <li key={p}><Link to={lp(p)} className="ulink hover:text-ivory">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-4">
            <div className="eyebrow mb-6 text-taupe">{t('getInTouch')}</div>
            <ul className="space-y-4 text-sm leading-relaxed">
              <li>{tr(site, 'address')}</li>
              {site.phone && <li><a href={`tel:${site.phone_raw || site.phone}`} onClick={() => track('phone_click', 'footer')} className="ulink hover:text-ivory">{site.phone}</a></li>}
              {site.email && <li><a href={`mailto:${site.email}`} onClick={() => track('email_click', 'footer')} className="ulink hover:text-ivory">{site.email}</a></li>}
              {tr(site, 'hours') && <li className="whitespace-pre-line text-ivory/60">{tr(site, 'hours')}</li>}
            </ul>
            <Link to={lp('/contact')} className="btn btn-light mt-8"><span>{t('visitShowroom')}</span></Link>
          </div>
        </div>

        <div className="mt-20 h-px bg-ivory/10" />
        <div className="mt-8 grid items-center gap-6 text-[11px] tracking-wide md:grid-cols-3">
          <div className="text-ivory/50">© {new Date().getFullYear()} {site.company || 'G. M. Andreou Marmi Ltd'}. {t('rights')}</div>
          <a href="https://www.ergonsite.com" target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-1 text-ivory/50 hover:text-ivory">
            <span className="uppercase tracking-wide2">{t('developed')}</span>
            <img src="https://ergonsite.com/assets/logo.png" alt="ErgonSite" className="h-7 w-auto opacity-90 transition-opacity group-hover:opacity-100" loading="lazy" onError={(e) => { const i = e.currentTarget; i.style.display = 'none'; i.nextElementSibling?.classList.remove('hidden'); }} />
            <span className="hidden font-sans text-base font-semibold tracking-tight text-ivory/90">ErgonSite</span>
          </a>
          <div className="flex flex-wrap gap-5 text-ivory/60 md:justify-end md:pr-16">
            <Link to={lp('/terms')} className="ulink hover:text-ivory">{t('terms')}</Link>
            <Link to={lp('/cookies')} className="ulink hover:text-ivory">{t('cookies')}</Link>
            <Link to={lp('/privacy')} className="ulink hover:text-ivory">{t('privacy')}</Link>
          </div>
        </div>
        <span className="sr-only">{lang}</span>
      </div>
    </footer>
  );
}
