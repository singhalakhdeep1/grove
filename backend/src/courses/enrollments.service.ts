import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
    constructor(private prisma: PrismaService) {}

    async enroll(userId: string, courseId: string) {
        const existing = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing) throw new ConflictException('Already enrolled');

        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        return this.prisma.enrollment.create({ data: { userId, courseId } });
    }

    async unenroll(userId: string, courseId: string) {
        const e = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!e) throw new NotFoundException('Enrollment not found');
        return this.prisma.enrollment.update({
            where: { id: e.id },
            data: { status: EnrollmentStatus.DROPPED },
        });
    }

    async findByUser(userId: string) {
        return this.prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        instructor: { select: { id: true, firstName: true, lastName: true } },
                        category: true,
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });
    }

    async findByCourse(courseId: string) {
        return this.prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { enrolledAt: 'desc' },
        });
    }

    async updateProgress(userId: string, courseId: string, progress: number) {
        const e = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!e) throw new NotFoundException('Enrollment not found');

        const data: any = { progress, lastAccessedAt: new Date() };
        if (progress >= 100) {
            data.status = EnrollmentStatus.COMPLETED;
            data.completedAt = new Date();
        }

        return this.prisma.enrollment.update({ where: { id: e.id }, data });
    }

    async getStatus(userId: string, courseId: string) {
        return this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
    }
}
