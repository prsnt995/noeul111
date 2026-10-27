import React from 'react';
import { DEFAULT_DELIVERY_CONFIG } from '../../config/delivery.js';

/**
 * FastDeliveryBanner
 *
 * A luxury Korean fashion delivery banner positioned below the NOEUL navigation
 * and above the Best Items section.
 *
 * Palette:
 * - Background: Warm ivory (#F7F3ED)
 * - Secondary: Soft beige (#EAE0D4)
 * - Main text: Black (#171717)
 * - Accent: Champagne gold (#B49462)
 * - Supporting text: Warm gray (#77716B)
 */
export function FastDeliveryBanner({
  config = DEFAULT_DELIVERY_CONFIG,
  className = '',
  style = {},
}) {
  const {
    enabled = true,
    smallHeading = DEFAULT_DELIVERY_CONFIG.smallHeading,
    mainHeading = DEFAULT_DELIVERY_CONFIG.mainHeading,
    supportingText = DEFAULT_DELIVERY_CONFIG.supportingText,
    additionalText = DEFAULT_DELIVERY_CONFIG.additionalText,
    disclaimerText = DEFAULT_DELIVERY_CONFIG.disclaimerText,
  } = config;

  if (!enabled) return null;

  return (
    <section
      className={`fast-delivery-banner ${className}`}
      style={style}
      aria-label="빠른 배송 안내"
    >
      {/* Soft silk fabric wave background texture */}
      <div className="fast-delivery-banner__texture" aria-hidden="true">
        <svg
          className="fast-delivery-banner__silk-svg"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0C320 40 460 120 720 70C980 20 1160 140 1440 60V180H0V0Z"
            fill="url(#silk-gradient-1)"
            opacity="0.35"
          />
          <path
            d="M0 40C280 130 520 20 840 90C1120 150 1280 40 1440 110V180H0V40Z"
            fill="url(#silk-gradient-2)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="silk-gradient-1" x1="0" y1="0" x2="1440" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F2ECE4" />
              <stop offset="0.5" stopColor="#EAE0D4" />
              <stop offset="1" stopColor="#E0D2C0" />
            </linearGradient>
            <linearGradient id="silk-gradient-2" x1="1440" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAF7F2" />
              <stop offset="0.6" stopColor="#EAE0D4" stopOpacity="0.8" />
              <stop offset="1" stopColor="#E6DAC8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="fast-delivery-banner__inner">
        {/* Left balance placeholder (ensures optical center on desktop) */}
        <div className="fast-delivery-banner__side-spacer" aria-hidden="true" />

        {/* Center promotional message */}
        <div className="fast-delivery-banner__content">
          {/* Small Heading + Champagne Gold Delivery Truck */}
          <div className="fast-delivery-banner__header-line">
            <span className="fast-delivery-banner__truck-wrapper" aria-hidden="true">
              <svg
                className="fast-delivery-banner__truck-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Minimalist Champagne Gold Delivery Truck */}
                <path
                  d="M1 4.5C1 3.67157 1.67157 3 2.5 3H14.5C15.3284 3 16 3.67157 16 4.5V14.5C16 15.3284 15.3284 16 14.5 16H2.5C1.67157 16 1 15.3284 1 14.5V4.5Z"
                  stroke="#B49462"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 6.5H19.2C19.642 6.5 20.0573 6.71181 20.3162 7.0702L22.6162 10.2555C22.8643 10.5989 23 11.0135 23 11.439V14.5C23 15.3284 22.3284 16 21.5 16H16V6.5Z"
                  stroke="#B49462"
                  strokeWidth="1.5"
                />
                <circle cx="6" cy="18" r="2.25" stroke="#B49462" strokeWidth="1.5" fill="#F7F3ED" />
                <circle cx="18" cy="18" r="2.25" stroke="#B49462" strokeWidth="1.5" fill="#F7F3ED" />
                <path d="M8.25 18H15.75" stroke="#B49462" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1 18H3.75" stroke="#B49462" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M4 7H9" stroke="#B49462" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
                <path d="M4 10H7.5" stroke="#B49462" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
              </svg>
            </span>
            <span className="fast-delivery-banner__small-heading">
              {smallHeading}
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="fast-delivery-banner__main-heading">
            {mainHeading}
          </h2>

          {/* Supporting Text & Additional Badge */}
          <div className="fast-delivery-banner__details">
            <span className="fast-delivery-banner__supporting-text">
              {supportingText}
            </span>
            <span className="fast-delivery-banner__divider" aria-hidden="true">·</span>
            <span className="fast-delivery-banner__additional-badge">
              <span className="fast-delivery-banner__badge-dot" aria-hidden="true" />
              {additionalText}
            </span>
          </div>

          {/* Qualified Carrier Terms Caveat */}
          {disclaimerText && (
            <p className="fast-delivery-banner__disclaimer">
              * {disclaimerText}
            </p>
          )}
        </div>

        {/* Right Side: Elegant NOEUL-Branded Delivery Package */}
        <div className="fast-delivery-banner__package-wrapper" aria-hidden="true">
          <svg
            className="fast-delivery-banner__package-svg"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Ambient Shadow */}
            <ellipse cx="80" cy="108" rx="60" ry="8" fill="#B49462" opacity="0.12" />
            <ellipse cx="80" cy="108" rx="42" ry="5" fill="#171717" opacity="0.08" />

            {/* Luxury Boutique Delivery Box */}
            <g id="noeul-box">
              {/* Box Base (Rigid Fashion Box) */}
              <rect
                x="28"
                y="38"
                width="104"
                height="64"
                rx="5"
                fill="url(#box-gradient)"
                stroke="#D6C7B2"
                strokeWidth="1.2"
              />

              {/* Box Lid Upper Rim */}
              <rect
                x="25"
                y="34"
                width="110"
                height="16"
                rx="4"
                fill="url(#lid-gradient)"
                stroke="#D6C7B2"
                strokeWidth="1.2"
              />
              <line x1="25" y1="50" x2="135" y2="50" stroke="#CBB9A0" strokeWidth="0.8" opacity="0.6" />

              {/* Vertical Champagne Gold Silk Ribbon */}
              <rect x="73" y="34" width="14" height="68" fill="url(#gold-ribbon-v)" />
              <line x1="73" y1="34" x2="73" y2="102" stroke="#D8BA84" strokeWidth="0.5" opacity="0.6" />
              <line x1="87" y1="34" x2="87" y2="102" stroke="#9A7B4A" strokeWidth="0.5" opacity="0.6" />

              {/* Horizontal Champagne Gold Silk Ribbon */}
              <rect x="28" y="64" width="104" height="12" fill="url(#gold-ribbon-h)" />
              <line x1="28" y1="64" x2="132" y2="64" stroke="#D8BA84" strokeWidth="0.5" opacity="0.6" />
              <line x1="28" y1="76" x2="132" y2="76" stroke="#9A7B4A" strokeWidth="0.5" opacity="0.6" />

              {/* Center Ribbon Crossing Knot */}
              <rect x="73" y="64" width="14" height="12" fill="#C4A670" />

              {/* Embossed NOEUL Wordmark on Box Front */}
              <text
                x="48"
                y="91"
                fontFamily="'Cormorant Garamond', 'Georgia', serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="2.5"
                fill="#8C734B"
                opacity="0.9"
              >
                NOEUL
              </text>

              {/* Luxury Silk Bow on top */}
              {/* Left loop */}
              <path
                d="M80 34 C66 22 52 24 60 32 C66 36 74 35 80 34Z"
                fill="url(#gold-ribbon-v)"
                stroke="#A88753"
                strokeWidth="0.75"
              />
              {/* Right loop */}
              <path
                d="M80 34 C94 22 108 24 100 32 C94 36 86 35 80 34Z"
                fill="url(#gold-ribbon-v)"
                stroke="#A88753"
                strokeWidth="0.75"
              />
              {/* Center Bow Knot */}
              <circle cx="80" cy="34" r="3.5" fill="#D4AF37" stroke="#9A7B4A" strokeWidth="0.75" />

              {/* Elegant Hanging Brand Tag */}
              <path d="M82 36 L104 52" stroke="#B49462" strokeWidth="1" strokeDasharray="1.5 1.5" />
              <g transform="translate(98, 48) rotate(18)">
                <rect
                  x="0"
                  y="0"
                  width="28"
                  height="16"
                  rx="2"
                  fill="#FDFBF7"
                  stroke="#CBB9A0"
                  strokeWidth="0.8"
                />
                <circle cx="4" cy="8" r="1.5" fill="#B49462" />
                <text
                  x="8"
                  y="11"
                  fontFamily="'Pretendard', sans-serif"
                  fontSize="5.5"
                  fontWeight="600"
                  letterSpacing="0.8"
                  fill="#5A4E3E"
                >
                  SEOUL
                </text>
              </g>
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="box-gradient" x1="28" y1="38" x2="132" y2="102" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FAF7F2" />
                <stop offset="0.6" stopColor="#F3EDE4" />
                <stop offset="1" stopColor="#E8DFD3" />
              </linearGradient>
              <linearGradient id="lid-gradient" x1="25" y1="34" x2="135" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.5" stopColor="#F8F3EC" />
                <stop offset="1" stopColor="#ECE3D6" />
              </linearGradient>
              <linearGradient id="gold-ribbon-v" x1="73" y1="20" x2="87" y2="102" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D8BE8D" />
                <stop offset="0.3" stopColor="#B49462" />
                <stop offset="0.7" stopColor="#C9A86E" />
                <stop offset="1" stopColor="#9C7D47" />
              </linearGradient>
              <linearGradient id="gold-ribbon-h" x1="28" y1="64" x2="132" y2="76" gradientUnits="userSpaceOnUse">
                <stop stopColor="#B49462" />
                <stop offset="0.4" stopColor="#D8BE8D" />
                <stop offset="0.7" stopColor="#C4A367" />
                <stop offset="1" stopColor="#9C7D47" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
}
