/**
 * SALERY RBAC ENGINE — Enterprise Permission System
 * 
 * ALL access checks go through this module.
 * Never hardcode role checks elsewhere in the app.
 */

import { AuthUser, Permission, UserRole } from '../types.ts';

// ─── MASTER PERMISSION MATRIX ────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    SUPER_ADMIN: [
        'EMPLOYEE_VIEW', 'PAYROLL_VIEW', 'DOCUMENT_VIEW',
        'FINANCIAL_EXPORT', 'ANALYTICS_VIEW', 'SUBSCRIPTION_MANAGE', 'SITE_VIEW',
        'HISTORICAL_AUDIT_MANAGE',
    ],

    COMPANY_OWNER: [
        'EMPLOYEE_MANAGE', 'EMPLOYEE_VIEW',
        'PAYROLL_EDIT', 'PAYROLL_APPROVE', 'PAYROLL_VIEW',
        'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW',
        'FINANCIAL_EXPORT',
        'ABSENCE_MANAGE', 'ABSENCE_APPROVE',
        'RECRUITMENT_MANAGE',
        'COMPANY_SETTINGS_EDIT', 'SUBSCRIPTION_MANAGE',
        'ANALYTICS_VIEW', 'SITE_VIEW', 'HISTORICAL_AUDIT_MANAGE',
    ],

    DIRECTEUR_RH: [
        'EMPLOYEE_MANAGE', 'EMPLOYEE_VIEW',
        'PAYROLL_EDIT', 'PAYROLL_APPROVE', 'PAYROLL_VIEW',
        'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW',
        'ABSENCE_MANAGE', 'ABSENCE_APPROVE',
        'RECRUITMENT_MANAGE',
        'ANALYTICS_VIEW', 'SITE_VIEW', 'HISTORICAL_AUDIT_MANAGE',
        'COMPANY_SETTINGS_EDIT'
    ],

    TEAM_RH: [
        'EMPLOYEE_MANAGE', 'EMPLOYEE_VIEW',
        'PAYROLL_EDIT', 'PAYROLL_VIEW',
        'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW',
        'ABSENCE_MANAGE',
        'RECRUITMENT_MANAGE',
        'SITE_VIEW',
        'COMPANY_SETTINGS_EDIT'
    ],

    COMPTABLE: [
        'PAYROLL_EDIT', 'PAYROLL_VIEW',
        'DOCUMENT_VIEW',
        'FINANCIAL_EXPORT',
        'ANALYTICS_VIEW',
    ],

    SITE_MANAGER: [
        'EMPLOYEE_VIEW', // Site-scoped only
        'ABSENCE_APPROVE',
        'SITE_VIEW',
    ],

    EMPLOYEE: [
        'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW',
    ],
};

// ─── MODULE PERMISSION MAP ───────────────────────────────────────────
const MODULE_PERMISSIONS: Record<string, Permission> = {
    dash: 'ANALYTICS_VIEW',
    portal: 'DOCUMENT_VIEW',      // Employee self-service portal
    empDocs: 'DOCUMENT_VIEW',     // Mes Documents
    empPay: 'DOCUMENT_VIEW',      // Mes Bulletins
    empLeaves: 'DOCUMENT_VIEW',   // Mes Congés
    emps: 'EMPLOYEE_VIEW',
    recrut: 'RECRUITMENT_MANAGE',
    sites: 'SITE_VIEW',
    pointage: 'EMPLOYEE_VIEW',
    workTime: 'EMPLOYEE_MANAGE',
    primes: 'PAYROLL_EDIT',
    calc: 'PAYROLL_VIEW',
    cnssRisk: 'ANALYTICS_VIEW',
    leaves: 'ABSENCE_MANAGE',
    calendar: 'EMPLOYEE_VIEW',
    compliance: 'ANALYTICS_VIEW',
    reports: 'FINANCIAL_EXPORT',
    advisor: 'ANALYTICS_VIEW',
    docs: 'EMPLOYEE_MANAGE',      // Coffre Documents / Legal Engine — HR+ only
    settings: 'COMPANY_SETTINGS_EDIT',
    reconstruction: 'HISTORICAL_AUDIT_MANAGE',
};

