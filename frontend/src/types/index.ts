// ============================================
// USER & AUTH TYPES
// ============================================
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'MENTOR' | 'ADMIN'
export type SkillLevel = 'BEGINNER' | 'LEARNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'MASTER'
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role: UserRole
    isVerified: boolean
    lastLoginAt?: string
    createdAt: string
    profile?: UserProfile
}

export interface UserProfile {
    id: string
    userId: string
    bio?: string
    headline?: string
    location?: string
    website?: string
    linkedin?: string
    github?: string
    twitter?: string
    timezone?: string
    language: string
    skillLevel: SkillLevel
    skills?: string[]
    totalPoints: number
    currentStreak: number
    longestStreak: number
    lastActivityDate?: string
    reputationScore: number
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

export interface AuthResponse {
    user: User
    accessToken: string
    refreshToken: string
}

// ============================================
// COURSE TYPES
// ============================================
export interface Course {
    id: string
    title: string
    slug: string
    description: string
    thumbnail?: string
    previewVideo?: string
    level: CourseLevel
    language: string
    price: number
    discountPrice?: number
    duration: number
    isPublished: boolean
    isFree: boolean
    instructorId: string
    categoryId?: string
    prerequisites: string[]
    learningGoals: string[]
    requirements: string[]
    createdAt: string
    updatedAt: string
    instructor?: User
    category?: CourseCategory
    modules?: CourseModule[]
    enrollments?: Enrollment[]
    reviews?: CourseReview[]
    _count?: {
        enrollments: number
        reviews: number
        modules: number
    }
    averageRating?: number
    isEnrolled?: boolean
}

export interface CourseCategory {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
}

export interface CourseModule {
    id: string
    courseId: string
    title: string
    description?: string
    order: number
    lessons?: Lesson[]
}

export interface Lesson {
    id: string
    moduleId: string
    title: string
    description?: string
    type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT'
    content?: string
    videoUrl?: string
    duration?: number
    order: number
    isPreview: boolean
    progress?: LessonProgress
}

export interface LessonProgress {
    id: string
    userId: string
    lessonId: string
    completed: boolean
    watchTime: number
    completedAt?: string
}

export interface Enrollment {
    id: string
    userId: string
    courseId: string
    enrolledAt: string
    completedAt?: string
    progress: number
    course?: Course
    user?: User
}

export interface CourseReview {
    id: string
    userId: string
    courseId: string
    rating: number
    comment?: string
    createdAt: string
    user?: User
}

// ============================================
// FORUM TYPES
// ============================================
export interface Forum {
    id: string
    title: string
    description?: string
    slug: string
    courseId?: string
    _count?: { threads: number }
}

export interface ForumThread {
    id: string
    forumId: string
    userId: string
    title: string
    content: string
    isPinned: boolean
    isLocked: boolean
    viewCount: number
    createdAt: string
    updatedAt: string
    user?: User
    posts?: ForumPost[]
    _count?: { posts: number }
}

export interface ForumPost {
    id: string
    threadId: string
    userId: string
    content: string
    isBestAnswer: boolean
    voteCount: number
    createdAt: string
    updatedAt: string
    user?: User
    userVote?: 'UPVOTE' | 'DOWNVOTE' | null
}

// ============================================
// GAMIFICATION TYPES
// ============================================
export interface UserProgress {
    totalPoints: number
    currentLevel: number
    levelName: string
    pointsToNextLevel: number
    currentStreak: number
    longestStreak: number
    rank?: number
}

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    points: number
    unlockedAt?: string
    isUnlocked: boolean
}

export interface Badge {
    id: string
    title: string
    description: string
    icon: string
    color: string
    earnedAt?: string
    isEarned: boolean
}

export interface LeaderboardEntry {
    rank: number
    userId: string
    name: string
    avatar?: string
    points: number
    level: number
    streak: number
}

// ============================================
// LIVE SESSION TYPES
// ============================================
export interface LiveSession {
    id: string
    title: string
    description?: string
    scheduledAt: string
    startedAt?: string
    endedAt?: string
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
    maxParticipants?: number
    courseId?: string
    instructorId: string
    streamUrl?: string
    recordingUrl?: string
    instructor?: User
    _count?: { participants: number }
    isJoined?: boolean
}

// ============================================
// MENTORSHIP TYPES
// ============================================
export interface MentorProfile {
    id: string
    userId: string
    bio: string
    title?: string
    expertise: string[]
    hourlyRate?: number
    rating: number
    totalSessions: number
    isAvailable: boolean
    user?: User
}

export interface MentorshipRequest {
    id: string
    mentorId: string
    menteeId: string
    message: string
    topic?: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
    createdAt: string
    mentor?: User
    mentee?: User
    user?: User
}

export interface MentorshipSession {
    id: string
    requestId: string
    scheduledAt: string
    duration: number
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    notes?: string
}

// ============================================
// MESSAGING TYPES
// ============================================
export interface Conversation {
    id: string
    participants: User[]
    lastMessage?: DirectMessage
    unreadCount: number
    updatedAt: string
}

export interface DirectMessage {
    id: string
    conversationId: string
    senderId: string
    content: string
    isRead: boolean
    createdAt: string
    sender?: User
}

// ============================================
// STUDY GROUP TYPES
// ============================================
export interface StudyGroup {
    id: string
    name: string
    description?: string
    avatar?: string
    courseId?: string
    isPrivate: boolean
    maxMembers?: number
    createdAt: string
    _count?: { members: number; posts: number }
    isMember?: boolean
    role?: 'OWNER' | 'ADMIN' | 'MEMBER'
}

export interface StudyGroupPost {
    id: string
    groupId: string
    userId: string
    content: string
    createdAt: string
    user?: User
}

// ============================================
// ANALYTICS TYPES
// ============================================
export interface UserAnalytics {
    totalCoursesEnrolled: number
    totalCoursesCompleted: number
    totalLessonsCompleted: number
    totalTimeSpent: number
    averageScore: number
    streakData: StreakData[]
    weeklyActivity: WeeklyActivity[]
    topCategories: CategoryActivity[]
}

export interface StreakData {
    date: string
    count: number
}

export interface WeeklyActivity {
    day: string
    minutes: number
    lessons: number
}

export interface CategoryActivity {
    category: string
    courses: number
    timeSpent: number
}

export interface LearningProgress {
    courseId: string
    courseTitle: string
    progress: number
    lastActivity?: string
    completedLessons: number
    totalLessons: number
}

// ============================================
// CERTIFICATION TYPES
// ============================================
export interface Certificate {
    id: string
    userId: string
    courseId: string
    certificateCode: string
    certificateId?: string
    courseTitle?: string
    issuedAt: string
    expiresAt?: string | null
    pdfUrl?: string | null
    course?: Course
    user?: User
}

export interface Exam {
    id: string
    courseId: string
    title: string
    description?: string
    passingScore: number
    duration: number
    questions?: ExamQuestion[]
}

export interface ExamQuestion {
    id: string
    examId: string
    question: string
    options: string[]
    order: number
}

export interface ExamAttempt {
    id: string
    examId: string
    userId: string
    score: number
    passed: boolean
    completedAt: string
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    isRead: boolean
    link?: string
    createdAt: string
}

// ============================================
// PAGINATION TYPES
// ============================================
export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface QueryParams {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    [key: string]: string | number | boolean | undefined
}
