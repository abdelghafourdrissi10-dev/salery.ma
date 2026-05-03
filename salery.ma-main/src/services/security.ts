import { AuthUser, Permission } from '../types';
import { hasPermission } from './rbac';

/**
 * SECURITY MIDDLEWARE (Simulated)
 * 
 * In a real backend, these would be Express/Next.js middleware.
 * Here they provide a centralized logic for enforcing business rules.
 */

/**
 * VERIFY AUTH: Ensure request has a valid session.
 * Throws 401 if not authenticated.
 */
export const verifyAuth = (user: AuthUser | null): AuthUser => {
    if (!user) {
        throw new Error("401: Unauthorized");
    }
    return user;
};

/**
 * REQUIRE PERMISSION: Ensure user has specific permission.
 * Throws 403 if forbidden.
 */
export const requirePermission = (user: AuthUser | null, permission: Permission): void => {
    if (!hasPermission(user, permission)) {
        throw new Error("403: Forbidden");
    }
};

/**
 * ENFORCE TENANT ISOLATION: Ensure user belongs to the target company.
 * Prevents Cross-Tenant Data Leakage (OWASP Top 10).
 */
export const enforceTenant = (user: AuthUser | null, resource: { companyId?: string }): void => {
    if (!user || user.companyId !== resource.companyId) {
        if (user?.role !== 'SUPER_ADMIN') {
            throw new Error("403: Tenant Isolation Violation");
        }
    }
};

/**
 * AUDIT LOGGING (Simulated Persistent Store)
 */
export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    status: 'SUCCESS' | 'FAILURE';
    ip: string;
}

export const logSecurityEvent = (user: AuthUser | null, action: string, resource: string, status: 'SUCCESS' | 'FAILURE' = 'SUCCESS') => {
    const newLog: AuditLog = {
        id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'ANONYMOUS',
        userEmail: user?.email || 'unknown',
        action,
        resource,
        status,
        ip: '192.168.1.' + Math.floor(Math.random() * 255) // Simulated IP
    };

    const savedLogs = JSON.parse(localStorage.getItem('salery_audit_logs') || '[]');
    localStorage.setItem('salery_audit_logs', JSON.stringify([newLog, ...savedLogs].slice(0, 100)));

    console.log(`[AUDIT] ${newLog.timestamp} | ${newLog.action} | ${newLog.status} | ${newLog.userEmail}`);
};
