// Centralized API Service for Salery SaaS

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Helper to get the auth token from localStorage
 */
const getToken = () => {
    return localStorage.getItem('salery_access_token');
};

/**
 * Standard headers with dynamic Bearer token
 */
const getHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

/**
 * Wrapper for fetch to handle JSON and throw errors automatically
 */
async function fetchClient(endpoint: string, options: RequestInit = {}) {
    const config = {
        ...options,
        credentials: 'include' as RequestCredentials, // CRITICAL for cookies
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized (maybe trigger a global logout event)
            console.error('API Unauthorized: Session expired or invalid.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText || 'API Request Failed');
    }

    // Not all responses have a body (e.g., 204 No Content)
    if (response.status === 204) return null;

    return response.json();
}

/**
 * The API Gateway interface
 */
export const api = {
    get: (endpoint: string) => fetchClient(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => fetchClient(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: any) => fetchClient(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetchClient(endpoint, { method: 'DELETE' }),
};
