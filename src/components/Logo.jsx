import React from 'react';

/**
 * Premium, minimalist editorial SVG logo for AEVA.
 * Combines an elegant serif "A" intertwined with a delicate golden heart and romantic star.
 * Uses brand gold (#C59B63) and espresso (#2B1F1A).
 */
export default function Logo({ className = 'w-8 h-8', ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="AEVA Logo"
      {...props}
    >
      <defs>
        {/* Luxury Gold Gradient */}
        <linearGradient id="aeva-gold-grad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#C59B63" />
          <stop offset="100%" stopColor="#9E743A" />
        </linearGradient>

        {/* Deep Espresso Gradient */}
        <linearGradient id="aeva-espresso-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B1F1A" />
          <stop offset="100%" stopColor="#433129" />
        </linearGradient>

        {/* Soft Radial Glow for Heart */}
        <radialGradient id="aeva-heart-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FAF7F2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle Circular Halo Ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="url(#aeva-gold-grad)"
        strokeWidth="1.2"
        strokeDasharray="2 3"
        strokeOpacity="0.55"
      />

      {/* Classical Serif "A" */}
      <g id="letter-A">
        {/* Left Hairline Stroke */}
        <path
          d="M48 24 L27 77"
          stroke="url(#aeva-espresso-grad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Left Foot Serif */}
        <path
          d="M21 77 L33 77"
          stroke="url(#aeva-espresso-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Right Main Stem (Calligraphic contrast) */}
        <path
          d="M48 24 L52 24 L73 77 L67 77 Z"
          fill="url(#aeva-espresso-grad)"
        />

        {/* Right Foot Serif */}
        <path
          d="M62 77 L78 77"
          stroke="url(#aeva-espresso-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Top Serif Apex */}
        <path
          d="M43 24 L56 24"
          stroke="url(#aeva-espresso-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Intertwined Delicate Romantic Heart Crossbar */}
      <path
        d="M34 56 C34 49 42 46 50 53 C58 46 66 49 66 56 C66 64 54 70 50 73 C46 70 34 64 34 56 Z"
        fill="none"
        stroke="url(#aeva-gold-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Romantic Sparkle / Diamond Star at Apex */}
      <path
        d="M50 14 Q50 19 55 19 Q50 19 50 24 Q50 19 45 19 Q50 19 50 14 Z"
        fill="url(#aeva-gold-grad)"
      />

      {/* Tiny Center Heart Gem Accent */}
      <circle cx="50" cy="58" r="1.6" fill="url(#aeva-gold-grad)" />
    </svg>
  );
}