// ─── ROLE DEFAULT TABS ──────────────────────────────────────────────
export const ROLE_DEFAULT_TAB: Record<UserRole, string> = {
    SUPER_ADMIN: 'dash',
    COMPANY_OWNER: 'dash',
    DIRECTEUR_RH: 'dash',
    TEAM_RH: 'emps',
    COMPTABLE: 'calc',
    SITE_MANAGER: 'pointage',
    EMPLOYEE: 'portal',
};

// ─── PERMISSION CHECKS ──────────────────────────────────────────────
export const hasPermission = (user: AuthUser | null, perm: Permission): boolean => {
    if (!user) return false;
    // Guard against old persisted users without permissions array
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    // EMPLOYEE always has access to own portal
    if (perm === 'DOCUMENT_VIEW' && user.role === 'EMPLOYEE') return true;
    return user.permissions.includes(perm);
};

export const hasAnyPermission = (user: AuthUser | null, perms: Permission[]): boolean => {
    if (!user) return false;
    return perms.some(p => hasPermission(user, p));
};

export const canAccessModule = (user: AuthUser | null, moduleId: string): boolean => {
    if (!user) return false;

    // EMPLOYEE: strict allowlist — only their own self-service modules
    if (user.role === 'EMPLOYEE') {
        return ['portal', 'empDocs', 'empPay', 'empLeaves', 'settings'].includes(moduleId);
    }

    // SUPER_ADMIN sees everything
    if (user.role === 'SUPER_ADMIN') return true;

    const requiredPerm = MODULE_PERMISSIONS[moduleId];
    if (!requiredPerm) return false;
    return hasPermission(user, requiredPerm);
};

export const getPermissionsForRole = (role: UserRole): Permission[] => {
    return ROLE_PERMISSIONS[role] || [];
};

// ─── ROLE BADGE UI ──────────────────────────────────────────────────
export interface RoleBadgeInfo {
    label: string;
    labelAr: string;
    color: string;     // Tailwind bg class
    textColor: string; // Tailwind text class
    hex: string;       // Raw hex for custom rendering
}

export const ROLE_BADGES: Record<UserRole, RoleBadgeInfo> = {
    SUPER_ADMIN: {
        label: 'Super Admin',
        labelAr: 'مدير النظام',
        color: 'bg-red-100',
        textColor: 'text-red-700',
        hex: '#DC2626',
    },
    COMPANY_OWNER: {
        label: 'Propriétaire',
        labelAr: 'المالك',
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        hex: '#1E40AF',
    },
    DIRECTEUR_RH: {
        label: 'Directeur RH',
        labelAr: 'مدير الموارد البشرية',
        color: 'bg-teal-100',
        textColor: 'text-teal-700',
        hex: '#0D9488',
    },
    TEAM_RH: {
        label: 'Équipe RH',
        labelAr: 'فريق الموارد البشرية',
        color: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        hex: '#059669',
    },
    COMPTABLE: {
        label: 'Comptable',
        labelAr: 'المحاسب',
        color: 'bg-purple-100',
        textColor: 'text-purple-700',
        hex: '#7C3AED',
    },
    SITE_MANAGER: {
        label: 'Chef de Site',
        labelAr: 'مدير الموقع',
        color: 'bg-amber-100',
        textColor: 'text-amber-700',
        hex: '#D97706',
    },
    EMPLOYEE: {
        label: 'Employé',
        labelAr: 'موظف',
        color: 'bg-gray-100',
        textColor: 'text-gray-600',
        hex: '#6B7280',
    },
};

export const getRoleBadge = (role: UserRole): RoleBadgeInfo => {
    return ROLE_BADGES[role] || ROLE_BADGES.EMPLOYEE;
};
