import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Headless premium dropdown shared by storefront + admin.
 * options: [{ value, label, hint? }]
 * Full listbox keyboard contract: ↑↓/Home/End move, Enter/Space pick,
 * Esc closes + refocuses trigger, Tab closes, outside-click closes.
 */
export function Dropdown({
  value,
  options = [],
  onChange,
  ariaLabel,
  label,
  className = '',
  buttonClassName = '',
  dark = false,
}) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listId = useId();
  const selectedIdx = options.findIndex((o) => String(o.value) === String(value));
  const selected = options[selectedIdx];

  useEffect(() => {
    if (!open) return;
    setFocusIdx(selectedIdx >= 0 ? selectedIdx : 0);
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, selectedIdx]);

  const pick = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    setOpen(false);
    btnRef.current?.focus();
    if (String(opt.value) !== String(value)) onChange?.(opt.value);
  };

  const onTriggerKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  const onListKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setFocusIdx(0); }
    else if (e.key === 'End') { e.preventDefault(); setFocusIdx(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(focusIdx); }
    else if (e.key === 'Tab') { setOpen(false); }
  };

  return (
    <div ref={rootRef} className={`fancy-select${dark ? ' dark' : ''} ${className}`}>
      {label ? <span className="fancy-select-label" id={`${listId}-label`}>{label}</span> : null}
      <button
        ref={btnRef}
        type="button"
        className={`fancy-select-btn ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${listId}-label` : undefined}
        aria-label={label ? undefined : (ariaLabel || 'Select option')}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className="fancy-select-value">{selected ? selected.label : ''}</span>
        <ChevronDown size={15} aria-hidden className={`fancy-select-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          id={listId}
          aria-label={ariaLabel || label || 'Options'}
          className="fancy-select-pop"
          onKeyDown={onListKey}
          tabIndex={-1}
        >
          {options.map((o, i) => {
            const isSel = String(o.value) === String(value);
            return (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={isSel}
                data-focused={i === focusIdx}
                className={`fancy-select-opt${isSel ? ' selected' : ''}${i === focusIdx ? ' focused' : ''}`}
                ref={i === focusIdx ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                onClick={() => pick(i)}
                onMouseEnter={() => setFocusIdx(i)}
              >
                <span>{o.label}</span>
                {o.hint ? <small>{o.hint}</small> : null}
                {isSel ? <Check size={14} aria-hidden className="fancy-select-check" /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
