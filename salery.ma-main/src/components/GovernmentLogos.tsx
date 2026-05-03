import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const CnssLogo: React.FC<LogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="10" fill="#0052FF" />
    <path d="M20 10V30M10 20H30" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
  </svg>
);

export const DgiLogo: React.FC<LogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 2L38 11V29L20 38L2 29V11L20 2Z" fill="#0E6F5C" />
    <path d="M20 10V30" stroke="#F4B400" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 15H26M14 25H26" stroke="#F4B400" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const CmirLogo: React.FC<LogoProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="10" fill="#4F46E5" />
    <path d="M12 28V12H28V28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18H28M12 23H28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <circle cx="20" cy="32" r="2" fill="#F4B400" />
  </svg>
);