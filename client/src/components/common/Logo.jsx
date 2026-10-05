import React from 'react';

export default function Logo({ size = 32, showText = true, subtitle = 'Indian Equity & IPO Research' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Modern Financial Candlestick Breakout Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(37, 99, 235, 0.35))' }}
      >
        <defs>
          <linearGradient id="skLogoGrad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="skLineGrad" x1="6" y1="24" x2="26" y2="9" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Rounded Squircle Container */}
        <rect width="34" height="34" rx="9" fill="url(#skLogoGrad)" />
        <rect x="0.5" y="0.5" width="33" height="33" rx="8.5" stroke="rgba(255, 255, 255, 0.2)" />

        {/* Candlestick 1 (Left) */}
        <line x1="9.5" y1="17" x2="9.5" y2="24" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="8" y="18" width="3" height="4.5" rx="0.8" fill="#FFFFFF" fillOpacity="0.85" />

        {/* Candlestick 2 (Center) */}
        <line x1="16" y1="13" x2="16" y2="25" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="14.5" y="14.5" width="3" height="7.5" rx="0.8" fill="#FFFFFF" fillOpacity="0.95" />

        {/* Candlestick 3 (Right) */}
        <line x1="22.5" y1="9" x2="22.5" y2="22" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="21" y="11" width="3" height="8" rx="0.8" fill="#FFFFFF" />

        {/* Upward Breakout Trendline */}
        <path
          d="M7 23.5 C 11 22, 14 17.5, 25.5 9.5"
          stroke="url(#skLineGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Glowing Head Marker */}
        <circle cx="25.5" cy="9.5" r="2.6" fill="#38BDF8" />
        <circle cx="25.5" cy="9.5" r="1.3" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Stock</span>
            <span style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}>
              Knowledge
            </span>
          </div>
          {subtitle && (
            <div style={{
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              marginTop: '1px'
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
