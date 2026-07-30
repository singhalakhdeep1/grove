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
        api.post('/auth/register', data).then((r: { data: any }) => r.data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data).then((r: { data: any }) => r.data),
    loginWithTwoFactor: (data: { userId: string; token: string }) =>
        api.post('/auth/login-2fa', data).then((r: { data: any }) => r.data),
    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }).then((r: { data: any }) => r.data),
    verifyEmail: (token: string) =>
        api.post('/auth/verify-email', { token }).then((r: { data: any }) => r.data),
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }).then((r: { data: any }) => r.data),
    resetPassword: (token: string, newPassword: string) =>
        api.post('/auth/reset-password', { token, newPassword }).then((r: { data: any }) => r.data),
    changePassword: (oldPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { oldPassword, newPassword }).then((r: { data: any }) => r.data),
    logout: (refreshToken: string) =>
        api.post('/auth/logout', { refreshToken }).then((r: { data: any }) => r.data),
    getProfile: () => api.get('/auth/profile').then((r: { data: any }) => r.data),
    updateProfile: (data: object) => api.put('/auth/profile', data).then((r: { data: any }) => r.data),
}

// ============================================
// TWO-FACTOR AUTHENTICATION API
// ============================================
export const twoFactorApi = {
    generateSecret: () =>
        api.post('/two-factor/generate').then((r: { data: any }) => r.data),
    enableTwoFactor: (token: string) =>
        api.post('/two-factor/enable', { token }).then((r: { data: any }) => r.data),
    disableTwoFactor: (token: string) =>
        api.post('/two-factor/disable', { token }).then((r: { data: any }) => r.data),
    verifyToken: (token: string) =>
        api.post('/two-factor/verify', { token }).then((r: { data: any }) => r.data),
    regenerateBackupCodes: (token: string) =>
        api.post('/two-factor/backup-codes/regenerate', { token }).then((r: { data: any }) => r.data),
    getStatus: () =>
        api.get('/two-factor/status').then((r: { data: any }) => r.data),
}

// ============================================
// SUBSCRIPTIONS & PAYMENTS API
// ============================================
export const subscriptionsApi = {
    // Plans
    getPlans: () =>
        api.get('/subscriptions/plans').then((r: { data: any }) => r.data),
    getPlan: (planId: string) =>
        api.get(`/subscriptions/plans/${planId}`).then((r: { data: any }) => r.data),
    createPlan: (data: any) =>
        api.post('/subscriptions/plans', data).then((r: { data: any }) => r.data),

    // User Subscriptions
    subscribe: (data: { planId: string; paymentMethodId?: string; promoCode?: string }) =>
        api.post('/subscriptions/subscribe', data).then((r: { data: any }) => r.data),
    getMySubscription: () =>
        api.get('/subscriptions/my-subscription').then((r: { data: any }) => r.data),
    cancelSubscription: () =>
        api.post('/subscriptions/cancel').then((r: { data: any }) => r.data),

    // Promotional Codes
    validatePromoCode: (code: string, planId?: string) =>
        api.post('/subscriptions/promo-codes/validate', { code, planId }).then((r: { data: any }) => r.data),
    getPromoCodes: () =>
        api.get('/subscriptions/promo-codes').then((r: { data: any }) => r.data),
    createPromoCode: (data: any) =>
        api.post('/subscriptions/promo-codes', data).then((r: { data: any }) => r.data),

    // Payments
    getPaymentHistory: () =>
        api.get('/subscriptions/payments').then((r: { data: any }) => r.data),

    // Invoices
    getInvoices: () =>
        api.get('/subscriptions/invoices').then((r: { data: any }) => r.data),
    getInvoice: (invoiceId: string) =>
        api.get(`/subscriptions/invoices/${invoiceId}`).then((r: { data: any }) => r.data),
    createInvoice: (data: any) =>
        api.post('/subscriptions/invoices', data).then((r: { data: any }) => r.data),
}

