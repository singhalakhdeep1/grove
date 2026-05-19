import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getUserAnalytics(userId: string) {
        const [enrollments, completedCourses, totalTimeSpent, achievements] = await Promise.all([
            this.prisma.enrollment.count({ where: { userId } }),
            this.prisma.courseProgress.count({
                where: {
                    enrollment: { userId },
                    completedAt: { not: null },
                },
            }),
            this.prisma.learningAnalytics.aggregate({
                where: { userId },
                _sum: { timeSpent: true },
            }),
            this.prisma.userAchievement.count({ where: { userId } }),
        ]);

        return {
            totalEnrollments: enrollments,
            completedCourses,
            totalHoursSpent: Math.round((totalTimeSpent._sum.timeSpent || 0) / 3600),
            achievements,
        };
    }

    async getCourseAnalytics(courseId: string) {
        const [enrollments, completionRate, averageRating, revenue] = await Promise.all([
            this.prisma.enrollment.count({ where: { courseId } }),
            this.calculateCompletionRate(courseId),
            this.prisma.review.aggregate({
                where: { courseId },
                _avg: { rating: true },
            }),
            this.prisma.enrollment.aggregate({
                where: { courseId },
                _sum: { price: true },
            }),
        ]);

        return {
            totalEnrollments: enrollments,
            completionRate,
            averageRating: averageRating._avg.rating || 0,
            totalRevenue: revenue._sum.price || 0,
        };
    }

    async getLearningProgress(userId: string) {
        return this.prisma.userProgress.findMany({
            where: { userId },
            include: {
                course: {
                    select: { id: true, title: true, thumbnailUrl: true },
                },
            },
            orderBy: { lastAccessedAt: 'desc' },
        });
    }

    private async calculateCompletionRate(courseId: string): Promise<number> {
        const total = await this.prisma.enrollment.count({ where: { courseId } });
        if (total === 0) return 0;

        const completed = await this.prisma.courseProgress.count({
            where: {
                enrollment: { courseId },
                completedAt: { not: null },
            },
        });

        return Math.round((completed / total) * 100);
    }
}
