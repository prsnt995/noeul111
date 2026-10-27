import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_DELIVERY_CONFIG } from '../src/config/delivery.js';

function read(rel) {
  return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
}

describe('Fast Delivery Banner Configuration & Component', () => {
  it('DEFAULT_DELIVERY_CONFIG satisfies required Korean banner text and shipping guidelines', () => {
    expect(DEFAULT_DELIVERY_CONFIG.smallHeading).toBe('NOEUL FAST DELIVERY');
    expect(DEFAULT_DELIVERY_CONFIG.mainHeading).toBe('오늘 출발 내일 도착');
    expect(DEFAULT_DELIVERY_CONFIG.supportingText).toBe('평일 오후 4시 이전 주문 시');
    expect(DEFAULT_DELIVERY_CONFIG.additionalText).toBe('당일 출발 · 익일 도착');
    expect(DEFAULT_DELIVERY_CONFIG.cutoffHour).toBe(16);
    expect(DEFAULT_DELIVERY_CONFIG.courierName).toBe('CJ대한통운');
    // Claim must be qualified with carrier terms rather than an absolute guaranteed claim
    expect(DEFAULT_DELIVERY_CONFIG.guaranteed).toBe(false);
    expect(DEFAULT_DELIVERY_CONFIG.disclaimerText).toContain('제주·도서산간 제외');
    expect(DEFAULT_DELIVERY_CONFIG.disclaimerText).toContain('택배사');
  });

  it('FastDeliveryBanner component has proper accessibility and luxury elements', () => {
    const src = read('src/components/home/FastDeliveryBanner.jsx');
    expect(src.includes('aria-label="빠른 배송 안내"'), 'accessible landmark label').toBe(true);
    expect(src.includes('fast-delivery-banner__truck-icon'), 'truck icon class').toBe(true);
    expect(src.includes('fast-delivery-banner__package-svg'), 'package svg class').toBe(true);
    expect(src.includes('NOEUL'), 'branded package wordmark').toBe(true);
    expect(src.includes('#B49462'), 'champagne gold color code in SVG').toBe(true);
  });

  it('HomePage mounts FastDeliveryBanner immediately before BestSellersCarousel', () => {
    const src = read('src/pages/HomePage.jsx');
    const bannerIdx = src.indexOf('<FastDeliveryBanner />');
    const carouselIdx = src.indexOf('<BestSellersCarousel');
    expect(bannerIdx, 'FastDeliveryBanner must be present').toBeGreaterThan(-1);
    expect(carouselIdx, 'BestSellersCarousel must be present').toBeGreaterThan(-1);
    expect(bannerIdx, 'FastDeliveryBanner must be placed above BestSellersCarousel').toBeLessThan(carouselIdx);
  });

  it('CSS includes required color tokens, dimensions, and animations', () => {
    const css = read('src/index.css');
    // Color tokens verification
    expect(css.includes('#F7F3ED'), 'Warm ivory #F7F3ED').toBe(true);
    expect(css.includes('#EAE0D4'), 'Soft beige #EAE0D4').toBe(true);
    expect(css.includes('#171717'), 'Black #171717').toBe(true);
    expect(css.includes('#B49462'), 'Champagne gold #B49462').toBe(true);
    expect(css.includes('#77716B'), 'Warm gray #77716B').toBe(true);

    // Height specifications: Desktop 160-180px, Mobile 110-140px
    expect(css.includes('height: 170px'), 'Desktop banner height within 160-180px').toBe(true);
    expect(css.includes('height: 125px'), 'Mobile banner height within 110-140px').toBe(true);

    // Animations: fade-in and subtle truck glide
    expect(css.includes('noeulBannerFadeIn'), 'Fade in keyframe').toBe(true);
    expect(css.includes('noeulTruckGlide'), 'Truck glide keyframe').toBe(true);

    // Reduced motion accessibility
    expect(css.includes('prefers-reduced-motion: reduce'), 'prefers-reduced-motion check').toBe(true);
  });
});
