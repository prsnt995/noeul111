import React from 'react';

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e4e4e7', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f2', display: 'flex', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ height: 12, width: 80 + i * 20, backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '16px 20px', borderBottom: r === rows - 1 ? 'none' : '1px solid #f0f0f2' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{ height: 14, backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${(r * cols + c) * 40}ms` }} />
          ))}
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e4e4e7', padding: 16, display: 'flex', gap: 12 }}>
          <div style={{ width: 64, height: 80, backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: 10, width: '60%', backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: 10, width: '40%', backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e4e4e7' }}>
          <div style={{ height: 10, width: 90, backgroundColor: '#f4f4f5', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.4s infinite' }} />
          <div style={{ height: 22, width: 70, backgroundColor: '#f4f4f5', borderRadius: 6, animation: 'pulse 1.4s infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4}}`}</style>
    </div>
  );
}
