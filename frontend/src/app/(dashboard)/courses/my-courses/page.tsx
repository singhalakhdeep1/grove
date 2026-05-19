'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Eye, Users } from 'lucide-react'
import { coursesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Course } from '@/types'

const levelColors: Record<string, any> = {
    BEGINNER: 'success', INTERMEDIATE: 'warning', ADVANCED: 'destructive', EXPERT: 'secondary'
}

export default function MyCoursesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['my-courses'],
        queryFn: coursesApi.myCourses,
    })

    const deleteCourse = useMutation({
        mutationFn: (id: string) => coursesApi.delete(id),
        onSuccess: () => {
            toast.success('Course deleted')
            queryClient.invalidateQueries({ queryKey: ['my-courses'] })
        },
        onError: () => toast.error('Failed to delete course'),
    })

    const courses: Course[] = data?.data ?? data ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1>My Courses</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your created courses</p>
                </div>
                <Button onClick={() => router.push('/courses/create')}>
                    <Plus className="h-4 w-4 mr-2" /> Create Course
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            ) : courses.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
                        <Button onClick={() => router.push('/courses/create')}>
                            <Plus className="h-4 w-4 mr-2" /> Create Your First Course
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {courses.map((course) => (
                        <Card key={course.id}>
                            <CardContent className="p-5 flex items-center gap-4">
                                {course.thumbnail && (
                                    <img src={course.thumbnail} alt={course.title} className="h-16 w-24 object-cover rounded-lg flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{course.title}</h3>
                                        <Badge variant={levelColors[course.level]}>{course.level}</Badge>
                                        <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course._count?.enrollments ?? 0} students</span>
                                        <span>Updated {formatDate(course.updatedAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/courses/${course.id}`)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/courses/${course.id}/edit`)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => {
                                            if (confirm('Delete this course? This cannot be undone.')) deleteCourse.mutate(course.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
