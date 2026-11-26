import React from 'react';

/** Bilingual page header: title rendered as 한국어 (English). */
export function PageHeader({ ko, en, title, subtitle, desc, actions, breadcrumb }) {
  const heading = title || ko;
  const sub = desc || subtitle;
  return (
    <div>
      {breadcrumb ? <nav className="adm-crumbs" aria-label="Breadcrumb">{breadcrumb}</nav> : null}
      <div className="adm-page-head">
        <div>
          <h1>{heading}{en ? <span style={{ color: '#a1a1aa', fontWeight: 400, marginLeft: 8, fontSize: '0.7em' }}>({en})</span> : null}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
        {actions ? <div className="adm-page-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
