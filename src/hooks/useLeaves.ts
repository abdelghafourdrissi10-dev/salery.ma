/**
 * useLeaves — API-driven hook replacing Zustand/localStorage for leaves.
 * Fetches from /api/v1/leaves on mount, provides create/approve/reject.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface BackendLeave {
    id: string;
    employeeId: string;
    companyId: string;
    type: 'CONGE_ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE' | 'AUTRE';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    reason?: string | null;
    approvedBy?: string | null;
    createdAt: string;
    employee?: { firstName: string; lastName: string; position: string } | null;
}

interface Filters {
    status?: string;
    employeeId?: string;
    month?: string; // 'YYYY-MM'
}

interface UseLeavesReturn {
    leaves: BackendLeave[];
    loading: boolean;
    error: string | null;
    create: (data: { employeeId: string; type?: string; startDate: string; endDate: string; reason?: string }) => Promise<BackendLeave | null>;
    approve: (id: string) => Promise<void>;
    reject: (id: string) => Promise<void>;
    cancel: (id: string) => Promise<void>;
    refetch: (filters?: Filters) => Promise<void>;
}

export const useLeaves = (initialFilters?: Filters): UseLeavesReturn => {
    const [leaves, setLeaves] = useState<BackendLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaves = useCallback(async (filters?: Filters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            const f = filters || initialFilters || {};
            if (f.status) params.append('status', f.status);
            if (f.employeeId) params.append('employeeId', f.employeeId);
            if (f.month) params.append('month', f.month);

            const query = params.toString() ? `?${params.toString()}` : '';
            const data = await api.get(`/leaves${query}`);
            if (Array.isArray(data)) setLeaves(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(initialFilters)]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const create = async (data: {
        employeeId: string;
        type?: string;
        startDate: string;
        endDate: string;
        reason?: string;
    }): Promise<BackendLeave | null> => {
        try {
            const result = await api.post('/leaves', data) as BackendLeave;
            await fetchLeaves();
            return result;
        } catch (e: any) {
            setError(e.message || 'Failed to create leave');
            return null;
        }
    };

    const patch = async (id: string, status: string) => {
        try {
            await api.patch(`/leaves/${id}`, { status });
            setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
        } catch (e: any) {
            setError(e.message || `Failed to ${status.toLowerCase()} leave`);
        }
    };

    return {
        leaves,
        loading,
        error,
        create,
        approve: (id) => patch(id, 'APPROVED'),
        reject: (id) => patch(id, 'REJECTED'),
        cancel: (id) => patch(id, 'CANCELLED'),
        refetch: fetchLeaves,
    };
};
