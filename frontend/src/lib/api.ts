const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

async function refreshToken(): Promise<string | null> {
    const rt = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!rt) return null;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const at = data.accessToken ?? data.data?.accessToken;
    const newRt = data.refreshToken ?? data.data?.refreshToken;
    if (at) localStorage.setItem('accessToken', at);
    if (newRt) localStorage.setItem('refreshToken', newRt);
    return at ?? null;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_BASE}${path}`, { ...init, headers });
        } else {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const e = new Error((err as any).message || res.statusText) as any;
        e.status = res.status;
        e.data = err;
        throw e;
    }

    return res.json() as Promise<T>;
}

export const api = {
    get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'GET', ...init }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
        apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...init }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
        apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...init }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
        apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...init }),
    delete: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'DELETE', ...init }),
};
