import React from 'react';
import { DEFAULT_DELIVERY_CONFIG } from '../../config/delivery.js';

/**
 * FastDeliveryBanner
 *
 * A luxury Korean fashion delivery banner positioned below the NOEUL navigation
 * and above the Best Items section, matching the NOEUL signature design mockup:
 * - Flowing ivory silk satin and luxury NOEUL package background
 * - Minimalist champagne-gold delivery truck icon with speed motion trails
 * - Centered "NOEUL FAST DELIVERY" serif heading
 * - High-contrast "오늘 출발" (black) + "내일 도착" (champagne gold)
 * - Supporting "평일 오후 4시 이전 주문 시 | 당일 출발 · 익일 도착"
 */
export function FastDeliveryBanner({
  config = DEFAULT_DELIVERY_CONFIG,
  className = '',
  style = {},
}) {
  const {
    enabled = true,
    smallHeading = DEFAULT_DELIVERY_CONFIG.smallHeading,
    mainHeadingBlack = DEFAULT_DELIVERY_CONFIG.mainHeadingBlack,
    mainHeadingGold = DEFAULT_DELIVERY_CONFIG.mainHeadingGold,
    supportingText = DEFAULT_DELIVERY_CONFIG.supportingText,
    additionalText = DEFAULT_DELIVERY_CONFIG.additionalText,
    disclaimerText = DEFAULT_DELIVERY_CONFIG.disclaimerText,
  } = config;

  if (!enabled) return null;

  return (
    <section
      className={`fast-delivery-banner ${className}`}
      style={style}
      aria-label="빠른 배송 안내: 오늘 출발 내일 도착"
      title={disclaimerText || undefined}
    >
      <div className="fast-delivery-banner__inner">
        <div className="fast-delivery-banner__content">
          {/* Small Heading */}
          <span className="fast-delivery-banner__small-heading">
            {smallHeading}
          </span>

          {/* Main Heading Row with Animated Champagne Gold Truck */}
          <div className="fast-delivery-banner__main-row">
            <span
              className="fast-delivery-banner__truck-wrapper"
              aria-hidden="true"
            >
              <svg
                className="fast-delivery-banner__truck-icon"
                viewBox="0 0 78 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 3 Speed Motion Trails */}
                <path
                  d="M4 14H24"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0 24H24"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 34H24"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Truck Cargo Body */}
                <rect
                  x="25"
                  y="4"
                  width="31"
                  height="28"
                  rx="2"
                  stroke="#B89458"
                  strokeWidth="2.5"
                />

                {/* Truck Cab */}
                <path
                  d="M56 12H64.5L71 21.5V32H56"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <line
                  x1="56"
                  y1="21.5"
                  x2="70"
                  y2="21.5"
                  stroke="#B89458"
                  strokeWidth="2.5"
                />

                {/* Wheels */}
                <circle
                  cx="37"
                  cy="34"
                  r="5"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  fill="#FAF6F0"
                />
                <circle
                  cx="64"
                  cy="34"
                  r="5"
                  stroke="#B89458"
                  strokeWidth="2.5"
                  fill="#FAF6F0"
                />
              </svg>
            </span>

            <h2 className="fast-delivery-banner__main-heading">
              <span className="fast-delivery-banner__heading-black">
                {mainHeadingBlack}
              </span>
              <span className="fast-delivery-banner__heading-gold">
                {mainHeadingGold}
              </span>
            </h2>
          </div>

          {/* Supporting Text Row */}
          <div className="fast-delivery-banner__sub-row">
            <span className="fast-delivery-banner__supporting-text">
              {supportingText}
            </span>
            <span
              className="fast-delivery-banner__separator"
              aria-hidden="true"
            >
              |
            </span>
            <span className="fast-delivery-banner__additional-text">
              {additionalText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
