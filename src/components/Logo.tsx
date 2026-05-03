import React from 'react';

interface LogoProps {
  className?: string;
  isDark?: boolean;
  iconOnly?: boolean;
  size?: number;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "", isDark = false, iconOnly = false, size, onClick }) => {
  const brandAzure = "#0078D4";
  const brandTeal = "#00A99D";
  const color = isDark ? "white" : brandAzure;

  const iconSize = size ? size : (iconOnly ? 36 : 32);

  return (
    <div className={`flex items-center gap-3 select-none cursor-pointer ${className}`} onClick={onClick}>
      <div className={`relative flex items-center justify-center`}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 overflow-visible"
        >
          {iconOnly && (
            <rect x="0" y="0" width="40" height="40" rx="10" fill={`url(#logo-grad)`} className="shadow-sm" />
          )}
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A66C2" />
              <stop offset="50%" stopColor="#0078D4" />
              <stop offset="100%" stopColor="#00A99D" />
            </linearGradient>
          </defs>
          <path
            d="M28 12C28 12 24 8 20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32C24 32 28 28 28 28"
            stroke={iconOnly ? "white" : color}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-icon-draw"
          />
          <path
            d="M14 20H28"
            stroke={iconOnly ? "white" : brandTeal}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-icon-draw"
            style={{ animationDelay: '0.3s' }}
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none animate-text-reveal text-left">
          <span className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#111827]'}`}>
            salery<span className={isDark ? 'text-white/70' : 'text-[#0078D4]'}>.ma</span>
          </span>
          <span className={`text-[7px] font-black uppercase tracking-[0.4em] mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            AI Payroll Engine
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;