// ============================================
// COURSES API
// ============================================
export const coursesApi = {
    list: (params?: object) => api.get('/courses', { params }).then((r: { data: any }) => r.data),
    get: (id: string) => api.get(`/courses/${id}`).then((r: { data: any }) => r.data),
    create: (data: object) => api.post('/courses', data).then((r: { data: any }) => r.data),
    update: (id: string, data: object) => api.put(`/courses/${id}`, data).then((r: { data: any }) => r.data),
    delete: (id: string) => api.delete(`/courses/${id}`).then((r: { data: any }) => r.data),
    publish: (id: string) => api.post(`/courses/${id}/publish`).then((r: { data: any }) => r.data),
    myCourses: () => api.get('/courses/my-courses').then((r: { data: any }) => r.data),
    statistics: (id: string) => api.get(`/courses/${id}/statistics`).then((r: { data: any }) => r.data),
}

// ============================================
// FORUMS API
// ============================================
export const forumsApi = {
    listForums: () => api.get('/forums').then((r: { data: any }) => r.data),
    listThreads: (forumId: string, params?: object) =>
        api.get(`/forums/${forumId}/threads`, { params }).then((r: { data: any }) => r.data),
    createThread: (forumId: string, data: object) =>
        api.post(`/forums/${forumId}/threads`, data).then((r: { data: any }) => r.data),
    getThread: (threadId: string) => api.get(`/forums/threads/${threadId}`).then((r: { data: any }) => r.data),
    createPost: (threadId: string, data: object) =>
        api.post(`/forums/threads/${threadId}/posts`, data).then((r: { data: any }) => r.data),
    updatePost: (postId: string, data: object) =>
        api.put(`/forums/posts/${postId}`, data).then((r: { data: any }) => r.data),
    deletePost: (postId: string) => api.delete(`/forums/posts/${postId}`).then((r: { data: any }) => r.data),
    votePost: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') =>
        api.post(`/forums/posts/${postId}/vote`, { voteType }).then((r: { data: any }) => r.data),
    markBestAnswer: (postId: string) =>
        api.post(`/forums/posts/${postId}/best-answer`).then((r: { data: any }) => r.data),
}

// ============================================
// GAMIFICATION API
// ============================================
export const gamificationApi = {
    getProgress: () => api.get('/gamification/progress').then((r: { data: any }) => r.data),
    getAchievements: () => api.get('/gamification/achievements').then((r: { data: any }) => r.data),
    getBadges: () => api.get('/gamification/badges').then((r: { data: any }) => r.data),
    getLeaderboard: (timeframe?: 'daily' | 'weekly' | 'allTime') =>
        api.get('/gamification/leaderboard', { params: { timeframe } }).then((r: { data: any }) => r.data),
    awardXP: (points: number, reason: string) =>
        api.post('/gamification/award-xp', { points, reason }).then((r: { data: any }) => r.data),
}

// ============================================
// LIVE SESSIONS API
// ============================================
export const liveSessionsApi = {
    list: (params?: object) => api.get('/live-sessions', { params }).then((r: { data: any }) => r.data),
    get: (id: string) => api.get(`/live-sessions/${id}`).then((r: { data: any }) => r.data),
    create: (data: object) => api.post('/live-sessions', data).then((r: { data: any }) => r.data),
    join: (id: string) => api.post(`/live-sessions/${id}/join`).then((r: { data: any }) => r.data),
    start: (id: string) => api.post(`/live-sessions/${id}/start`).then((r: { data: any }) => r.data),
    end: (id: string) => api.post(`/live-sessions/${id}/end`).then((r: { data: any }) => r.data),
}

// ============================================
// MENTORSHIP API
// ============================================
export const mentorshipApi = {
    listMentors: (params?: object) => api.get('/mentorship/mentors', { params }).then((r: { data: any }) => r.data),
    requestMentorship: (mentorId: string, data: object) =>
        api.post('/mentorship/request', { mentorId, ...data }).then((r: { data: any }) => r.data),
    createSession: (requestId: string, data: object) =>
        api.post('/mentorship/sessions', { requestId, ...data }).then((r: { data: any }) => r.data),
    addReview: (sessionId: string, data: object) =>
        api.post('/mentorship/reviews', { sessionId, ...data }).then((r: { data: any }) => r.data),
}

