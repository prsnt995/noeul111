import React from 'react';

/** Quiet skeleton that matches the browse home composition. */
export function HomeSkeleton() {
  return (
    <div className="lux-home-skeleton" aria-label="홈 불러오는 중" aria-busy="true">
      <div className="lux-skeleton lux-skeleton-hero" />
      <div className="lux-container" style={{ marginTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 44, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="lux-skeleton" style={{ height: 12, width: '40%' }} />
            <div className="lux-skeleton" style={{ height: 28, width: '60%' }} />
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} className="lux-skeleton" style={{ height: 18, width: '100%' }} />
            ))}
            <div className="lux-skeleton" style={{ height: 40, width: '100%', marginTop: 8 }} />
          </div>
          <div>
            <div className="lux-skeleton" style={{ height: 14, width: '30%', marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[0, 1, 2, 3].map((k) => (
                <div key={k}>
                  <div className="lux-skeleton" style={{ aspectRatio: '3 / 4' }} />
                  <div className="lux-skeleton" style={{ height: 12, marginTop: 14, width: '72%' }} />
                  <div className="lux-skeleton" style={{ height: 10, marginTop: 8, width: '36%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSkeleton;
