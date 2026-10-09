import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Headless premium dropdown shared by storefront + admin.
 * options: [{ value, label, hint? }]
 * The popover is portalled to document.body with viewport-fixed coords so it
 * can never be clipped by overflow ancestors or paint over the sticky header
 * (it always opens downward). Full listbox keyboard contract: ↑↓/Home/End
 * move, Enter/Space pick, Esc closes + refocuses trigger, Tab closes,
 * outside-click / focus-loss / scroll / resize close.
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
  const [coords, setCoords] = useState(null);
  const [sheetMode, setSheetMode] = useState(false);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const listId = useId();
  const selectedIdx = options.findIndex((o) => {
    if (String(o.value) === String(value)) return true;
    if ((value === '' || value === 'all' || value === undefined || value === null) &&
        (o.value === '' || o.value === 'all')) {
      return true;
    }
    return false;
  });
  const selected = options[selectedIdx] || (options.length > 0 ? options[0] : null);

  useEffect(() => {
    if (!open) return;
    setFocusIdx(selectedIdx >= 0 ? selectedIdx : 0);
    const sheet = window.innerWidth <= 767;
    setSheetMode(sheet);
    if (!sheet) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        const flip = rect.left + 220 > window.innerWidth;
        setCoords({
          top: rect.bottom + 6,
          maxHeight: Math.max(140, window.innerHeight - rect.bottom - 16),
          ...(flip
            ? { right: Math.max(8, window.innerWidth - rect.right) }
            : { left: Math.max(8, rect.left) }),
        });
      }
    } else {
      setCoords(null);
    }
    const onDown = (e) => {
      if (
        (rootRef.current && rootRef.current.contains(e.target)) ||
        (popRef.current && popRef.current.contains(e.target))
      ) {
        return;
      }
      setOpen(false);
    };
    // Keyboard hole: focus leaving the dropdown (e.g. opening a drawer or
    // modal from another control) must close the popover so it can never
    // paint above the overlay.
    const onFocusIn = (e) => {
      if (
        (rootRef.current && rootRef.current.contains(e.target)) ||
        (popRef.current && popRef.current.contains(e.target))
      ) {
        return;
      }
      setOpen(false);
    };
    // A viewport-fixed popover can't track a scrolling trigger — close it
    // instead (standard floating-menu behavior). Scrolls inside the popover
    // itself (its own max-height overflow) are ignored.
    const onScroll = (e) => {
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, selectedIdx]);

  const pick = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    setOpen(false);
    btnRef.current?.focus();
    onChange?.(opt.value);
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

  const popover = open ? (
    <ul
      ref={popRef}
      role="listbox"
      id={listId}
      aria-label={ariaLabel || label || 'Options'}
      className="fancy-select-pop"
      style={sheetMode ? undefined : coords || undefined}
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
            onMouseDown={(e) => e.stopPropagation()}
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
  ) : null;

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
      {typeof document !== 'undefined' && popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