// ============================================
// MESSAGING API
// ============================================
export const messagingApi = {
    getConversations: () => api.get('/messaging/conversations').then((r: { data: any }) => r.data),
    createConversation: (participantIds: string[]) =>
        api.post('/messaging/conversations', { participantIds }).then((r: { data: any }) => r.data),
    getMessages: (conversationId: string, params?: object) =>
        api.get(`/messaging/conversations/${conversationId}/messages`, { params }).then((r: { data: any }) => r.data),
    sendMessage: (conversationId: string, content: string) =>
        api.post(`/messaging/conversations/${conversationId}/messages`, { content }).then((r: { data: any }) => r.data),
    markAsRead: (messageId: string) =>
        api.post(`/messaging/messages/${messageId}/read`).then((r: { data: any }) => r.data),
    deleteMessage: (messageId: string) =>
        api.delete(`/messaging/messages/${messageId}`).then((r: { data: any }) => r.data),
}

// ============================================
// STUDY GROUPS API
// ============================================
export const studyGroupsApi = {
    list: (params?: object) => api.get('/study-groups', { params }).then((r: { data: any }) => r.data),
    get: (id: string) => api.get(`/study-groups/${id}`).then((r: { data: any }) => r.data),
    create: (data: object) => api.post('/study-groups', data).then((r: { data: any }) => r.data),
    join: (id: string) => api.post(`/study-groups/${id}/join`).then((r: { data: any }) => r.data),
    createPost: (id: string, data: object) =>
        api.post(`/study-groups/${id}/posts`, data).then((r: { data: any }) => r.data),
}

// ============================================
// CERTIFICATION API
// ============================================
export const certificationApi = {
    getCertificates: () => api.get('/certification/certificates').then((r: { data: any }) => r.data),
    verifyCertificate: (code: string) =>
        api.get(`/certification/verify/${code}`).then((r: { data: any }) => r.data),
    submitExam: (examId: string, answers: object[]) =>
        api.post(`/certification/exams/${examId}/attempt`, { answers }).then((r: { data: any }) => r.data),
}

// ============================================
// AI RECOMMENDATIONS API
// ============================================
export const recommendationsApi = {
    getRecommendations: (limit?: number) =>
        api.get('/recommendations', { params: { limit } }).then((r: { data: any }) => r.data),
    trackClick: (courseId: string) =>
        api.post(`/recommendations/${courseId}/click`).then((r: { data: any }) => r.data),
    trackEnroll: (courseId: string) =>
        api.post(`/recommendations/${courseId}/enroll`).then((r: { data: any }) => r.data),
    trackInteraction: (data: { courseId: string; action: string; duration?: number; rating?: number }) =>
        api.post('/recommendations/track-interaction', data).then((r: { data: any }) => r.data),
    getAnalytics: () => api.get('/recommendations/analytics').then((r: { data: any }) => r.data),
}

// ============================================
// REAL-TIME ANALYTICS API
// ============================================
export const realtimeAnalyticsApi = {
    trackEvent: (data: { eventType: string; eventData: any; sessionId?: string }) =>
        api.post('/analytics/track', data).then((r: { data: any }) => r.data),
    getRealTimeMetrics: () => api.get('/analytics/realtime').then((r: { data: any }) => r.data),
    getActiveUsers: () => api.get('/analytics/active-users').then((r: { data: any }) => r.data),
    getEnrollmentTrends: () => api.get('/analytics/enrollment-trends').then((r: { data: any }) => r.data),
    getCoursePerformance: (courseId?: string) =>
        api.get('/analytics/course-performance', { params: { courseId } }).then((r: { data: any }) => r.data),
    getUserEngagement: (userId?: string) =>
        api.get('/analytics/user-engagement', { params: { userId } }).then((r: { data: any }) => r.data),
    getLearningProgress: (userId?: string) =>
        api.get('/analytics/learning-progress', { params: { userId } }).then((r: { data: any }) => r.data),
    getFunnelAnalytics: () => api.get('/analytics/funnel').then((r: { data: any }) => r.data),
    getDashboardSummary: () => api.get('/analytics/dashboard').then((r: { data: any }) => r.data),
}

