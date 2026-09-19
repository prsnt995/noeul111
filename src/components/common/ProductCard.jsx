import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ProductPreviewModal } from './ProductPreviewModal.jsx';
import { getOptimizedImageUrl, getProductImages } from '../../utils/imageHelper.js';

export function ProductCard({ product, onSelect }) {
  const { lang } = useLanguage();
  const cardRef = useRef(null);
  const [index, setIndex] = useState(0); const [visible, setVisible] = useState(false); const [paused, setPaused] = useState(false); const [preview, setPreview] = useState(false);
  const [swatchColor, setSwatchColor] = useState(null);
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
  useEffect(() => { const el=cardRef.current; if (!el) return; const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting && entry.intersectionRatio >= .6),{threshold:[0,.6,1]}); observer.observe(el); return ()=>observer.disconnect(); }, []);
  useEffect(() => { if (images.length<2 || !visible || paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined; const timer=setInterval(()=>setIndex(i=>(i+1)%images.length),2800); return ()=>clearInterval(timer); }, [images.length,visible,paused]);
  useEffect(() => { setIndex(0); }, [swatchColor]);
  if (!product) return null;
  const open = e => { e.preventDefault(); onSelect ? onSelect(product) : setPreview(true); };
  const swatches = Array.isArray(product.colors) ? product.colors : [];
  return <>
    <article ref={cardRef} className="noeul-product-card product-card" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)} onClick={open} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}}} tabIndex={0} aria-label={name}>
      <div className="product-card-media" onTouchStart={e=>{cardRef.current._touchX=e.touches[0].clientX;setPaused(true);}} onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-cardRef.current._touchX;if(Math.abs(dx)>35)setIndex(i=>(i+(dx<0?1:images.length-1))%images.length);}}>
        {images[index] && <img src={getOptimizedImageUrl(images[index], 480)} alt={name} loading="lazy" decoding="async" className="product-card-image" />}
        <div className="product-card-badges">{product.stock<=0&&<span>품절</span>}{product.is_sale&&product.stock>0&&<span className="sale">SALE</span>}{product.is_new&&!product.is_sale&&product.stock>0&&<span>NEW</span>}</div>
        {images.length>1&&<div className="product-card-dots" aria-label="Product images">{images.map((_,i)=><button key={i} type="button" aria-label={`Image ${i+1}`} aria-current={i===index} onClick={e=>{e.stopPropagation();setIndex(i);setPaused(true);}} />)}</div>}
      </div>
      <div className="product-card-meta"><strong>{name}</strong><span>{(product.discount_price||product.price)?.toLocaleString('ko-KR')}원</span>{swatches.length>0&&<div className="product-card-swatches" aria-label="Available colors">{swatches.slice(0,5).map((color,i)=>{
        const cName = color.name_en || color.name || color.name_ko;
        const isActive = swatchColor === cName;
        return <button key={i} type="button" title={color.name_ko||color.name_en||color} aria-label={color.name_ko||color.name_en||color} style={{background:color.hex||color.swatch||'#d4d4d8', outline: isActive ? '2px solid #18181b' : 'none', outlineOffset: isActive ? '2px' : '0', border: isActive ? '1px solid #18181b' : '1px solid rgba(0,0,0,0.12)'}} onClick={e=>{e.stopPropagation();setPaused(true);setSwatchColor(cName);}} />;
      })}</div>}</div>
    </article>
    {!onSelect&&<ProductPreviewModal product={product} isOpen={preview} onClose={()=>setPreview(false)} />}
  </>;
}
