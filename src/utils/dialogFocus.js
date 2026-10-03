import { useEffect } from 'react';

// Keyboard accessibility for modal dialogs: moves focus inside on open,
// traps Tab within the dialog, and restores focus to the trigger on close.
// Escape is handled by each dialog's own listener; this hook only traps Tab.
export function useDialogFocus(open, dialogRef) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const el = dialogRef.current;
    const focusables = () => (el
      ? [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((n) => !n.disabled && n.offsetParent !== null)
      : []);
    const first = focusables()[0];
    if (first) first.focus();
    else if (el && !el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    const onKey = (e) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) { e.preventDefault(); tail.focus(); }
      else if (!e.shiftKey && document.activeElement === tail) { e.preventDefault(); head.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prev && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
    };
  }, [open, dialogRef]);
}
