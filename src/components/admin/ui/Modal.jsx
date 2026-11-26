import React, { useRef } from 'react';
import { useDialogFocus } from '../../../utils/dialogFocus.js';

/**
 * Shared modal primitive: backdrop + focus trap + Escape handling + aria.
 * Usage:
 *   <Modal open={open} onClose={onClose} title="..." maxWidth={560}>
 *     <form>...</form>
 *   </Modal>
 */
export function Modal({ open, onClose, title, ariaLabel, maxWidth = 560, children, footer }) {
  const dialogRef = useRef(null);
  // Escape handling
  React.useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  useDialogFocus(open, dialogRef);
  if (!open) return null;
  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        style={{ maxWidth }}
      >
        {title ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="닫기">✕</button>
          </div>
        ) : null}
        {children}
        {footer ? <div className="adm-modal-actions">{footer}</div> : null}
      </div>
    </>
  );
}