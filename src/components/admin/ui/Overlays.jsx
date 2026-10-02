import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function ConfirmModal({ open, title = 'Confirm 확인', desc, confirmLabel = 'Delete 삭제', cancelLabel = 'Cancel 취소', onConfirm, onClose, danger = true }) {
  const btnRef = useRef(null);
  useEscape(onClose);
  useEffect(() => { if (open) btnRef.current?.focus(); }, [open ]);
  if (!open) return null;
  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {desc ? <p className="adm-modal-sub">{desc}</p> : null}
        <div className="adm-modal-actions">
          <button type="button" className="adm-btn" onClick={onClose}>{cancelLabel}</button>
          <button
            ref={btnRef}
            type="button"
            className={`adm-btn ${danger ? 'adm-btn-primary' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function Drawer({ open, title, subtitle, onClose, children, footer }) {
  useEscape(onClose);
  if (!open) return null;
  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-drawer-head">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h2>
            {subtitle ? <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#71717a' }}>{subtitle}</p> : null}
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={16} /></button>
        </div>
        <div className="adm-drawer-body">{children}</div>
        {footer ? <div className="adm-drawer-foot">{footer}</div> : null}
      </aside>
    </>
  );
}
