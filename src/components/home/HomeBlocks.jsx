import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { HomeHero } from './HomeHero.jsx';
import { FastDeliveryBanner } from './FastDeliveryBanner.jsx';
import { BestSellersCarousel } from './BestSellersCarousel.jsx';
import { CategoryTiles } from './CategoryTiles.jsx';
import { CategoryRow } from './CategoryRow.jsx';
import { PromoBanner } from './PromoBanner.jsx';
import { EditorialBlock } from './EditorialBlock.jsx';
import { getOptimizedImageUrl, getPrimaryProductImage, safeHttpUrl } from '../../utils/imageHelper.js';
import { groupBannerRows } from '../../utils/homeLayout.js';

function flattenProducts(data) {
  const out = [];
  const seen = new Set();
  for (const c of (data?.categories || [])) {
    for (const p of (c.products || [])) {
      if (!p || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

function resolveBanner(block, data) {
  if (!block) return null;
  if (block.source === 'specific') {
    return (data?.banners?.by_id || {})[block.banner_id] || null;
  }
  const placement = block.placement || 'home_after_best';
  if (placement === 'home_hero') return data?.banners?.hero || null;
  const list = Array.isArray(data?.banners?.[placement]) ? data.banners[placement] : [];
  return list[0] || null;
}

function resolveBanners(block, data) {
  if (!block) return [];
  if (block.source === 'specific') {
    const b = (data?.banners?.by_id || {})[block.banner_id];
    return b ? [b] : [];
  }
  const placement = block.placement || 'home_after_best';
  const list = Array.isArray(data?.banners?.[placement]) ? data.banners[placement] : [];
  const limit = Math.max(1, Number(block.limit) || 1);
  return list.slice(0, limit);
}

function railItems(block, data) {
  const limit = Math.max(1, Number(block.limit) || 8);
  const all = flattenProducts(data);
  let pool = [];
  switch (block.source) {
    case 'best':
      pool = Array.isArray(data?.best) ? data.best : [];
      break;
    case 'new':
      pool = Array.isArray(data?.new) ? data.new : [];
      break;
    case 'category': {
      const cat = (data?.categories || []).find(c => c.slug === block.category_slug);
      pool = cat?.products || [];
      break;
    }
    case 'sale':
      pool = all.filter(p => Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price));
      break;
    case 'manual': {
      const byId = new Map(all.map(p => [p.id, p]));
      pool = (block.product_ids || []).map(id => byId.get(id)).filter(Boolean);
      break;
    }
    case 'all':
    default:
      pool = all;
      break;
  }
  return pool.slice(0, limit);
}

function railTitle(block, data) {
  if (block.title_ko) return block.title_ko;
  if (block.source === 'category') {
    const cat = (data?.categories || []).find(c => c.slug === block.category_slug);
    return cat ? (cat.name_ko || cat.name_en || cat.slug) : '';
  }
  if (block.source === 'best') return '베스트 셀러';
  if (block.source === 'new') return '신상품';
  if (block.source === 'sale') return '세일';
  if (block.source === 'manual') return '추천 상품';
  return '상품';
}

function BannerBlock({ block, data }) {
  const banners = resolveBanners(block, data);
  if (!banners.length) return null;
  return (
    <>
      {banners.map((b) => (
        <PromoBanner key={b.id || b.image_url} banner={b} />
      ))}
    </>
  );
}

export function HomeBlocks({ blocks, data }) {
  const { t } = useLanguage();
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const heroProduct = (data?.best || [])[0] || categories.find((c) => c.products?.length)?.products?.[0];
  const activeBlocks = (Array.isArray(blocks) ? blocks : []).filter(b => b && b.enabled !== false);

  const out = [];
  let i = 0;
  while (i < activeBlocks.length) {
    const b = activeBlocks[i];
    if (b.type !== 'banner') {
      out.push({ kind: 'single', block: b });
      i += 1;
      continue;
    }
    const run = [];
    let j = i;
    while (j < activeBlocks.length && activeBlocks[j].type === 'banner') {
      run.push(activeBlocks[j]);
      j += 1;
    }
    const groups = groupBannerRows(run);
    for (const g of groups) out.push({ kind: 'banner-group', group: g });
    i = j;
  }

  return (
    <div className="lux-home">
      {out.map((entry, idx) => {
        if (entry.kind === 'single') {
          const b = entry.block;
          switch (b.type) {
            case 'hero':
              return <HomeHero key={b.id || idx} banner={resolveBanner(b, data)} site={data?.site || {}} heroProduct={heroProduct} />;
            case 'delivery':
              return <FastDeliveryBanner key={b.id || idx} variant={b.variant} />;
            case 'product_rail': {
              const items = railItems(b, data);
              if (!items.length) return null;
              const title = railTitle(b, data);
              if (b.display === 'grid') {
                const cat = { slug: b.category_slug || 'rail', name_ko: title, name_en: title, products: items };
                return <CategoryRow key={b.id || idx} category={cat} />;
              }
              return (
                <BestSellersCarousel
                  key={b.id || idx}
                  items={items}
                  title={title}
                  subtitle={b.title_en || ''}
                  moreHref={b.more_href || '/shop'}
                  eyebrow={b.eyebrow || ''}
                />
              );
            }
            case 'category_tiles':
              return <CategoryTiles key={b.id || idx} categories={categories.slice(0, b.limit)} />;
            case 'category_row': {
              const cat = categories.find(c => c.slug === b.category_slug);
              if (!cat || !Array.isArray(cat.products) || !cat.products.length) return null;
              const sliced = { ...cat, products: cat.products.slice(0, b.limit) };
              const anchored = b.show_anchored_banners
                ? (data?.banners?.between_categories || []).filter(x => x.anchor_category === b.category_slug)
                : [];
              const before = anchored.filter(x => (x.anchor_position === 'before'));
              const after = anchored.filter(x => (x.anchor_position !== 'before'));
              return (
                <React.Fragment key={b.id || idx}>
                  {before.map(bb => <PromoBanner key={bb.id} banner={bb} />)}
                  <CategoryRow category={sliced} />
                  {after.map(bb => <PromoBanner key={bb.id} banner={bb} />)}
                </React.Fragment>
              );
            }
            case 'editorial': {
              const img = b.banner_id
                ? safeHttpUrl((data?.banners?.by_id || {})[b.banner_id]?.image_url)
                : (b.image_mode === 'auto'
                    ? (safeHttpUrl((data?.banners?.before_footer || [])[0]?.image_url) ||
                       (data?.new?.[0] ? getOptimizedImageUrl(getPrimaryProductImage(data.new[0]), 1000) : '') ||
                       (heroProduct ? getOptimizedImageUrl(getPrimaryProductImage(heroProduct), 1000) : ''))
                    : '');
              return <EditorialBlock key={b.id || idx} image={img} href={b.href || '/about'} title={b.title_ko} />;
            }
            default:
              return null;
          }
        }
        const g = entry.group;
        const blocks = g.blocks || [];
        const renderBanner = (blk) => <BannerBlock key={blk.id} block={blk} data={data} />;
        if (g.kind === 'half-row' && blocks.length >= 2) {
          return (
            <div key={`grp-${idx}`} className="lux-promo-row">
              {blocks.map((blk) => (
                <div key={blk.id} className={`lux-promo-wrap lux-promo-wrap--${blk.height} lux-promo-wrap--half`}>
                  {renderBanner(blk)}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div key={`grp-${idx}`} className={`lux-promo-wrap lux-promo-wrap--${blocks[0]?.height || 'md'}`}>
            {blocks.map((blk) => renderBanner(blk))}
          </div>
        );
      })}
      {t ? null : null}
    </div>
  );
}

export default HomeBlocks;
