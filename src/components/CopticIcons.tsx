import React from 'react';

export const CopticCross: React.FC<{ className?: string; size?: number }> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Authentic Coptic Cross with 4 arms, flared ends with trefoils, and central halo */}
    <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="4" />
    <circle cx="50" cy="50" r="7" fill="currentColor" />
    {/* Vertical arm */}
    <rect x="46" y="8" width="8" height="84" rx="2" />
    {/* Horizontal arm */}
    <rect x="8" y="46" width="84" height="8" rx="2" />
    {/* Top flared terminals */}
    <circle cx="50" cy="7" r="5" />
    <circle cx="42" cy="11" r="4" />
    <circle cx="58" cy="11" r="4" />
    {/* Bottom flared terminals */}
    <circle cx="50" cy="93" r="5" />
    <circle cx="42" cy="89" r="4" />
    <circle cx="58" cy="89" r="4" />
    {/* Left flared terminals */}
    <circle cx="7" cy="50" r="5" />
    <circle cx="11" cy="42" r="4" />
    <circle cx="11" cy="58" r="4" />
    {/* Right flared terminals */}
    <circle cx="93" cy="50" r="5" />
    <circle cx="89" cy="42" r="4" />
    <circle cx="89" cy="58" r="4" />
    {/* Corner radiating points (Coptic style) */}
    <path d="M28 28 L36 36 M64 36 L72 28 M28 72 L36 64 M64 64 L72 72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const CopticDove: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Ti Etchrompi means The Dove in Coptic! "Ϯϭⲣⲟⲙⲡⲓ" */}
    <path d="M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12z" />
    <path d="M8 12c-2-1-4-1-6 1 2 2 4 2 6 0z" />
    <path d="M16 12c2-1 4-1 6 1-2 2-4 2-6 0z" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

export const SchoolSeal: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <div className={`relative flex items-center justify-center rounded-full border-2 border-[#c5a059] bg-[#0c1a30] text-[#c5a059] p-2 shadow-md ${className}`}>
    <div className="absolute inset-1 rounded-full border border-dashed border-[#c5a059]/40 pointer-events-none" />
    <div className="flex flex-col items-center justify-center">
      <CopticCross className="w-8 h-8 text-[#c5a059]" />
      <span className="text-[9px] font-bold tracking-wider mt-0.5 text-[#e0c588]">ϮϭⲢⲞⲘⲠⲒ</span>
    </div>
  </div>
);

export const HymnInstrumentsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Cymbals (الدف) and Triangle (التريانتو) */}
    <circle cx="9" cy="12" r="7" />
    <circle cx="9" cy="12" r="2" fill="currentColor" />
    <path d="M16 7l5 10h-10l5-10z" />
    <line x1="16" y1="3" x2="16" y2="7" />
  </svg>
);
