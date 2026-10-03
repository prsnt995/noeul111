import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Segmented control with a sliding active indicator (premium tab feel).
 * options: [{ key, label }]
 */
export function GenderSegmented({ value, options = [], onChange, ariaLabel = 'Filter options' }) {
  const rootRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const active = root.querySelector('button.active');
      if (!active) return;
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth, ready: true });
    };
    measure();
    window.addEventListener('resize', measure);
    // Re-measure after fonts settle (widths shift with webfonts).
    const t = setTimeout(measure, 300);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, [value, options]);

  return (
    <div ref={rootRef} className="pill-group" role="tablist" aria-label={ariaLabel}>
      <span
        className="pill-indicator"
        aria-hidden
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {options.map((o) => {
        const isActive = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'active' : ''}
            onClick={() => { if (!isActive) onChange?.(o.key); }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
