import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
    constructor(private prisma: PrismaService) {}

    async findByLesson(lessonId: string) {
        return this.prisma.quiz.findUnique({
            where: { lessonId },
            include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
        });
    }

    async findById(quizId: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id: quizId },
            include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
        });
        if (!quiz) throw new NotFoundException('Quiz not found');
        return quiz;
    }

    async create(lessonId: string, dto: any) {
        return this.prisma.quiz.create({
            data: { lessonId, ...dto },
            include: { questions: true },
        });
    }

    async update(quizId: string, dto: any) {
        await this.findById(quizId);
        return this.prisma.quiz.update({ where: { id: quizId }, data: dto });
    }

    async submitAttempt(userId: string, quizId: string, answers: { questionId: string; answer: string }[]) {
        const quiz = await this.findById(quizId);

        const prevAttempts = await this.prisma.quizAttempt.count({ where: { userId, quizId } });
        if (quiz.maxAttempts && prevAttempts >= quiz.maxAttempts) {
            throw new BadRequestException('Maximum attempts reached');
        }

        let earned = 0;
        let total = 0;

        const answerRecords = answers.map(a => {
            const question = quiz.questions.find(q => q.id === a.questionId);
            if (!question) return { questionId: a.questionId, answer: a.answer, isCorrect: false, points: 0 };

            const correct = question.options.find(o => o.isCorrect);
            const isCorrect = correct ? correct.content === a.answer : false;
            const pts = isCorrect ? question.points : 0;
            total += question.points;
            earned += pts;
            return { questionId: a.questionId, answer: a.answer, isCorrect, points: pts };
        });

        const score = total > 0 ? (earned / total) * 100 : 0;
        const passed = score >= quiz.passingScore;

        const attempt = await this.prisma.quizAttempt.create({
            data: {
                userId, quizId, score, passed,
                timeSpent: 0,
                startedAt: new Date(),
                completedAt: new Date(),
                answers: { create: answerRecords },
            },
            include: { answers: true },
        });

        return { ...attempt, score, passed };
    }

    async getAttempts(userId: string, quizId: string) {
        return this.prisma.quizAttempt.findMany({
            where: { userId, quizId },
            orderBy: { startedAt: 'desc' },
        });
    }
}
