import React from 'react';

/** Quiet skeleton that matches the editorial home composition. */
export function HomeSkeleton() {
  return (
    <div className="lux-home-skeleton" aria-label="홈 불러오는 중" aria-busy="true">
      <div className="lux-skeleton lux-skeleton-hero" />
      <div className="lux-container" style={{ marginTop: 32 }}>
        <div className="lux-skeleton" style={{ height: 12, width: '18%', marginBottom: 10 }} />
        <div className="lux-skeleton" style={{ height: 30, width: '36%', marginBottom: 24 }} />
        <div className="lux-skeleton-row">
          {[0, 1, 2, 3].map((k) => (
            <div key={k}>
              <div className="lux-skeleton lux-skeleton-card" />
              <div className="lux-skeleton" style={{ height: 12, marginTop: 14, width: '70%' }} />
              <div className="lux-skeleton" style={{ height: 10, marginTop: 8, width: '36%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeSkeleton;
