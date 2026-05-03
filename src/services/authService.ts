import { Employee, AuthUser, SystemUser, UserRole } from '../types.ts';
import { getPermissionsForRole } from './rbac.ts';
import { api } from './api.ts';

/**
 * Map PostgreSQL Backend Roles to Frontend Legacy Roles
 */
const mapRole = (backendRole: string): UserRole => {
  switch (backendRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN': return 'SUPER_ADMIN';
    case 'HR': return 'TEAM_RH';
    case 'EMPLOYEE': return 'EMPLOYEE';
    default: return 'EMPLOYEE';
  }
};

/**
 * REAL BACKEND: Login process fetching JWT tokens and decoding them.
 */
export const login = async (email: string, password?: string): Promise<AuthUser> => {
  // We use a hardcoded password 'admin123' if none provided for seamless transition from mock UI
  const payload = {
    email,
    password: password || 'admin123'
  };

    try {
    const response = await api.post('/auth/login', payload);
    const { user: userData, accessToken } = response;

    // Store token for Bearer auth in subsequent API calls
    if (accessToken) {
      localStorage.setItem('salery_access_token', accessToken);
    }

    const mappedRole = mapRole(userData.role);

    const user: AuthUser = {
      id: userData.id,
      firstName: userData.email.split('@')[0],
      lastName: 'Salery',
      email: userData.email,
      role: mappedRole,
      permissions: getPermissionsForRole(mappedRole),
      companyId: userData.currentCompanyId || '',
      companyName: 'Salery Tech Corp',
      plan: 'ENTERPRISE'
    };

    if (response.companies) {
      const { useAppStore } = await import('../store/store');
      useAppStore.getState().setAccessibleCompanies(response.companies);
    }

    return user;
  } catch (err: any) {
    console.error('Login Failed', err);
    throw new Error(err.message || 'Invalid credentials');
  }
};

/**
 * REAL BACKEND: Check token on boot to restore session
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await api.get('/auth/me');
    const { user: userData } = response;

    const mappedRole = mapRole(userData.role);

    const user: AuthUser = {
      id: userData.id,
      firstName: userData.email.split('@')[0],
      lastName: 'User',
      email: userData.email,
      role: mappedRole,
      permissions: getPermissionsForRole(mappedRole),
      companyId: userData.currentCompanyId || '',
      companyName: 'Salery Tech Corp',
      plan: 'ENTERPRISE'
    };

    return user;
  } catch (e) {
    return null;
  }
};

export { getPermissionsForRole };

export const logout = async () => {
  try {
    await api.post('/auth/logout', {});
  } catch (e) { }
  localStorage.removeItem('salery_access_token');
};

export const provisionUserAccount = async (employee: Employee, admin: AuthUser): Promise<SystemUser> => {
  // SaaS RBAC Architecture: Create User linked to Employee
  const newUser: SystemUser = {
    id: `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    companyId: employee.companyId || 'company-1',
    companyName: 'Salery Enterprise',
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || `${employee.firstName?.toLowerCase()}.${employee.lastName?.toLowerCase()}@salery.ma`,
    role: 'EMPLOYEE',
    employeeId: employee.id,
    status: 'active',
    assignedSite: employee.assignedSite || '',
    createdAt: new Date().toISOString()
  };

  // Persist locally for demo/development purposes
  const storedUsers = JSON.parse(localStorage.getItem('salery_users') || '[]');
  storedUsers.push(newUser);
  localStorage.setItem('salery_users', JSON.stringify(storedUsers));

  console.log("✅ User Account Provisioned:", newUser.email, "Role:", newUser.role, "Linked to EMP:", employee.id);

  return newUser;
};

export const simulateActivationEmail = async (user: SystemUser): Promise<void> => {
  console.log("✉️ Sent Platform Invite to:", user.email, "for role:", user.role);
};
