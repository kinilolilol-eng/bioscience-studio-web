import { useEffect, useId, useRef } from 'react';

export function Brand({ large = false, subtitle = 'Protocol companion' }) {
  return <a className={`brand ${large ? 'brand-large' : ''}`} href="#" aria-label="BioScience home" onClick={(event) => event.preventDefault()}>
    <img src="/bioscience-logo.png" alt="" /><span>Bio<span className="brand-accent">Science</span><small>{subtitle}</small></span>
  </a>;
}
export function Icon({ name, ...props }) {
  const paths = {
    close: 'M6 6l12 12M6 18L18 6', plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-6-6 6 6-6 6',
    check: 'm5 12 4 4L19 6', download: 'M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4',
    settings: 'M4 7h16M4 17h16M8 4v6m8 4v6', chevron: 'm8 5 7 7-7 7',
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.arrow} /></svg>;
}
export function Field({ label, hint, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return <div className={`field ${className}`}><label htmlFor={id}>{label}</label>{typeof children === 'function' ? children(id, hintId) : children}{hint && <small className="hint" id={hintId}>{hint}</small>}</div>;
}
export function Input({ label, hint, className, ...props }) {
  return <Field label={label} hint={hint} className={className}>{(id, hintId) => <input id={id} aria-describedby={hintId} {...props} />}</Field>;
}
export function Select({ label, hint, children, className, ...props }) {
  return <Field label={label} hint={hint} className={className}>{(id, hintId) => <select id={id} aria-describedby={hintId} {...props}>{children}</select>}</Field>;
}
export function Textarea({ label, hint, className, ...props }) {
  return <Field label={label} hint={hint} className={className}>{(id, hintId) => <textarea id={id} aria-describedby={hintId} rows="3" {...props} />}</Field>;
}
export function Notice({ children, kind = 'error' }) {
  return children ? <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> : null;
}
export function Empty({ title, children, action }) {
  return <div className="empty"><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}
export function Loading({ children = 'Loading…' }) {
  return <div className="loading" role="status"><span className="spinner" />{children}</div>;
}
export function Drawer({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={`drawer ${wide ? 'drawer-wide' : ''}`} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="drawer-inner"><header className="drawer-head"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" aria-label="Close panel" onClick={onClose}><Icon name="close" /></button></header>{children}</div>
  </dialog>;
}
export function Tabs({ value, onChange, entries, label }) {
  return <div className="tabs secondary-tabs" role="tablist" aria-label={label}>{entries.map(([key, title]) => <button type="button" role="tab" aria-selected={value === key} key={key} onClick={() => onChange(key)}>{title}</button>)}</div>;
}
export function SectionHead({ title, children, action }) {
  return <div className="section-head"><div><h2>{title}</h2>{children && <p>{children}</p>}</div>{action}</div>;
}
export function Status({ value, children }) {
  return <span className={`status status-${value}`}>{children || value?.replaceAll('_', ' ')}</span>;
}
export function UnitOptions() { return ['mg', 'mcg', 'g', 'IU', 'mL'].map((unit) => <option key={unit} value={unit}>{unit}</option>); }
