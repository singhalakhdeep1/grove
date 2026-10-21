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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = (p: string) => apiFetch<any>(p);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const po = (p: string, b?: unknown) => apiFetch<any>(p, { method: 'POST', body: JSON.stringify(b) });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pa = (p: string, b?: unknown) => apiFetch<any>(p, { method: 'PATCH', body: JSON.stringify(b) });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const de = (p: string) => apiFetch<any>(p, { method: 'DELETE' });

export const authApi = {
    login: (body: unknown) => po('/auth/login', body),
    register: (body: unknown) => po('/auth/register', body),
    logout: (refreshToken?: unknown) => po('/auth/logout', refreshToken ? { refreshToken } : undefined),
    getProfile: () => g('/auth/profile'),
    updateProfile: (body: unknown) => pa('/auth/profile', body),
    forgotPassword: (body: unknown) => po('/auth/forgot-password', body),
    resetPassword: (body: unknown) => po('/auth/reset-password', body),
    newPassword: (body: unknown) => po('/auth/new-password', body),
    changePassword: (body: unknown) => po('/auth/change-password', body),
};

export const coursesApi = {
    list: (params?: Record<string, string | undefined> | string) => {
        const qs = typeof params === 'string' ? params
            : params ? Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
            : '';
        return g(`/courses${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => g(`/courses/${id}`),
    create: (body: unknown) => po('/courses', body),
    delete: (id: string) => de(`/courses/${id}`),
    myCourses: () => g('/courses/my-courses'),
    getProgress: (id: string) => g(`/courses/${id}/progress`),
    updateProgress: (id: string, body: unknown) => pa(`/courses/${id}/progress`, body),
    getNotes: (id: string) => g(`/courses/${id}/notes`),
    createNote: (id: string, body: unknown) => po(`/courses/${id}/notes`, body),
    deleteNote: (id: string, noteId: string) => de(`/courses/${id}/notes/${noteId}`),
    getBookmarks: (id: string) => g(`/courses/${id}/bookmarks`),
    createBookmark: (id: string, body: unknown) => po(`/courses/${id}/bookmarks`, body),
    deleteBookmark: (id: string, bmId: string) => de(`/courses/${id}/bookmarks/${bmId}`),
};

export const analyticsApi = {
    getUserAnalytics: () => g('/analytics/user'),
    getLearningProgress: () => g('/analytics/learning-progress'),
};

export const realtimeAnalyticsApi = {
    getUserAnalytics: () => g('/analytics/realtime/user'),
    getLearningProgress: () => g('/analytics/realtime/progress'),
};

export const gamificationApi = {
    getLeaderboard: (params?: unknown) => g('/gamification/leaderboard'),
    getAchievements: () => g('/gamification/achievements'),
    getBadges: () => g('/gamification/badges'),
    getProgress: () => g('/gamification/progress'),
};

export const certificationApi = {
    getCertificates: () => g('/certifications'),
    verifyCertificate: (code: string) => g(`/certifications/verify/${code}`),
};

export const forumsApi = {
    listForums: () => g('/forums'),
    listThreads: (forumId: string) => g(`/forums/${forumId}/threads`),
    getThread: (id: string) => g(`/forums/threads/${id}`),
    createThread: (forumId: string, body: unknown) => po(`/forums/${forumId}/threads`, body),
    getPosts: (threadId: string) => g(`/forums/threads/${threadId}/posts`),
    createPost: (threadId: string, body: unknown) => po(`/forums/threads/${threadId}/posts`, body),
    deletePost: (postId: string) => de(`/forums/posts/${postId}`),
    votePost: (postId: string, body: unknown) => po(`/forums/posts/${postId}/vote`, body),
    markBestAnswer: (postId: string) => po(`/forums/posts/${postId}/best-answer`),
};

export const liveSessionsApi = {
    list: (params?: unknown) => g('/live-sessions'),
    listSessions: () => g('/live-sessions'),
    get: (id: string) => g(`/live-sessions/${id}`),
    create: (body: unknown) => po('/live-sessions', body),
    join: (id: string) => po(`/live-sessions/${id}/join`),
    startPlayback: (id: string) => po(`/live-sessions/${id}/playback`),
};

export const mentorshipApi = {
    listMentors: (params?: unknown) => g('/mentorship/mentors'),
    listRequests: () => g('/mentorship/requests'),
    listSessions: () => g('/mentorship/sessions'),
    create: (body: unknown) => po('/mentorship/requests', body),
    requestMentorship: (body: unknown) => po('/mentorship/requests', body),
};

export const messagingApi = {
    getConversations: () => g('/messaging/conversations'),
    getMessages: (id: string) => g(`/messaging/conversations/${id}/messages`),
    sendMessage: (id: string, body: unknown) => po(`/messaging/conversations/${id}/messages`, body),
};

export const studyGroupsApi = {
    list: () => g('/study-groups'),
    get: (id: string) => g(`/study-groups/${id}`),
    create: (body: unknown) => po('/study-groups', body),
    join: (id: string) => po(`/study-groups/${id}/join`),
    getPosts: (id: string) => g(`/study-groups/${id}/posts`),
    createPost: (id: string, body: unknown) => po(`/study-groups/${id}/posts`, body),
};

export const videoApi = {
    get: (id: string) => g(`/videos/${id}`),
    startPlayback: (id: string, params?: unknown) => po(`/videos/${id}/playback`, params),
    updateProgress: (id: string, body: unknown) => pa(`/videos/${id}/progress`, body),
    getBookmarks: (id: string) => g(`/videos/${id}/bookmarks`),
    createBookmark: (id: string, body: unknown) => po(`/videos/${id}/bookmarks`, body),
    deleteBookmark: (id: string, bmId: string) => de(`/videos/${id}/bookmarks/${bmId}`),
    getNotes: (id: string) => g(`/videos/${id}/notes`),
    createNote: (id: string, body: unknown) => po(`/videos/${id}/notes`, body),
    deleteNote: (id: string, noteId: string) => de(`/videos/${id}/notes/${noteId}`),
};
