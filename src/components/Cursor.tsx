import { useEffect, useRef, useState } from 'react';
import { isTouch, reduced } from '../lib/motion';
import { useLang } from '../lib/i18n';

// Subtle desktop cursor. Elements opt in with data-cursor="view" | "explore" | "enquire" | "link".
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (isTouch() || reduced()) return;
    const el = ref.current!;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      const target = (e.target as HTMLElement)?.closest?.('[data-cursor], a, button') as HTMLElement | null;
      const kind = target?.getAttribute('data-cursor') || (target ? 'link' : '');
      el.classList.toggle('is-label', ['view', 'explore', 'enquire'].includes(kind));
      el.classList.toggle('is-link', kind === 'link');
      el.classList.toggle('on-dark', !!(e.target as HTMLElement)?.closest?.('[data-dark]'));
      setLabel(kind === 'view' ? t('view') : kind === 'explore' ? t('explore') : kind === 'enquire' ? t('enquire') : '');
      el.style.opacity = '1';
    };
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => { el.style.opacity = '0'; };
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', move); document.removeEventListener('mouseleave', leave); };
  }, [t]);
  return (
    <div ref={ref} className="cursor" style={{ opacity: 0 }} aria-hidden>
      <div className="cursor-dot"><span>{label.toUpperCase()}</span></div>
    </div>
  );
}
