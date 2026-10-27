import { useEffect, useRef, useState } from 'react';

// Custom styled dropdown (no native select)
export default function Select({ value, onChange, options, placeholder, id, dark = false }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; id?: string; dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const current = options.find((o) => o.value === value);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(options.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (open && options[hi]) { onChange(options[hi].value); setOpen(false); } else setOpen(true); }
    else if (e.key === 'Escape') setOpen(false);
  };
  return (
    <div ref={ref} className="relative">
      <button type="button" id={id} onClick={() => setOpen((o) => !o)} onKeyDown={key} aria-haspopup="listbox" aria-expanded={open}
        className={`field flex items-center justify-between text-left ${dark ? 'border-ivory/25 text-ivory' : ''}`}>
        <span className={current ? '' : 'text-taupe'}>{current?.label || placeholder}</span>
        <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor"><path d="M2 4l4 4 4-4" /></svg>
      </button>
      <ul role="listbox" className={`absolute left-0 right-0 top-full z-30 max-h-64 overflow-auto border border-charcoal/10 bg-marble py-1 shadow-[0_20px_50px_rgba(29,27,25,.12)] transition-all duration-300 ${open ? 'visible translate-y-1 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
        {options.map((o, i) => (
          <li key={o.value} role="option" aria-selected={o.value === value}
            onMouseEnter={() => setHi(i)} onClick={() => { onChange(o.value); setOpen(false); }}
            className={`cursor-pointer px-4 py-2.5 text-sm text-charcoal ${i === hi ? 'bg-stone/70' : ''} ${o.value === value ? 'font-medium' : ''}`}>
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
