import React, { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';

export default function ProductPickerModal({ block, categories, storefrontData, onClose, onSave }) {
  const flatten = (data) => {
    const out = []; const seen = new Set();
    for (const c of (data?.categories || [])) for (const p of (c.products || [])) {
      if (!p || seen.has(p.id)) continue; seen.add(p.id); out.push(p);
    }
    return out;
  };
  const allProducts = useMemo(() => flatten(storefrontData || {}), [storefrontData]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(Array.isArray(block?.product_ids) ? [...block.product_ids] : []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter(p => {
      if (!q) return true;
      return String(p.name_ko || '').toLowerCase().includes(q)
        || String(p.name_en || '').toLowerCase().includes(q)
        || String(p.sku || '').toLowerCase().includes(q);
    });
  }, [allProducts, search]);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const move = (idx, dir) => {
    setSelected(prev => {
      const next = prev.slice();
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      const [it] = next.splice(idx, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const byId = useMemo(() => new Map(allProducts.map(p => [p.id, p])), [allProducts]);

  return (
    <div className="adm-home-preview-backdrop" onClick={onClose}>
      <div className="adm-home-preview" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="adm-home-preview__head">
          <strong>상품 선택 ({selected.length})</strong>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={12} /></button>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
            <input className="form-input" style={{ paddingLeft: 30 }} placeholder="이름 또는 SKU 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 420, overflow: 'auto' }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 12, color: '#666' }}>상품 목록</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.map(p => {
                  const img = (Array.isArray(p.images) && p.images[0]) || p.image_url || '';
                  const isSel = selected.includes(p.id);
                  return (
                    <button key={p.id} type="button" className={`adm-home-picker__item ${isSel ? 'is-selected' : ''}`} onClick={() => toggle(p.id)}>
                      {img ? <img src={img} alt="" /> : <div className="adm-home-picker__ph" />}
                      <span>{p.name_ko || p.name_en || p.name}</span>
                      {isSel ? <span className="adm-home-picker__check">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 12, color: '#666' }}>선택 순서</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selected.map((id, idx) => {
                  const p = byId.get(id);
                  if (!p) return null;
                  const img = (Array.isArray(p.images) && p.images[0]) || p.image_url || '';
                  return (
                    <div key={id} className="adm-home-picker__selected">
                      {img ? <img src={img} alt="" /> : <div className="adm-home-picker__ph" />}
                      <span>{p.name_ko || p.name_en || p.name}</span>
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === selected.length - 1}>↓</button>
                      <button type="button" onClick={() => toggle(id)}>×</button>
                    </div>
                  );
                })}
                {selected.length === 0 && <p style={{ color: '#999', fontSize: 12 }}>선택된 상품이 없습니다.</p>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onSave(selected)}>저장</button>
        </div>
      </div>
    </div>
  );
}
