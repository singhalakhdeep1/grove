import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CertificationService {
    constructor(private prisma: PrismaService) { }

    async createCertificate(userId: string, courseId: string) {
        const verificationCode = `CERT-${randomBytes(8).toString('hex').toUpperCase()}`;

        return this.prisma.certificate.create({
            data: {
                userId,
                courseId,
                verificationCode,
                issuedAt: new Date(),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                course: {
                    select: { id: true, title: true, instructor: true },
                },
            },
        });
    }

    async findUserCertificates(userId: string) {
        return this.prisma.certificate.findMany({
            where: { userId },
            include: {
                course: {
                    select: { id: true, title: true, thumbnailUrl: true },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }

    async verifyCertificate(verificationCode: string) {
        return this.prisma.certificate.findUnique({
            where: { verificationCode },
            include: {
                user: {
                    select: { firstName: true, lastName: true },
                },
                course: {
                    select: { title: true, instructor: true },
                },
            },
        });
    }

    async createExam(courseId: string, createDto: any) {
        return this.prisma.exam.create({
            data: {
                courseId,
                ...createDto,
            },
        });
    }

    async submitExamAttempt(examId: string, userId: string, answers: any[]) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true },
        });

        let score = 0;
        const totalQuestions = exam.questions.length;

        answers.forEach((answer) => {
            const question = exam.questions.find((q) => q.id === answer.questionId);
            if (question && question.correctAnswer === answer.selectedAnswer) {
                score++;
            }
        });

        const percentage = (score / totalQuestions) * 100;
        const passed = percentage >= exam.passingScore;

        return this.prisma.examAttempt.create({
            data: {
                examId,
                userId,
                score: percentage,
                passed,
                answers: {
                    create: answers,
                },
            },
            include: {
                answers: true,
            },
        });
    }
}
