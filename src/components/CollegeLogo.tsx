import React, { useState } from 'react';

interface CollegeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTitle?: boolean;
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  size = 'md',
  className = '',
  showTitle = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  return (
    <div className={`flex items-center space-x-3.5 ${className}`}>
      <div className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden bg-white p-1.5 border-2 border-white shadow-md ring-2 ring-amber-400/80 shrink-0 flex items-center justify-center transition-transform hover:scale-105`}>
        {!imgError ? (
          <img
            src="/edupulse_logo.jpg"
            alt="EduPulse Digboi College Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src.includes('edupulse_logo.jpg')) {
                img.src = '/digboi_college_logo.jpg';
              } else if (img.src.includes('digboi_college_logo.jpg')) {
                img.src = '/digboi_college_logo.svg';
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          /* SVG Vector Representation of Simplified EduPulse Logo */
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <linearGradient id="fallbackPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="35%" stopColor="#0066b2" />
                <stop offset="65%" stopColor="#00b090" />
                <stop offset="100%" stopColor="#00cc88" />
              </linearGradient>
            </defs>
            {/* 1. Digboi College (Autonomous) */}
            <text x="250" y="110" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="900" fill="#004b87" letterSpacing="1">
              Digboi College (Autonomous)
            </text>
            {/* 2. Estd. 1965 */}
            <text x="250" y="148" textAnchor="middle" fontFamily="sans-serif" fontSize="16" fontWeight="800" fill="#d97706" letterSpacing="2">
              Estd. 1965
            </text>
            {/* 3. Horizontal Pulse below Estd. 1965 */}
            <line x1="30" y1="210" x2="470" y2="210" stroke="#f1f5f9" strokeWidth="4" />
            <path
              d="M 30,210 L 140,210 L 155,222 L 170,175 L 195,250 L 220,155 L 245,265 L 270,185 L 290,222 L 305,210 L 470,210"
              fill="none"
              stroke="url(#fallbackPulseGrad)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 4. EduPulse */}
            <text x="250" y="335" textAnchor="middle" fontFamily="sans-serif" fontSize="82" fontWeight="900" letterSpacing="-1">
              <tspan fill="#004b87">Edu</tspan>
              <tspan fill="#00ab6c">Pulse</tspan>
            </text>
            {/* 5. Igniting Learning and Engagement */}
            <text x="250" y="395" textAnchor="middle" fontFamily="sans-serif" fontSize="19" fontWeight="800" fill="#004b87" letterSpacing="1.5">
              Igniting Learning and Engagement
            </text>
          </svg>
        )}
      </div>

      {showTitle && (
        <div>
          <h1 className="font-extrabold text-white text-lg tracking-tight leading-tight">
            EduPulse
          </h1>
          <p className="text-xs text-blue-100 font-semibold tracking-wide">
            Digboi College (Autonomous)
          </p>
          <div className="mt-1">
            <span className="inline-block bg-amber-400 text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
              Estd. 1965
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeLogo;
