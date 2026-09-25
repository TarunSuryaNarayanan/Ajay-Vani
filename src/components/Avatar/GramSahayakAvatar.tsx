import React from 'react';

interface AvatarProps {
  isSpeaking?: boolean;
  className?: string;
  size?: number;
}

export const GramSahayakAvatar: React.FC<AvatarProps> = ({ 
  isSpeaking = false, 
  className = "",
  size = 112 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
      aria-label="ग्राम सहायक (Gram Sahayak Facilitator)"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible"
      >
        {/* Subtle speaking halo ring in color-trust (#009378) */}
        {isSpeaking && (
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#009378"
            strokeWidth="2"
            opacity="0.5"
            className="animate-ping"
          />
        )}

        {/* Circular base container */}
        <circle cx="50" cy="50" r="46" fill="#F6F6F6" stroke="#009378" strokeWidth="2.5" />

        {/* Shoulders / Civic Sahayak Vest in color-trust (#009378) */}
        <path
          d="M20 90 C22 70, 32 64, 50 64 C68 64, 78 70, 80 90 Z"
          fill="#009378"
        />

        {/* Collar / Nehru jacket line */}
        <path
          d="M44 64 L50 74 L56 64"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="50" y1="74" x2="50" y2="88" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Neck */}
        <rect x="44" y="52" width="12" height="14" rx="2" fill="#E2BA9D" />

        {/* Head / Face */}
        <ellipse cx="50" cy="42" rx="17" ry="20" fill="#F0C7AB" />

        {/* Hair / Headgear */}
        <path
          d="M32 38 C32 24, 40 20, 50 20 C60 20, 68 24, 68 38 C68 28, 62 25, 50 25 C38 25, 32 28, 32 38 Z"
          fill="#2C3437"
        />

        {/* Ears */}
        <circle cx="32" cy="42" r="3.5" fill="#E2BA9D" />
        <circle cx="68" cy="42" r="3.5" fill="#E2BA9D" />

        {/* Eyebrows */}
        <path d="M38 35 Q43 33 46 35" fill="none" stroke="#2C3437" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M54 35 Q57 33 62 35" fill="none" stroke="#2C3437" strokeWidth="1.8" strokeLinecap="round" />

        {/* Eyes */}
        <circle cx="42" cy="39" r="2.2" fill="#14231F" />
        <circle cx="58" cy="39" r="2.2" fill="#14231F" />

        {/* Spectacles (Conveys civic, thoughtful, approachable assistant) */}
        <circle cx="42" cy="39" r="5" fill="none" stroke="#009378" strokeWidth="1.5" />
        <circle cx="58" cy="39" r="5" fill="none" stroke="#009378" strokeWidth="1.5" />
        <line x1="47" y1="39" x2="53" y2="39" stroke="#009378" strokeWidth="1.5" />

        {/* Nose */}
        <path d="M50 40 L49 46 L52 46" fill="none" stroke="#D19E7E" strokeWidth="1.5" strokeLinecap="round" />

        {/* Friendly mouth (Animates slightly when speaking) */}
        {isSpeaking ? (
          <ellipse cx="50" cy="51" rx="4" ry="2.5" fill="#8B4513" />
        ) : (
          <path
            d="M45 50 Q50 54 55 50"
            fill="none"
            stroke="#8B4513"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}

        {/* Livelihood Badge on jacket (Official PM-AJAY symbol) */}
        <circle cx="34" cy="74" r="3.5" fill="#FC8A15" />
      </svg>
    </div>
  );
};
