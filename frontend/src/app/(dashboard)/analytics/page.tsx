'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function AnalyticsPage() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['analytics'],
        queryFn: analyticsApi.getUserAnalytics,
    })

    const { data: learningProgress, isLoading: progressLoading } = useQuery({
        queryKey: ['learning-progress'],
        queryFn: analyticsApi.getLearningProgress,
    })

    if (isLoading || progressLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    const weeklyData = analytics?.weeklyActivity?.map((w: any) => ({
        day: w.day,
        minutes: w.minutesLearned,
        lessons: w.lessonsCompleted,
    })) ?? []

    const categoryData = analytics?.categoryActivity?.map((c: any) => ({
        name: c.categoryName,
        value: c.minutesLearned,
    })) ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1>Learning Analytics</h1>
                <p className="text-muted-foreground mt-1">Detailed insights into your learning journey</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Learning Time', value: `${Math.round((analytics?.totalMinutesLearned ?? 0) / 60)}h`, sub: `${analytics?.totalMinutesLearned ?? 0} minutes` },
                    { label: 'Lessons Completed', value: analytics?.totalLessonsCompleted ?? 0, sub: 'all time' },
                    { label: 'Courses Enrolled', value: analytics?.totalCoursesEnrolled ?? 0, sub: `${analytics?.completedCourses ?? 0} completed` },
                    { label: 'Average Completion', value: `${Math.round(analytics?.averageCompletionRate ?? 0)}%`, sub: 'per course' },
                ].map(({ label, value, sub }) => (
                    <Card key={label}>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className="text-2xl font-bold mt-1">{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Weekly Learning Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {weeklyData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weeklyData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(v: number, name: string) => [name === 'minutes' ? `${v} min` : v, name === 'minutes' ? 'Learning Time' : 'Lessons']}
                                    />
                                    <Legend />
                                    <Bar dataKey="minutes" fill="hsl(var(--primary))" name="Minutes" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="lessons" fill="#3b82f6" name="Lessons" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Category breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Learning by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width={180} height={180}>
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                            {categoryData.map((_: unknown, index: number) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [`${v} min`]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-2">
                                    {categoryData.map((d: any, i: number) => (
                                        <div key={d.name} className="flex items-center gap-2 text-sm">
                                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="truncate flex-1">{d.name}</span>
                                            <span className="font-medium text-muted-foreground">{d.value}m</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Learning progress per course */}
            {learningProgress && learningProgress.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Course Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {learningProgress.map((p: any) => (
                            <div key={p.courseId}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium truncate flex-1 mr-4">{p.courseTitle}</span>
                                    <Badge variant={p.completionRate === 100 ? 'success' : 'secondary'}>{p.completionRate}%</Badge>
                                </div>
                                <Progress value={p.completionRate} max={100} color={p.completionRate === 100 ? 'success' : 'default'} />
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {p.completedLessons}/{p.totalLessons} lessons · {p.minutesLearned} min
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
