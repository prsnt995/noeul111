import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getOptimizedImageUrl, getProductImages } from '../../utils/imageHelper.js';

export function ProductCard({ product, variant = 'classic', eager = false }) {
  const { lang, t } = useLanguage();
  const [, setLocation] = useLocation();
  const cardRef = useRef(null);
  const [index, setIndex] = useState(0); const [visible, setVisible] = useState(false); const [paused, setPaused] = useState(false);
  const [swatchColor, setSwatchColor] = useState(null);
  // Overlay variant (photo-only grid): first tap reveals info, second tap opens.
  const [revealed, setRevealed] = useState(false);
  const tapGuard = useRef(false);
  const isOverlay = variant === 'overlay';
  const baseImages = useMemo(() => getProductImages(product).filter(Boolean).slice(0, 5), [product]);
  // Reorder: show all 5 but move selected color's images first (e.g., 2 blue first when blue selected)
  const images = useMemo(() => {
    if (!swatchColor || !product?.media) return baseImages.slice(0, 3);
    const colorUrls = product.media.filter(m => m.color === swatchColor).map(m => m.url).filter(Boolean);
    if (colorUrls.length === 0) return baseImages.slice(0, 3);
    const others = baseImages.filter(url => !colorUrls.includes(url));
    return [...colorUrls, ...others].slice(0, 3);
  }, [baseImages, swatchColor, product]);
  const name = lang === 'ko' ? (product?.name_ko || product?.name_en) : (product?.name_en || product?.name_ko);
  const swatches = Array.isArray(product.colors) ? product.colors : [];
  const colorCount = swatches.length;
  const colorSuffix = colorCount >= 2 ? t('product.color_count', { count: colorCount }) : '';
  const price = (product.discount_price || product.price)?.toLocaleString('ko-KR');
  const hasSale = Boolean(product.discount_price && product.discount_price < product.price);
  const soldOut = (product.stock ?? 1) <= 0;
  // Screen readers get the full info from the label (overlay is visual).
  const accessibleName = `${name}${colorSuffix ? `, ${colorSuffix}` : ''}, ${price}원${hasSale ? `, ${t('product.sale')}` : ''}${soldOut ? `, ${t('product.sold_out')}` : ''}`;
  useEffect(() => { const el=cardRef.current; if (!el) return; const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting && entry.intersectionRatio >= .6),{threshold:[0,.6,1]}); observer.observe(el); return ()=>observer.disconnect(); }, []);
  useEffect(() => { if (images.length<2 || !visible || paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined; const timer=setInterval(()=>setIndex(i=>(i+1)%images.length),850); return ()=>clearInterval(timer); }, [images.length,visible,paused]);
  useEffect(() => { setIndex(0); }, [swatchColor]);
  if (!product) return null;
  const open = e => {
    // Overlay mode on touch: first tap reveals, second tap navigates.
    if (isOverlay && tapGuard.current) { tapGuard.current = false; e?.preventDefault?.(); return; }
    e?.preventDefault?.(); setLocation(`/product/${product.slug || product.id}`);
  };
  const handleTouchEnd = e => {
    const el = cardRef.current;
    const startX = el?._touchX;
    if (el) el._touchX = undefined;
    if (startX === undefined) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 35) {
      tapGuard.current = false;
      setIndex(i => (i + (dx < 0 ? 1 : images.length - 1)) % images.length);
      setPaused(false);
      return;
    }
    // Tap (not swipe): reveal first, navigate on next tap.
    if (isOverlay && !revealed) {
      tapGuard.current = true;
      setRevealed(true);
      setPaused(true);
    } else {
      tapGuard.current = false;
    }
  };
  const overlayPrice = (
    <>
      <span className="product-card-overlay-price">{price}원</span>
      {hasSale && <span className="product-card-overlay-was">{product.price?.toLocaleString('ko-KR')}원</span>}
    </>
  );
  return (
    <article ref={cardRef} aria-label={accessibleName} title={accessibleName} className={`noeul-product-card product-card${isOverlay ? ' overlay' : ''}${revealed ? ' revealed' : ''}`} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>{setPaused(false); if (isOverlay) setRevealed(false);}} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)} onClick={open} onKeyDown={e=>{if (e.target !== e.currentTarget) return; if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}}} tabIndex={0}>
      <div className="product-card-media" onTouchStart={e=>{if (cardRef.current) cardRef.current._touchX=e.touches[0].clientX;setPaused(true);}} onTouchEnd={handleTouchEnd}>
        {images[index] && <img key={images[index]} src={getOptimizedImageUrl(images[index], 480)} alt={name} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" className="product-card-image" />}
        <div className="product-card-badges">{soldOut&&<span>{t('product.sold_out')}</span>}{product.is_sale&&!soldOut&&<span className="sale">{t('product.sale')}</span>}{product.is_new&&!product.is_sale&&!soldOut&&<span>{t('product.new')}</span>}</div>
        {images.length>1&&<div className="product-card-dots" role="group" aria-label={t('product.images')}>{images.map((_,i)=><button key={i} type="button" aria-label={t('product.image_n', { n: i + 1 })} aria-current={i===index ? true : undefined} onClick={e=>{e.stopPropagation();setIndex(i);setPaused(true);}} />)}</div>}
        {isOverlay && (
          <div className="product-card-overlay">
            <strong className="product-card-overlay-name">{name}{colorSuffix && <span className="product-card-color-count">{colorSuffix}</span>}</strong>
            <div className="product-card-overlay-row">{overlayPrice}</div>
            {swatches.length>0&&<div role="group" className="product-card-swatches product-card-overlay-swatches" aria-label={t('product.colors')}>{swatches.slice(0,5).map((color,i)=>{
              const cName = color.name_en || color.name || color.name_ko;
              const isActive = swatchColor === cName;
              return <button key={i} type="button" title={color.name_ko||color.name_en||color} aria-label={color.name_ko||color.name_en||color} style={{background:color.hex||color.swatch||'#d4d4d8', outline: isActive ? '2px solid #fff' : 'none', outlineOffset: isActive ? '2px' : '0', border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.5)'}} onClick={e=>{e.stopPropagation();setPaused(true);setSwatchColor(cName);}} />;
            })}</div>}
          </div>
        )}
      </div>
      {!isOverlay && (
      <div className="product-card-meta"><strong>{name}{colorSuffix && <span className="product-card-color-count">{colorSuffix}</span>}</strong><span>{(product.discount_price||product.price)?.toLocaleString('ko-KR')}원</span>{swatches.length>0&&<div role="group" className="product-card-swatches" aria-label={t('product.colors')}>{swatches.slice(0,5).map((color,i)=>{
        const cName = color.name_en || color.name || color.name_ko;
        const isActive = swatchColor === cName;
        return <button key={i} type="button" title={color.name_ko||color.name_en||color} aria-label={color.name_ko||color.name_en||color} style={{background:color.hex||color.swatch||'#d4d4d8', outline: isActive ? '2px solid #18181b' : 'none', outlineOffset: isActive ? '2px' : '0', border: isActive ? '1px solid #18181b' : '1px solid rgba(0,0,0,0.12)'}} onClick={e=>{e.stopPropagation();setPaused(true);setSwatchColor(cName);}} />;
      })}</div>}</div>
      )}
    </article>
  );
}
