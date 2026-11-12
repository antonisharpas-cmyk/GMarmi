import { useEffect, useRef, useState } from 'react';

// Dropdown with checkboxes; the chosen values show as a comma list in the field
export default function MultiSelect({ value, onChange, options, placeholder, id }: {
  value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[]; placeholder?: string; id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const chosen = options.filter((o) => value.includes(o.value));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div ref={ref} className="relative">
      <button type="button" id={id} onClick={() => setOpen((o) => !o)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} aria-haspopup="listbox" aria-expanded={open}
        className="field flex items-center justify-between gap-3 text-left">
        <span className={`truncate ${chosen.length ? '' : 'text-taupe'}`}>{chosen.length ? chosen.map((o) => o.label).join(', ') : placeholder}</span>
        <svg className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor"><path d="M2 4l4 4 4-4" /></svg>
      </button>
      <ul role="listbox" aria-multiselectable="true" className={`absolute left-0 right-0 top-full z-30 max-h-64 overflow-auto border border-charcoal/10 bg-marble py-1 shadow-[0_20px_50px_rgba(29,27,25,.12)] transition-all duration-300 ${open ? 'visible translate-y-1 opacity-100' : 'invisible -translate-y-1 opacity-0'}`} data-lenis-prevent>
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <li key={o.value} role="option" aria-selected={on} onClick={() => toggle(o.value)}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-stone/70">
              <span className={`grid h-4 w-4 shrink-0 place-items-center border ${on ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/30'}`}>
                {on && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>}
              </span>
              {o.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
