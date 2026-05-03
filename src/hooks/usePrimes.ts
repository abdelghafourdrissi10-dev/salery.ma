/**
 * usePrimes — API-driven hook replacing localStorage/Zustand for primes.
 * Fetches from /api/v1/primes on mount, provides create/update/delete with auto-refetch.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface BackendPrime {
    id: string;
    companyId: string;
    name: string;
    amount: number;
    isSoumisCnss: boolean;
    isRecurring: boolean;
    description?: string | null;
    createdAt: string;
}

interface UsePrimesReturn {
    primes: BackendPrime[];
    loading: boolean;
    error: string | null;
    create: (data: Omit<BackendPrime, 'id' | 'companyId' | 'createdAt'>) => Promise<BackendPrime | null>;
    update: (id: string, data: Partial<BackendPrime>) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export const usePrimes = (): UsePrimesReturn => {
    const [primes, setPrimes] = useState<BackendPrime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrimes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get('/primes');
            if (Array.isArray(data)) setPrimes(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load primes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPrimes(); }, [fetchPrimes]);

    const create = async (data: Omit<BackendPrime, 'id' | 'companyId' | 'createdAt'>): Promise<BackendPrime | null> => {
        try {
            const result = await api.post('/primes', data) as BackendPrime;
            await fetchPrimes();
            return result;
        } catch (e: any) {
            setError(e.message || 'Failed to create prime');
            return null;
        }
    };

    const update = async (id: string, data: Partial<BackendPrime>): Promise<void> => {
        try {
            await api.patch(`/primes/${id}`, data);
            await fetchPrimes();
        } catch (e: any) {
            setError(e.message || 'Failed to update prime');
        }
    };

    const remove = async (id: string): Promise<void> => {
        try {
            await api.delete(`/primes/${id}`);
            setPrimes(prev => prev.filter(p => p.id !== id));
        } catch (e: any) {
            setError(e.message || 'Failed to delete prime');
        }
    };

    return { primes, loading, error, create, update, remove, refetch: fetchPrimes };
};
