import { Employee, AuthUser, SystemUser } from '../types.ts';
import { getPermissionsForRole } from './rbac.ts';
import { assertTenant } from './tenantGuard.ts';
import { logSecurityEvent } from './security.ts';

/**
 * Provision a new user account for an employee.
 * Enforces tenant isolation and injects RBAC permissions.
 */
export const provisionUserAccount = async (employee: Employee, admin: AuthUser): Promise<SystemUser> => {
  // TENANT GUARD: Ensure admin belongs to the same company
  assertTenant(admin, employee, 'Employee');

  const newUser: SystemUser = {
    id: `USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    firstName: employee.firstName || employee.fullName.split(' ')[0],
    lastName: employee.lastName || employee.fullName.split(' ').slice(1).join(' '),
    email: employee.email || '',
    role: 'EMPLOYEE',
    assignedSite: employee.assignedSite || 'S1',
    companyId: admin.companyId,
    companyName: admin.companyName,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  // Persist to local storage mock
  const savedUsersRaw = localStorage.getItem('salaire_system_users');
  const savedUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
  localStorage.setItem('salaire_system_users', JSON.stringify([...savedUsers, newUser]));

  return newUser;
};

/**
 * SIMULATED BACKEND: Login process that ignores manual role selection.
 * In production, the backend returns the role based on the database record.
 */
export const login = async (email: string): Promise<AuthUser> => {
  await new Promise(r => setTimeout(r, 600)); // Network delay

  // Logic: any address with 'rh' or 'admin' is a Directuer RH. Others are Employees.
  // This simulates the backend looking up the user in the DB.
  const role = (email.toLowerCase().includes('rh') || email.toLowerCase().includes('admin'))
    ? 'DIRECTEUR_RH'
    : 'EMPLOYEE';

  const user: AuthUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    firstName: email.split('@')[0],
    lastName: 'Salery',
    email: email,
    role,
    permissions: getPermissionsForRole(role),
    companyId: 'TENANT-8821',
    companyName: 'Salery Infrastructure',
    plan: 'ENTERPRISE'
  };

  logSecurityEvent(user, 'LOGIN', 'auth', 'SUCCESS');
  return user;
};

/**
 * SIMULATED BACKEND: Get current authenticated session (Zero-Trust boot).
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  await new Promise(r => setTimeout(r, 800)); // Boot verification delay
  const saved = localStorage.getItem('salery-store');
  if (saved) {
    const data = JSON.parse(saved);
    if (data.state?.user) {
      logSecurityEvent(data.state.user as AuthUser, 'SESSION_RESTORE', 'system', 'SUCCESS');
      return data.state.user;
    }
  }
  return null;
};

/**
 * Get permissions array for a user based on their role.
 */
export { getPermissionsForRole };
