import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ArrowLeft } from 'lucide-react';

export function CustomPageView() {
  const [match, params] = useRoute('/p/:slug');
  const slug = params?.slug;
  const { lang } = useLanguage();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);

    api.get(`/pages/${slug}`)
      .then((res) => {
        if (res.success) {
          setPage(res.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        페이지를 불러오는 중입니다...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '12px' }}>페이지를 찾을 수 없습니다</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>요청하신 페이지가 존재하지 않거나 비공개 상태입니다.</p>
        <Link href="/" className="btn-primary">홈으로 돌아가기</Link>
      </div>
    );
  }

  const title = lang === 'ko' ? page.title_ko : (page.title_en || page.title_ko);
  const content = lang === 'ko' ? page.content_ko : (page.content_en || page.content_ko);

  return (
    <div>
      {/* Banner */}
      {page.banner_image && (
        <div style={{ position: 'relative', height: '320px', backgroundColor: '#121213', overflow: 'hidden' }}>
          <img
            src={page.banner_image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
            }}
          >
            <h1 className="font-serif" style={{ color: '#ffffff', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600 }}>
              {title}
            </h1>
          </div>
        </div>
      )}

      {/* Page Content Body */}
      <div className="container" style={{ maxWidth: '840px', padding: '60px 24px 100px' }}>
        {!page.banner_image && (
          <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            {title}
          </h1>
        )}

        <div
          style={{
            fontSize: '1.0625rem',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sunset)', fontSize: '0.875rem', fontWeight: 600 }}>
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
