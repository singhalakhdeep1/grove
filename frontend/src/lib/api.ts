import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
})

// Request interceptor – attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken')
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor – refresh token on 401
api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
                    localStorage.setItem('accessToken', data.accessToken)
                    localStorage.setItem('refreshToken', data.refreshToken)
                    original.headers.Authorization = `Bearer ${data.accessToken}`
                    return api(original)
                } catch {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

// ============================================
// AUTH API
// ============================================
export const authApi = {
    register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
        api.post('/auth/register', data).then((r) => r.data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data).then((r) => r.data),
    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
    verifyEmail: (token: string) =>
        api.post('/auth/verify-email', { token }).then((r) => r.data),
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }).then((r) => r.data),
    resetPassword: (token: string, newPassword: string) =>
        api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),
    changePassword: (oldPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
    logout: (refreshToken: string) =>
        api.post('/auth/logout', { refreshToken }).then((r) => r.data),
    getProfile: () => api.get('/auth/profile').then((r) => r.data),
    updateProfile: (data: object) => api.put('/auth/profile', data).then((r) => r.data),
}

// ============================================
// COURSES API
// ============================================
export const coursesApi = {
    list: (params?: object) => api.get('/courses', { params }).then((r) => r.data),
    get: (id: string) => api.get(`/courses/${id}`).then((r) => r.data),
    create: (data: object) => api.post('/courses', data).then((r) => r.data),
    update: (id: string, data: object) => api.put(`/courses/${id}`, data).then((r) => r.data),
    delete: (id: string) => api.delete(`/courses/${id}`).then((r) => r.data),
    publish: (id: string) => api.post(`/courses/${id}/publish`).then((r) => r.data),
    myCourses: () => api.get('/courses/my-courses').then((r) => r.data),
    statistics: (id: string) => api.get(`/courses/${id}/statistics`).then((r) => r.data),
}

// ============================================
// FORUMS API
// ============================================
export const forumsApi = {
    listForums: () => api.get('/forums').then((r) => r.data),
    listThreads: (forumId: string, params?: object) =>
        api.get(`/forums/${forumId}/threads`, { params }).then((r) => r.data),
    createThread: (forumId: string, data: object) =>
        api.post(`/forums/${forumId}/threads`, data).then((r) => r.data),
    getThread: (threadId: string) => api.get(`/forums/threads/${threadId}`).then((r) => r.data),
    createPost: (threadId: string, data: object) =>
        api.post(`/forums/threads/${threadId}/posts`, data).then((r) => r.data),
    updatePost: (postId: string, data: object) =>
        api.put(`/forums/posts/${postId}`, data).then((r) => r.data),
    deletePost: (postId: string) => api.delete(`/forums/posts/${postId}`).then((r) => r.data),
    votePost: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') =>
        api.post(`/forums/posts/${postId}/vote`, { voteType }).then((r) => r.data),
    markBestAnswer: (postId: string) =>
        api.post(`/forums/posts/${postId}/best-answer`).then((r) => r.data),
}

// ============================================
// GAMIFICATION API
// ============================================
export const gamificationApi = {
    getProgress: () => api.get('/gamification/progress').then((r) => r.data),
    getAchievements: () => api.get('/gamification/achievements').then((r) => r.data),
    getBadges: () => api.get('/gamification/badges').then((r) => r.data),
    getLeaderboard: (timeframe?: 'daily' | 'weekly' | 'allTime') =>
        api.get('/gamification/leaderboard', { params: { timeframe } }).then((r) => r.data),
    awardXP: (points: number, reason: string) =>
        api.post('/gamification/award-xp', { points, reason }).then((r) => r.data),
}

// ============================================
// LIVE SESSIONS API
// ============================================
export const liveSessionsApi = {
    list: (params?: object) => api.get('/live-sessions', { params }).then((r) => r.data),
    get: (id: string) => api.get(`/live-sessions/${id}`).then((r) => r.data),
    create: (data: object) => api.post('/live-sessions', data).then((r) => r.data),
    join: (id: string) => api.post(`/live-sessions/${id}/join`).then((r) => r.data),
    start: (id: string) => api.post(`/live-sessions/${id}/start`).then((r) => r.data),
    end: (id: string) => api.post(`/live-sessions/${id}/end`).then((r) => r.data),
}

// ============================================
// MENTORSHIP API
// ============================================
export const mentorshipApi = {
    listMentors: (params?: object) => api.get('/mentorship/mentors', { params }).then((r) => r.data),
    requestMentorship: (mentorId: string, data: object) =>
        api.post('/mentorship/request', { mentorId, ...data }).then((r) => r.data),
    createSession: (requestId: string, data: object) =>
        api.post('/mentorship/sessions', { requestId, ...data }).then((r) => r.data),
    addReview: (sessionId: string, data: object) =>
        api.post('/mentorship/reviews', { sessionId, ...data }).then((r) => r.data),
}

// ============================================
// MESSAGING API
// ============================================
export const messagingApi = {
    getConversations: () => api.get('/messaging/conversations').then((r) => r.data),
    createConversation: (participantIds: string[]) =>
        api.post('/messaging/conversations', { participantIds }).then((r) => r.data),
    getMessages: (conversationId: string, params?: object) =>
        api.get(`/messaging/conversations/${conversationId}/messages`, { params }).then((r) => r.data),
    sendMessage: (conversationId: string, content: string) =>
        api.post(`/messaging/conversations/${conversationId}/messages`, { content }).then((r) => r.data),
    markAsRead: (messageId: string) =>
        api.post(`/messaging/messages/${messageId}/read`).then((r) => r.data),
    deleteMessage: (messageId: string) =>
        api.delete(`/messaging/messages/${messageId}`).then((r) => r.data),
}

// ============================================
// STUDY GROUPS API
// ============================================
export const studyGroupsApi = {
    list: (params?: object) => api.get('/study-groups', { params }).then((r) => r.data),
    get: (id: string) => api.get(`/study-groups/${id}`).then((r) => r.data),
    create: (data: object) => api.post('/study-groups', data).then((r) => r.data),
    join: (id: string) => api.post(`/study-groups/${id}/join`).then((r) => r.data),
    createPost: (id: string, data: object) =>
        api.post(`/study-groups/${id}/posts`, data).then((r) => r.data),
}

// ============================================
// ANALYTICS API
// ============================================
export const analyticsApi = {
    getUserAnalytics: () => api.get('/analytics/user').then((r) => r.data),
    getCourseAnalytics: (id: string) => api.get(`/analytics/course/${id}`).then((r) => r.data),
    getLearningProgress: () => api.get('/analytics/progress').then((r) => r.data),
}

// ============================================
// CERTIFICATION API
// ============================================
export const certificationApi = {
    getCertificates: () => api.get('/certification/certificates').then((r) => r.data),
    verifyCertificate: (code: string) =>
        api.get(`/certification/verify/${code}`).then((r) => r.data),
    submitExam: (examId: string, answers: object[]) =>
        api.post(`/certification/exams/${examId}/attempt`, { answers }).then((r) => r.data),
}
