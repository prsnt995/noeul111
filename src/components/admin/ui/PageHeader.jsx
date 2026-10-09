import React from 'react';

/** Bilingual page header: title rendered as 한국어 (English). */
export function PageHeader({ ko, en, desc, actions, breadcrumb }) {
  return (
    <div>
      {breadcrumb ? <nav className="adm-crumbs" aria-label="Breadcrumb">{breadcrumb}</nav> : null}
      <div className="adm-page-head">
        <div>
          <h1>{ko}</h1>
          {desc ? <p>{desc}</p> : null}
        </div>
        {actions ? <div className="adm-page-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
