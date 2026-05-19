'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Filter, BookOpen, Star, Users, Clock, ChevronRight } from 'lucide-react'
import { coursesApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { formatPrice, formatDuration, levelToColor } from '@/lib/utils'
import type { Course } from '@/types'

const levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

export default function CoursesPage() {
    const [search, setSearch] = useState('')
    const [level, setLevel] = useState('All')
    const [sortBy, setSortBy] = useState('newest')

    const { data, isLoading } = useQuery({
        queryKey: ['courses', search, level, sortBy],
        queryFn: () =>
            coursesApi.list({
                search: search || undefined,
                level: level === 'All' ? undefined : level,
                sort: sortBy,
            }),
    })

    const courses: Course[] = data?.data ?? data ?? []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1>Explore Courses</h1>
                    <p className="text-muted-foreground mt-1">Discover courses taught by expert instructors</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {levels.map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${level === l
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            {l === 'All' ? 'All Levels' : l.charAt(0) + l.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input w-auto"
                >
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* Results count */}
            {!isLoading && (
                <p className="text-sm text-muted-foreground">
                    {courses.length} course{courses.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Course grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                    : courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
            </div>

            {!isLoading && courses.length === 0 && (
                <div className="text-center py-16">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No courses found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
                    <Button onClick={() => { setSearch(''); setLevel('All') }} className="mt-4" variant="outline">
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    )
}

function CourseCard({ course }: { course: Course }) {
    return (
        <Link href={`/courses/${course.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-grove-200 to-grove-400 overflow-hidden">
                    {course.thumbnail ? (
                        <Image src={course.thumbnail} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white opacity-60" />
                        </div>
                    )}
                    {course.isFree && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            Free
                        </span>
                    )}
                </div>

                <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    </div>

                    {course.instructor && (
                        <p className="text-xs text-muted-foreground">{course.instructor.name}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {course.averageRating !== undefined && (
                            <span className="flex items-center gap-1 text-yellow-600">
                                <Star className="h-3 w-3 fill-current" />
                                {course.averageRating.toFixed(1)}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course._count?.enrollments ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(course.duration)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <Badge className={levelToColor(course.level)} variant="outline">
                            {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                        </Badge>
                        <span className="text-sm font-bold text-primary">
                            {formatPrice(course.price)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
