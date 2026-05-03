/**
 * SALERY TENANT GUARD — Multi-Tenant Data Isolation
 * 
 * Ensures strict company-level data separation.
 * Every data operation MUST go through these guards.
 */

import { AuthUser } from '../types.ts';

/**
 * Assert that the current user's companyId matches the resource's companyId.
 * Throws if there's a mismatch — preventing cross-tenant data access.
 */
export const assertTenant = (
    user: AuthUser | null,
    resource: { companyId?: string },
    resourceName = 'resource'
): void => {
    if (!user) {
        throw new Error(`[TENANT_GUARD] No authenticated user — cannot access ${resourceName}`);
    }
    // SUPER_ADMIN can access all tenants
    if (user.role === 'SUPER_ADMIN') return;

    if (!resource.companyId) {
        throw new Error(`[TENANT_GUARD] ${resourceName} has no companyId — data integrity violation`);
    }
    if (user.companyId !== resource.companyId) {
        console.error(`[TENANT_GUARD] BLOCKED: User ${user.id} (company ${user.companyId}) tried to access ${resourceName} of company ${resource.companyId}`);
        throw new Error(`[TENANT_GUARD] Cross-tenant access denied for ${resourceName}`);
    }
};

/**
 * Filter an array of items to only include those belonging to the user's company.
 */
export const filterByTenant = <T extends { companyId?: string }>(
    items: T[],
    user: AuthUser | null
): T[] => {
    if (!user) return [];
    // SUPER_ADMIN sees all
    if (user.role === 'SUPER_ADMIN') return items;
    return items.filter(item => item.companyId === user.companyId);
};

/**
 * Auto-inject the user's companyId into a new data object.
 */
export const injectTenantId = <T extends Record<string, any>>(
    data: T,
    user: AuthUser | null
): T & { companyId: string } => {
    if (!user) throw new Error('[TENANT_GUARD] Cannot inject tenant — no authenticated user');
    return { ...data, companyId: user.companyId };
};

/**
 * For SITE_MANAGER role: filter employees to only those in the assigned site.
 */
export const filterBySite = <T extends { assignedSite?: string; siteId?: string }>(
    items: T[],
    user: AuthUser | null
): T[] => {
    if (!user || user.role !== 'SITE_MANAGER' || !user.assignedSite) return items;
    return items.filter(
        item => item.assignedSite === user.assignedSite || item.siteId === user.assignedSite
    );
};
