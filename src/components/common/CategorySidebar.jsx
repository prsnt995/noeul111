import React from 'react';

export function CategorySidebar({ categories, selectedCategory, onSelect }) {
  const handleClick = (slug) => {
    if (onSelect) onSelect(slug);
  };

  const items = [
    { key: 'all', label: '전체', labelEn: 'All' },
    ...categories.map((c) => ({ key: c.slug, label: c.name_ko, labelEn: c.name_en })),
  ];

  return (
    <div
      className="noeul-category-bar"
      style={{
        borderBottom: '1px solid #f0f0f0',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: 'sticky',
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
              {item.label} {item.labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
