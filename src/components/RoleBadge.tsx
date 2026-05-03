import React from 'react';
import { UserRole, Language } from '../types';
import { getRoleBadge } from '../services/rbac';

interface Props {
    role: UserRole;
    lang?: Language;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[10px] px-3 py-1',
    lg: 'text-xs px-4 py-1.5',
};

const RoleBadge: React.FC<Props> = ({ role, lang = 'fr', size = 'md' }) => {
    const badge = getRoleBadge(role);
    const label = lang === 'ar' ? badge.labelAr : badge.label;

    return (
        <span
            className={`
        inline-flex items-center font-black uppercase tracking-widest rounded-full
        ${badge.color} ${badge.textColor} ${sizeClasses[size]}
      `}
        >
            {label}
        </span>
    );
};

export default RoleBadge;
