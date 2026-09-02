import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Sparkles, MapPin, Clock, ArrowRight } from 'lucide-react';

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
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop"
            alt="Atelier 1"
            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <img
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop"
            alt="Atelier 2"
            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <img
            src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop"
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
      <div className="container" style={{ maxWidth: '900px' }}>
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
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop"
            alt="Showroom"
            style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }}
          />
        </div>
      </div>
    </div>
  );
}
