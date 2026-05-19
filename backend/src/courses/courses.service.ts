import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CourseStatus,
    CourseLevel,
    UserRole,
    Prisma,
} from '@prisma/client';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    // Create a new course
    async create(instructorId: string, createCourseDto: any) {
        const course = await this.prisma.course.create({
            data: {
                ...createCourseDto,
                instructorId,
                status: CourseStatus.DRAFT,
            },
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                category: true,
            },
        });

        return course;
    }

    // Get all courses with filters
    async findAll(query: {
        search?: string;
        category?: string;
        level?: CourseLevel;
        status?: CourseStatus;
        minPrice?: number;
        maxPrice?: number;
        page?: number;
        limit?: number;
    }) {
        const {
            search,
            category,
            level,
            status = CourseStatus.PUBLISHED,
            minPrice,
            maxPrice,
            page = 1,
            limit = 12,
        } = query;

        const where: Prisma.CourseWhereInput = {
            status,
            AND: [
                search
                    ? {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } },
                            { tags: { has: search } },
                        ],
                    }
                    : {},
                category ? { categoryId: category } : {},
                level ? { level } : {},
                minPrice || maxPrice
                    ? {
                        price: {
                            ...(minPrice && { gte: minPrice }),
                            ...(maxPrice && { lte: maxPrice }),
                        },
                    }
                    : {},
            ],
        };

        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    instructor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    category: true,
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                            reviews: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.course.count({ where }),
        ]);

        return {
            data: courses,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get course by ID
    async findOne(id: string, userId?: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        bio: true,
                    },
                },
                category: true,
                lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                        video: true,
                        _count: {
                            select: { progress: true },
                        },
                    },
                },
                quizzes: {
                    include: {
                        questions: true,
                    },
                },
                assignments: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true,
                    },
                },
            },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // Check if user is enrolled
        let isEnrolled = false;
        let progress = null;

        if (userId) {
            const enrollment = await this.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: id,
                    },
                },
                include: {
                    progress: true,
                },
            });

            isEnrolled = !!enrollment;
            progress = enrollment?.progress;
        }

        return {
            ...course,
            isEnrolled,
            progress,
        };
    }

    // Update course
    async update(id: string, instructorId: string, updateCourseDto: any) {
        // Verify ownership
        const course = await this.prisma.course.findUnique({
            where: { id },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (course.instructorId !== instructorId) {
            throw new ForbiddenException('You are not the instructor of this course');
        }

        return this.prisma.course.update({
            where: { id },
            data: updateCourseDto,
            include: {
                instructor: true,
                category: true,
            },
        });
    }

    // Publish course
    async publish(id: string, instructorId: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                lessons: true,
            },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (course.instructorId !== instructorId) {
            throw new ForbiddenException('You are not the instructor of this course');
        }

        // Validation: Course must have at least one lesson
        if (course.lessons.length === 0) {
            throw new BadRequestException(
                'Course must have at least one lesson to be published',
            );
        }

        return this.prisma.course.update({
            where: { id },
            data: {
                status: CourseStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });
    }

    // Delete course
    async remove(id: string, instructorId: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { enrollments: true },
                },
            },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (course.instructorId !== instructorId) {
            throw new ForbiddenException('You are not the instructor of this course');
        }

        // Don't allow deletion if there are enrollments
        if (course._count.enrollments > 0) {
            throw new BadRequestException(
                'Cannot delete course with active enrollments. Archive it instead.',
            );
        }

        await this.prisma.course.delete({
            where: { id },
        });

        return { message: 'Course deleted successfully' };
    }

    // Get instructor courses
    async getInstructorCourses(instructorId: string) {
        return this.prisma.course.findMany({
            where: { instructorId },
            include: {
                category: true,
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                        reviews: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get course statistics
    async getStatistics(courseId: string, instructorId: string) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (course.instructorId !== instructorId) {
            throw new ForbiddenException('Access denied');
        }

        const [
            totalEnrollments,
            activeStudents,
            completionRate,
            averageProgress,
            revenue,
            reviews,
        ] = await Promise.all([
            this.prisma.enrollment.count({
                where: { courseId },
            }),
            this.prisma.enrollment.count({
                where: {
                    courseId,
                    lastAccessedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                },
            }),
            this.prisma.courseProgress.count({
                where: {
                    enrollment: { courseId },
                    completedAt: { not: null },
                },
            }),
            this.prisma.courseProgress.aggregate({
                where: { enrollment: { courseId } },
                _avg: { progressPercentage: true },
            }),
            this.prisma.enrollment.aggregate({
                where: { courseId },
                _sum: { price: true },
            }),
            this.prisma.review.aggregate({
                where: { courseId },
                _avg: { rating: true },
                _count: true,
            }),
        ]);

        return {
            totalEnrollments,
            activeStudents,
            completionRate: totalEnrollments > 0 ? (completionRate / totalEnrollments) * 100 : 0,
            averageProgress: averageProgress._avg.progressPercentage || 0,
            revenue: revenue._sum.price || 0,
            averageRating: reviews._avg.rating || 0,
            totalReviews: reviews._count,
        };
    }
}
