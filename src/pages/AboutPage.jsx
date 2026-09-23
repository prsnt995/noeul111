import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Sparkles, MapPin, Clock, ArrowRight, ExternalLink } from 'lucide-react';

export function AboutPage() {
  const { lang, t } = useLanguage();

  return (
    <div style={{ padding: '40px 0 100px' }}>
      {/* Brand Hero */}
      <div className="container" style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '64px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-sunset)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          BRAND PHILOSOPHY
        </span>
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 600,
            lineHeight: 1.2,
            margin: '16px 0 24px',
          }}
        >
          {lang === 'ko' ? '서울의 황혼과 일상의 우아함' : 'The Seoul Twilight & Understated Elegance'}
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          {lang === 'ko'
            ? '노을(NOEUL)은 서울의 해질녘이 선사하는 차분하면서도 따뜻한 온도감에서 시작되었습니다. 빠르게 변화하는 유행을 좇기보다는, 시간이 흘러도 변치 않는 소재와 정교한 테일러링으로 옷장에 오랜 울림을 남기는 옷을 만듭니다.'
            : 'NOEUL was founded on the calm warmth of twilight in Seoul. Rather than chasing transient trends, we design garments that offer architectural silhouettes, natural enduring fabrics, and timeless quiet luxury.'}
        </p>

        {/* Company attribution line */}
        <div style={{ marginTop: '16px', fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
          {lang === 'ko' ? 'A business by ' : 'A business by '}
          <a
            href="https://www.noeulenterprises.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-sunset)',
              fontWeight: 600,
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s ease',
            }}
          >
            NOEUL ENTERPRISES
          </a>
        </div>
      </div>

      {/* Editorial Imagery Collage */}
      <div className="container" style={{ marginBottom: '80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          <img
            src="/products/men/tshirts/classic-tshirt/1.jpg"
            alt="Atelier 1"
            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <img
            src="/products/men/tshirts/classic-tshirt/1.jpg"
            alt="Atelier 2"
            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <img
            src="/products/men/tshirts/classic-tshirt/1.jpg"
            alt="Atelier 3"
            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* 3 Core Values */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '80px 0', marginBottom: '80px' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '40px',
            }}
          >
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-sunset)' }}>01</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '12px 0 8px' }}>
                {lang === 'ko' ? '절제된 미니멀리즘' : 'Architectural Minimalism'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                {lang === 'ko'
                  ? '과장된 디테일을 배제하고 신체의 곡선과 자연스럽게 조화를 이루는 유려한 드레이프와 핏을 추구합니다.'
                  : 'We strip away superficial embellishments to focus on refined proportions, relaxed shoulders, and seamless fluid drape.'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-sunset)' }}>02</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '12px 0 8px' }}>
                {lang === 'ko' ? '엄선된 천연 소재' : 'Enduring Natural Fabrics'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                {lang === 'ko'
                  ? '호주산 메리노 울, 키드 모헤어, 고밀도 컴팩트 코튼 등 피부에 닿는 감촉과 내구성을 최우선으로 검증합니다.'
                  : 'From Australian Merino wool and kid mohair to compact Japanese selvedge denim, our textiles prioritize tactile comfort and longevity.'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-sunset)' }}>03</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '12px 0 8px' }}>
                {lang === 'ko' ? '서울 아틀리에 테일러링' : 'Seoul Atelier Craftsmanship'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                {lang === 'ko'
                  ? '수십 년 경력의 서울 테일러 장인들과의 협업을 통해 봉제 마감 하나하나까지 엄격한 품질을 고집합니다.'
                  : 'Crafted in collaboration with seasoned master tailors in Seoul, upholding meticulous standards from seam finishes to custom hardware.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Showroom Section */}
      <div className="container" style={{ maxWidth: '900px', marginBottom: '40px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '40px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-sunset)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SEOUL SHOWROOM
            </span>
            <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 600, margin: '8px 0 16px' }}>
              {lang === 'ko' ? '노을 압구정 플래그십' : 'NOEUL Apgujeong Flagship'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--accent-sunset)" />
                <span>서울특별시 강남구 압구정로 165 노을 빌딩 1-2F</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} />
                <span>Tue - Sun 11:30 - 20:30 (Monday Closed)</span>
              </p>
            </div>
            <Link href="/shop" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.875rem' }}>
              <span>{lang === 'ko' ? '컬렉션 둘러보기' : 'Explore Collection'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <img
            src="/products/men/tshirts/classic-tshirt/1.jpg"
            alt="Showroom"
            style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Parent Company Section */}
      <div className="container" style={{ maxWidth: '900px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px 40px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-sunset)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              PARENT COMPANY
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '4px 0 4px', color: 'var(--text-primary)' }}>
              NOEUL ENTERPRISES
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {lang === 'ko'
                ? '노을(NOEUL)은 NOEUL ENTERPRISES의 패션 및 라이프스타일 공식 브랜드를 운영하고 있습니다.'
                : 'NOEUL is an official fashion brand operated by NOEUL ENTERPRISES.'}
            </p>
          </div>

          <a
            href="https://noeulenterprises.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            <span>NOEUL ENTERPRISES</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

