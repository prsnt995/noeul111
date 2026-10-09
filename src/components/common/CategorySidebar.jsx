import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function CategorySidebar({ categories, selectedCategory, onSelect, sticky = true }) {
  const { t } = useLanguage();
  const handleClick = (slug) => {
    if (onSelect) onSelect(slug);
  };

  const items = [
    { key: 'all', label: t('nav.all') },
    ...categories.map((c) => ({
      // Accept both DB shape {slug,name_ko,name_en} and homepage shape {key,label,label_ko}
      key: (c.key || c.slug || '').toLowerCase(),
      label: c.label_ko || c.name_ko || c.label || c.slug,
    })),
  ];

  return (
    <div
      className="noeul-category-bar edge-fade"
      style={{
        borderBottom: '1px solid #f0f0f0',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: sticky ? 'sticky' : 'static',
        top: 0,
        zIndex: 95,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {items.map((item) => {
          const isSelected = selectedCategory === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item.key)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 700 : 500,
                letterSpacing: '0.08em',
                color: isSelected ? '#000000' : '#888888',
                borderBottom: isSelected ? '1.5px solid #000000' : '1.5px solid transparent',
                paddingBottom: '2px',
                paddingLeft: '2px',
                paddingRight: '2px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
