import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonType } from '@prisma/client';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) {}

    async findByModule(moduleId: string) {
        return this.prisma.lesson.findMany({
            where: { moduleId },
            orderBy: { order: 'asc' },
        });
    }

    async findById(lessonId: string) {
        const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new NotFoundException('Lesson not found');
        return lesson;
    }

    async create(moduleId: string, dto: {
        title: string;
        type: LessonType;
        description?: string;
        content?: string;
        videoUrl?: string;
        videoDuration?: number;
        order?: number;
        isFree?: boolean;
    }) {
        const count = await this.prisma.lesson.count({ where: { moduleId } });
        return this.prisma.lesson.create({
            data: {
                moduleId,
                order: dto.order ?? count + 1,
                title: dto.title,
                type: dto.type,
                description: dto.description,
                content: dto.content,
                videoUrl: dto.videoUrl,
                videoDuration: dto.videoDuration,
                isFree: dto.isFree ?? false,
            },
        });
    }

    async update(lessonId: string, dto: any) {
        await this.findById(lessonId);
        return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
    }

    async delete(lessonId: string) {
        await this.findById(lessonId);
        return this.prisma.lesson.delete({ where: { id: lessonId } });
    }

    async markComplete(userId: string, lessonId: string, watchTime?: number) {
        return this.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: { isCompleted: true, completedAt: new Date(), watchTime: watchTime ?? 0 },
            create: { userId, lessonId, isCompleted: true, completedAt: new Date(), watchTime: watchTime ?? 0 },
        });
    }

    async getProgress(userId: string, lessonId: string) {
        return this.prisma.lessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });
    }
}
