import { AuthUser, Employee } from '../types';

/**
 * TENANT ISOLATION GUARD
 * 
 * Verifies that a resource belongs to the user's company tenant.
 * Prevents Cross-Tenant Data Leakage (BOLA).
 */
export const assertTenant = (user: AuthUser, resource: any, context: string) => {
    if (user.role === 'SUPER_ADMIN') return;

    if (resource.companyId !== user.companyId) {
        console.error(`[SECURITY] Tenant Violation: User ${user.id} attempted to access ${context} ${resource.id}`);
        throw new Error(`Unauthorized: This ${context} does not belong to your organization.`);
    }
};

export const filterByTenant = <T extends { companyId: string }>(user: AuthUser, items: T[]): T[] => {
    if (user.role === 'SUPER_ADMIN') return items;
    return items.filter(item => item.companyId === user.companyId);
};
