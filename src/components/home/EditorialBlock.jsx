import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Closing editorial band. Always present so the homepage has a quiet,
 * brand-led ending even when the catalog is sparse.
 */
export function EditorialBlock({ image, href = '/about' }) {
  const { t } = useLanguage();

  return (
    <section className="lux-editorial" aria-label={t('home.editorial_title')}>
      <div className="lux-editorial__media">
        {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : null}
      </div>
      <div className="lux-editorial__body">
        <span className="lux-eyebrow">Editorial</span>
        <h2 className="lux-editorial__quote">{t('home.editorial_title')}</h2>
        <p>{t('home.editorial_desc')}</p>
        <div>
          <Link href={href} className="lux-btn lux-btn--light">
            {t('home.editorial_cta')} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default EditorialBlock;