// ============================================
// INTERACTIVE VIDEO API
// ============================================
export const videoApi = {
    // Bookmarks
    createBookmark: (data: { lessonId: string; timestamp: number; title?: string; description?: string }) =>
        api.post('/video/bookmarks', data).then((r: { data: any }) => r.data),
    getBookmarks: (lessonId: string) =>
        api.get(`/video/bookmarks/${lessonId}`).then((r: { data: any }) => r.data),
    deleteBookmark: (bookmarkId: string) =>
        api.delete(`/video/bookmarks/${bookmarkId}`).then((r: { data: any }) => r.data),

    // Notes
    createNote: (data: { lessonId: string; timestamp: number; content: string; isPrivate?: boolean }) =>
        api.post('/video/notes', data).then((r: { data: any }) => r.data),
    getNotes: (lessonId: string, includePublic?: boolean) =>
        api.get(`/video/notes/${lessonId}`, { params: { includePublic } }).then((r: { data: any }) => r.data),
    updateNote: (noteId: string, data: { content?: string; isPrivate?: boolean }) =>
        api.put(`/video/notes/${noteId}`, data).then((r: { data: any }) => r.data),
    deleteNote: (noteId: string) =>
        api.delete(`/video/notes/${noteId}`).then((r: { data: any }) => r.data),

    // Playback
    startPlayback: (data: { lessonId: string; quality?: string; playbackSpeed?: number }) =>
        api.post('/video/playback/start', data).then((r: { data: any }) => r.data),
    updateProgress: (sessionId: string, data: { lastPosition: number; totalWatchTime: number; completionRate: number }) =>
        api.put(`/video/playback/${sessionId}`, data).then((r: { data: any }) => r.data),
    endPlayback: (sessionId: string) =>
        api.post(`/video/playback/${sessionId}/end`).then((r: { data: any }) => r.data),
    getPlaybackHistory: (lessonId: string) =>
        api.get(`/video/playback/history/${lessonId}`).then((r: { data: any }) => r.data),

    // Analytics
    getVideoAnalytics: (lessonId: string) =>
        api.get(`/video/analytics/${lessonId}`).then((r: { data: any }) => r.data),
    getHeatmap: (lessonId: string) =>
        api.get(`/video/heatmap/${lessonId}`).then((r: { data: any }) => r.data),
    getDropOffPoints: (lessonId: string) =>
        api.get(`/video/dropoff/${lessonId}`).then((r: { data: any }) => r.data),
}

// ============================================
// ADVANCED GAMIFICATION API
// ============================================
export const advancedGamificationApi = {
    // Team Challenges
    getActiveChallenges: () =>
        api.get('/gamification/challenges').then((r: { data: any }) => r.data),
    createChallenge: (data: any) =>
        api.post('/gamification/challenges', data).then((r: { data: any }) => r.data),
    createTeam: (challengeId: string, data: any) =>
        api.post(`/gamification/challenges/${challengeId}/teams`, data).then((r: { data: any }) => r.data),
    joinTeam: (teamId: string) =>
        api.post(`/gamification/teams/${teamId}/join`).then((r: { data: any }) => r.data),
    getChallengeLeaderboard: (challengeId: string) =>
        api.get(`/gamification/challenges/${challengeId}/leaderboard`).then((r: { data: any }) => r.data),

    // Seasonal Events
    getActiveSeasonalEvents: () =>
        api.get('/gamification/seasonal-events').then((r: { data: any }) => r.data),
    createSeasonalEvent: (data: any) =>
        api.post('/gamification/seasonal-events', data).then((r: { data: any }) => r.data),
    unlockSeasonalAchievement: (achievementId: string) =>
        api.post(`/gamification/seasonal-achievements/${achievementId}/unlock`).then((r: { data: any }) => r.data),
    getCurrentXPMultiplier: () =>
        api.get('/gamification/xp-multiplier').then((r: { data: any }) => r.data),

    // Virtual Currency
    getUserCurrency: () =>
        api.get('/gamification/currency').then((r: { data: any }) => r.data),
    getTransactionHistory: (limit?: number) =>
        api.get('/gamification/currency/transactions', { params: { limit } }).then((r: { data: any }) => r.data),
    awardCurrency: (data: any) =>
        api.post('/gamification/currency/award', data).then((r: { data: any }) => r.data),

    // Reward Shop
    getAvailableRewards: () =>
        api.get('/gamification/rewards').then((r: { data: any }) => r.data),
    createRewardItem: (data: any) =>
        api.post('/gamification/rewards', data).then((r: { data: any }) => r.data),
    purchaseReward: (rewardId: string) =>
        api.post(`/gamification/rewards/${rewardId}/purchase`).then((r: { data: any }) => r.data),
    getUserPurchases: () =>
        api.get('/gamification/rewards/purchases').then((r: { data: any }) => r.data),

    // Summary
    getUserGamificationSummary: () =>
        api.get('/gamification/summary').then((r: { data: any }) => r.data),
}
