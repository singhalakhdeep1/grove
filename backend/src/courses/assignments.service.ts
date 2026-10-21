import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
    constructor(private prisma: PrismaService) {}

    async findByLesson(lessonId: string) {
        return this.prisma.assignment.findUnique({
            where: { lessonId },
            include: { submissions: { orderBy: { submittedAt: 'desc' } } },
        });
    }

    async findById(assignmentId: string) {
        const a = await this.prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { submissions: true },
        });
        if (!a) throw new NotFoundException('Assignment not found');
        return a;
    }

    async create(lessonId: string, dto: any) {
        return this.prisma.assignment.create({ data: { lessonId, ...dto } });
    }

    async update(assignmentId: string, dto: any) {
        await this.findById(assignmentId);
        return this.prisma.assignment.update({ where: { id: assignmentId }, data: dto });
    }

    async submit(userId: string, assignmentId: string, dto: { content: string; attachments?: string[] }) {
        await this.findById(assignmentId);
        return this.prisma.assignmentSubmission.create({
            data: {
                assignmentId,
                userId,
                content: dto.content,
                attachments: dto.attachments ?? [],
            },
        });
    }

    async grade(submissionId: string, score: number, feedback?: string) {
        return this.prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: { score, feedback, status: 'GRADED', gradedAt: new Date() },
        });
    }

    async getSubmissions(assignmentId: string) {
        return this.prisma.assignmentSubmission.findMany({
            where: { assignmentId },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { submittedAt: 'desc' },
        });
    }

    async getMySubmission(userId: string, assignmentId: string) {
        return this.prisma.assignmentSubmission.findFirst({
            where: { userId, assignmentId },
            orderBy: { submittedAt: 'desc' },
        });
    }
}
