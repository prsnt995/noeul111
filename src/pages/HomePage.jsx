import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { SectionRenderer } from '../components/common/SectionRenderer.jsx';

export function HomePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content/sections')
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setSections(res.data);
        }
      })
      .catch((err) => console.error('Failed to load homepage sections:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>페이지 로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {sections.map((section) => (
        <SectionRenderer key={section.id || section.section_key} section={section} />
      ))}
    </div>
  );
}
