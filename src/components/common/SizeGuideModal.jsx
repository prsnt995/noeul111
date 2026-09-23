import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { X, Ruler } from 'lucide-react';

export function SizeGuideModal({ isOpen, onClose, categorySlug }) {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const isBottom = categorySlug === 'pants' || categorySlug === 'denim';

  return (
    <div className="backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          margin: '80px auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 0.2s ease forwards',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ruler size={20} color="var(--accent-sunset)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              {lang === 'ko' ? '실측 사이즈 가이드 (단위: cm)' : 'Size Guide & Measurements (cm)'}
            </h3>
          </div>
          <button onClick={onClose} style={{ padding: '4px', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Measurement Table */}
        {!isBottom ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.875rem', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '사이즈' : 'Size'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '총장' : 'Length'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '어깨너비' : 'Shoulder'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '가슴단면' : 'Chest'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '소매길이' : 'Sleeve'}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>S (95)</td>
                <td style={{ padding: '10px 12px' }}>72</td>
                <td style={{ padding: '10px 12px' }}>51</td>
                <td style={{ padding: '10px 12px' }}>58</td>
                <td style={{ padding: '10px 12px' }}>60</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>M (100)</td>
                <td style={{ padding: '10px 12px' }}>74</td>
                <td style={{ padding: '10px 12px' }}>53</td>
                <td style={{ padding: '10px 12px' }}>61</td>
                <td style={{ padding: '10px 12px' }}>62</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>L (105)</td>
                <td style={{ padding: '10px 12px' }}>76</td>
                <td style={{ padding: '10px 12px' }}>55</td>
                <td style={{ padding: '10px 12px' }}>64</td>
                <td style={{ padding: '10px 12px' }}>63.5</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>XL (110)</td>
                <td style={{ padding: '10px 12px' }}>78</td>
                <td style={{ padding: '10px 12px' }}>57</td>
                <td style={{ padding: '10px 12px' }}>67</td>
                <td style={{ padding: '10px 12px' }}>65</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.875rem', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '사이즈' : 'Size'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '허리단면' : 'Waist'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '허벅지단면' : 'Thigh'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '밑위' : 'Rise'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '밑단' : 'Hem'}</th>
                <th style={{ padding: '10px 12px' }}>{lang === 'ko' ? '총장' : 'Length'}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>S (28-29)</td>
                <td style={{ padding: '10px 12px' }}>38.5</td>
                <td style={{ padding: '10px 12px' }}>32</td>
                <td style={{ padding: '10px 12px' }}>30</td>
                <td style={{ padding: '10px 12px' }}>24</td>
                <td style={{ padding: '10px 12px' }}>103</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>M (30-31)</td>
                <td style={{ padding: '10px 12px' }}>41</td>
                <td style={{ padding: '10px 12px' }}>33.5</td>
                <td style={{ padding: '10px 12px' }}>31</td>
                <td style={{ padding: '10px 12px' }}>25</td>
                <td style={{ padding: '10px 12px' }}>105</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>L (32-33)</td>
                <td style={{ padding: '10px 12px' }}>43.5</td>
                <td style={{ padding: '10px 12px' }}>35</td>
                <td style={{ padding: '10px 12px' }}>32</td>
                <td style={{ padding: '10px 12px' }}>26</td>
                <td style={{ padding: '10px 12px' }}>107</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>XL (34-35)</td>
                <td style={{ padding: '10px 12px' }}>46</td>
                <td style={{ padding: '10px 12px' }}>36.5</td>
                <td style={{ padding: '10px 12px' }}>33</td>
                <td style={{ padding: '10px 12px' }}>27</td>
                <td style={{ padding: '10px 12px' }}>109</td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <p>• {lang === 'ko' ? '사이즈는 측정 위치와 방법에 따라 1~2cm 오차가 발생할 수 있습니다.' : 'Measurements may vary by 1-2cm depending on measuring methods.'}</p>
          <p>• {lang === 'ko' ? '평소 착용하시는 제품의 실측 사이즈와 비교하여 선택하시면 더욱 정확합니다.' : 'For best results, compare with measurements of your favorite fitting garment.'}</p>
        </div>
      </div>
    </div>
  );
}
