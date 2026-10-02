import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Minimal Cmd+K palette stub. Items: [{ id, ko, en, hint, href }].
 * Parent controls `open`; palette filters locally.
 */
export function CommandPalette({ open, onClose, items = [], onNavigate }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (open) setQ(''); }, [open ]);
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onClose?.(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 9);
    return items.filter((i) => `${i.ko} ${i.en} ${i.hint || ''}`.toLowerCase().includes(term)).slice(0, 9);
  }, [q, items]);
  if (!open) return null;
  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Quick navigation 빠른 탐색" style={{ top: '18%' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
          <input className="adm-input" style={{ paddingLeft: 34 }} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to jump… 주문, 상품, 고객" aria-label="Quick navigation search" />
        </div>
        <div className="adm-cmd-list">
          {filtered.map((i) => (
            <button key={i.id} type="button" className="adm-cmd-item" onClick={() => { onNavigate?.(i); onClose?.(); }}>
              <span>{i.ko} <small style={{ color: '#71717a' }}>({i.en})</small></span>
              {i.hint ? <small>{i.hint}</small> : null}
            </button>
          ))}
          {filtered.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#71717a', padding: '8px 4px' }}>No matches 일치하는 항목이 없습니다</p> : null}
        </div>
      </div>
    </>
  );
}
