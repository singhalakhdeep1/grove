'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import {
    BookOpen, Clock, Users, Star, Globe, Award, CheckCircle2,
    Play, Lock, ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react'
import { coursesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration, formatPrice, levelToColor, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CourseModule, Lesson } from '@/types'

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

    const { data: course, isLoading } = useQuery({
        queryKey: ['course', id],
        queryFn: () => coursesApi.get(id),
    })

    const enrollMutation = useMutation({
        mutationFn: () => coursesApi.get(id), // enrollment would be a separate endpoint
        onSuccess: () => {
            toast.success('Enrolled successfully!')
            queryClient.invalidateQueries({ queryKey: ['course', id] })
        },
        onError: () => toast.error('Enrollment failed'),
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Course not found</p>
                <Button onClick={() => router.back()} className="mt-4" variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                </Button>
            </div>
        )
    }

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev)
            next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
            return next
        })
    }

    const totalLessons = course.modules?.reduce((acc: number, m: CourseModule) => acc + (m.lessons?.length ?? 0), 0) ?? 0

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/courses" className="hover:text-foreground">Courses</Link>
                <span>/</span>
                <span className="text-foreground">{course.title}</span>
            </div>

            {/* Hero banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-grove-800 to-grove-600 h-56">
                {course.thumbnail && (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-30" />
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={levelToColor(course.level)}>{course.level}</Badge>
                        {course.isFree && <Badge variant="success">Free</Badge>}
                    </div>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    {course.instructor && (
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar name={course.instructor.name} src={course.instructor.avatar} size="sm" />
                            <span className="text-sm">{course.instructor.name}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats row */}
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {formatDuration(course.duration)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" /> {totalLessons} lessons
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {course._count?.enrollments ?? 0} students
                        </span>
                        {course.averageRating !== undefined && (
                            <span className="flex items-center gap-1.5 text-yellow-600">
                                <Star className="h-4 w-4 fill-current" /> {course.averageRating.toFixed(1)} rating
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Globe className="h-4 w-4" /> {course.language.toUpperCase()}
                        </span>
                    </div>

                    {/* Enrollment progress (if enrolled) */}
                    {course.isEnrolled && course.enrollments?.[0] && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Your Progress</span>
                                    <span className="text-sm text-muted-foreground">{course.enrollments[0].progress}%</span>
                                </div>
                                <Progress value={course.enrollments[0].progress} showLabel color="success" />
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    <Card>
                        <CardHeader><CardTitle>About this course</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                        </CardContent>
                    </Card>

                    {/* Learning goals */}
                    {course.learningGoals?.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>What you&apos;ll learn</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {course.learningGoals.map((goal: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{goal}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Course curriculum */}
                    {course.modules && course.modules.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Curriculum</CardTitle>
                                <p className="text-sm text-muted-foreground">{course.modules.length} modules · {totalLessons} lessons</p>
                            </CardHeader>
                            <CardContent className="p-0">
                                {course.modules.map((module: CourseModule) => (
                                    <div key={module.id} className="border-b border-border last:border-0">
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">{module.title}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {module.lessons?.length ?? 0} lessons
                                                </Badge>
                                            </div>
                                            {expandedModules.has(module.id) ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </button>

                                        {expandedModules.has(module.id) && module.lessons && (
                                            <div className="bg-muted/30">
                                                {module.lessons.map((lesson: Lesson) => (
                                                    <div key={lesson.id} className="flex items-center gap-3 px-6 py-3 border-t border-border">
                                                        <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                                                            {lesson.isPreview || course.isEnrolled ? (
                                                                <Play className="h-3.5 w-3.5 text-primary" />
                                                            ) : (
                                                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{lesson.title}</p>
                                                            {lesson.duration && (
                                                                <p className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</p>
                                                            )}
                                                        </div>
                                                        {lesson.progress?.completed && (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - enrollment card */}
                <div>
                    <Card className="sticky top-20">
                        <CardContent className="p-6 space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {formatPrice(course.price)}
                                </div>
                                {course.discountPrice && (
                                    <div className="text-sm text-muted-foreground line-through">{formatPrice(course.discountPrice)}</div>
                                )}
                            </div>

                            {course.isEnrolled ? (
                                <Button className="w-full" size="lg" asChild>
                                    <Link href={`/courses/${course.id}/learn`}>
                                        <Play className="h-4 w-4 mr-2" /> Continue Learning
                                    </Link>
                                </Button>
                            ) : user ? (
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() => enrollMutation.mutate()}
                                    loading={enrollMutation.isPending}
                                >
                                    {course.isFree ? 'Enroll for Free' : `Enroll Now`}
                                </Button>
                            ) : (
                                <Button className="w-full" size="lg" asChild>
                                    <Link href="/login">Sign in to Enroll</Link>
                                </Button>
                            )}

                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    {formatDuration(course.duration)} of content
                                </li>
                                <li className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    {totalLessons} lessons
                                </li>
                                <li className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" />
                                    Certificate of completion
                                </li>
                                <li className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    Full lifetime access
                                </li>
                            </ul>

                            <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
                                Updated {formatDate(course.updatedAt)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
