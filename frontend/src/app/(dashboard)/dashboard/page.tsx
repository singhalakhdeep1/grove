'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, Trophy, Users, Video, TrendingUp, Clock, Star, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { analyticsApi, coursesApi, gamificationApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration, formatRelativeTime } from '@/lib/utils'
import type { LearningProgress } from '@/types'

export default function DashboardPage() {
    const { user } = useAuthStore()

    const { data: analytics, isLoading: analyticsLoading } = useQuery({
        queryKey: ['user-analytics'],
        queryFn: analyticsApi.getUserAnalytics,
    })

    const { data: progress, isLoading: progressLoading } = useQuery({
        queryKey: ['learning-progress'],
        queryFn: analyticsApi.getLearningProgress,
    })

    const { data: gamification, isLoading: gamLoading } = useQuery({
        queryKey: ['gamification-progress'],
        queryFn: gamificationApi.getProgress,
    })

    const { data: coursesData } = useQuery({
        queryKey: ['my-courses'],
        queryFn: coursesApi.myCourses,
        enabled: user?.role === 'INSTRUCTOR',
    })

    const statsCards = [
        {
            title: 'Courses Enrolled',
            value: analytics?.totalCoursesEnrolled ?? 0,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950',
            href: '/courses',
        },
        {
            title: 'Courses Completed',
            value: analytics?.totalCoursesCompleted ?? 0,
            icon: Trophy,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50 dark:bg-yellow-950',
            href: '/certifications',
        },
        {
            title: 'Learning Streak',
            value: `${gamification?.currentStreak ?? 0} days`,
            icon: Zap,
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-950',
            href: '/gamification',
        },
        {
            title: 'Total Points',
            value: (gamification?.totalPoints ?? 0).toLocaleString(),
            icon: Star,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950',
            href: '/gamification',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-3xl font-bold">
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Keep up the great work on your learning journey.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map(({ title, value, icon: Icon, color, bg, href }) => (
                    <Link key={title} href={href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{title}</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {analyticsLoading || gamLoading ? <Skeleton className="h-8 w-16" /> : value}
                                        </p>
                                    </div>
                                    <div className={`h-12 w-12 ${bg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Learning progress */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Continue Learning
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {progressLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-2 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : progress?.length > 0 ? (
                                <div className="space-y-5">
                                    {progress.slice(0, 5).map((item: LearningProgress) => (
                                        <div key={item.courseId}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <Link
                                                    href={`/courses/${item.courseId}`}
                                                    className="text-sm font-medium hover:text-primary truncate max-w-[70%]"
                                                >
                                                    {item.courseTitle}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.completedLessons}/{item.totalLessons} lessons
                                                </span>
                                            </div>
                                            <Progress value={item.progress} showLabel />
                                            {item.lastActivity && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Last activity {formatRelativeTime(item.lastActivity)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No courses in progress</p>
                                    <Link href="/courses">
                                        <Button size="sm" className="mt-3">Browse Courses</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* XP Progress */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Level Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {gamLoading ? (
                                <Skeleton className="h-20 w-full" />
                            ) : gamification ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-2xl font-bold text-primary">Lv. {gamification.currentLevel}</span>
                                            <p className="text-sm text-muted-foreground">{gamification.levelName}</p>
                                        </div>
                                        <Badge variant="success">{gamification.totalPoints.toLocaleString()} XP</Badge>
                                    </div>
                                    <Progress value={gamification.totalPoints} max={gamification.totalPoints + gamification.pointsToNextLevel} color="success" showLabel />
                                    <p className="text-xs text-muted-foreground text-center">
                                        {gamification.pointsToNextLevel} XP to next level
                                    </p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Quick actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/courses" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-sm group-hover:text-foreground text-muted-foreground">Browse Courses</span>
                            </Link>
                            <Link href="/live-sessions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                <div className="h-8 w-8 bg-red-50 dark:bg-red-950 rounded-lg flex items-center justify-center">
                                    <Video className="h-4 w-4 text-red-600" />
                                </div>
                                <span className="text-sm group-hover:text-foreground text-muted-foreground">Live Sessions</span>
                            </Link>
                            <Link href="/study-groups" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                <div className="h-8 w-8 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                                    <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-sm group-hover:text-foreground text-muted-foreground">Study Groups</span>
                            </Link>
                            <Link href="/mentorship" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                <div className="h-8 w-8 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-purple-600" />
                                </div>
                                <span className="text-sm group-hover:text-foreground text-muted-foreground">Find a Mentor</span>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Time spent this week */}
            {analytics?.weeklyActivity && analytics.weeklyActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            This Week&apos;s Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-24">
                            {analytics.weeklyActivity.map((day: { day: string; minutes: number }) => {
                                const max = Math.max(...analytics.weeklyActivity.map((d: { minutes: number }) => d.minutes), 1)
                                const heightPct = (day.minutes / max) * 100
                                return (
                                    <div key={day.day} className="flex flex-col items-center flex-1 gap-1">
                                        <div
                                            className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors"
                                            style={{ height: `${heightPct}%`, minHeight: day.minutes > 0 ? '4px' : '0' }}
                                            title={`${formatDuration(day.minutes)}`}
                                        />
                                        <span className="text-xs text-muted-foreground">{day.day.slice(0, 3)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
