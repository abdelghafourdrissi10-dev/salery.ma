import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/store.ts';
import { UserRole } from '../types.ts';
import SecureLoadingSpinner from './SecureLoadingSpinner.tsx';

interface Props {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const RoleProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const { user, authLoading, isAuthenticated } = useAppStore();
    const location = useLocation();

    // 1. Wait for auth initialization
    if (authLoading) {
        return <SecureLoadingSpinner userName={user?.firstName} />;
    }

    // 2. Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        // Keep the intended location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Check role authorization if restricted
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.error(`[SECURITY] Access denied for role: ${user.role} at ${location.pathname}`);
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. Authorized - render content
    return <>{children}</>;
};

export default RoleProtectedRoute;
