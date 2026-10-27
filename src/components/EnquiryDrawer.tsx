import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import { scrollLock } from '../lib/motion';
import EnquiryForm from './EnquiryForm';
import type { Entry } from '../lib/types';

type Opts = { product?: Entry; type?: string };
const Ctx = createContext<{ open: (o?: Opts) => void }>({ open: () => {} });
export const useEnquiry = () => useContext(Ctx);

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  const { t, tr } = useLang();
  const open = useCallback((o: Opts = {}) => setOpts(o), []);
  const close = () => setOpts(null);
  useEffect(() => { scrollLock(!!opts); }, [opts]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <div className={`fixed inset-0 z-[60] ${opts ? '' : 'pointer-events-none'}`} aria-hidden={!opts}>
        <div onClick={close} className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-700 ${opts ? 'opacity-100' : 'opacity-0'}`} />
        <aside role="dialog" aria-modal="true" aria-label={t('enquire')}
          className={`absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col bg-ivory transition-transform duration-[900ms] ease-lux ${opts ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5 sm:px-10">
            <span className="eyebrow">{opts?.product ? t('requestInfo') : t('enquire')}</span>
            <button onClick={close} className="text-[11px] uppercase tracking-wide2 text-warm hover:text-charcoal">{t('close')} ✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10" data-lenis-prevent>
            {opts?.product && (
              <div className="mb-10 flex items-center gap-5">
                {opts.product.cover && <img src={opts.product.cover.sm} alt="" className="h-20 w-16 object-cover" />}
                <div><div className="eyebrow">{t('material')}</div><div className="font-display text-3xl">{tr(opts.product, 'name')}</div></div>
              </div>
            )}
            {!opts?.product && <h2 className="h-md mb-10">{t('getInTouch')}</h2>}
            {opts && <EnquiryForm key={opts.product?.id || 'g'} productId={opts.product?.id} defaultType={opts.type} onDone={close} />}
          </div>
        </aside>
      </div>
    </Ctx.Provider>
  );
}
