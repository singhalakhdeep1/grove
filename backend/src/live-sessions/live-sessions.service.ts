import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiveSessionStatus } from '@prisma/client';

@Injectable()
export class LiveSessionsService {
    constructor(private prisma: PrismaService) { }

    async create(instructorId: string, createDto: any) {
        const session = await this.prisma.liveSession.create({
            data: {
                ...createDto,
                instructorId,
                status: LiveSessionStatus.SCHEDULED,
                roomId: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
            include: {
                instructor: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                course: true,
            },
        });

        return session;
    }

    async findAll(query: any) {
        const { courseId, status = LiveSessionStatus.SCHEDULED, page = 1, limit = 20 } = query;

        const where: any = { status };
        if (courseId) where.courseId = courseId;

        const [sessions, total] = await Promise.all([
            this.prisma.liveSession.findMany({
                where,
                include: {
                    instructor: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    course: { select: { id: true, title: true, thumbnailUrl: true } },
                    _count: { select: { attendees: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { scheduledAt: 'asc' },
            }),
            this.prisma.liveSession.count({ where }),
        ]);

        return {
            data: sessions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true },
                },
                course: true,
                attendees: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
                recordings: true,
            },
        });

        if (!session) throw new NotFoundException('Live session not found');
        return session;
    }

    async join(sessionId: string, userId: string) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) throw new NotFoundException('Session not found');

        if (session.status === LiveSessionStatus.ENDED) {
            throw new ForbiddenException('Session has ended');
        }

        const attendee = await this.prisma.sessionAttendee.upsert({
            where: {
                userId_sessionId: { userId, sessionId },
            },
            create: {
                userId,
                sessionId,
                joinedAt: new Date(),
            },
            update: {
                leftAt: null,
            },
        });

        return { roomId: session.roomId, attendee };
    }

    async start(id: string, instructorId: string) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id },
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.instructorId !== instructorId) {
            throw new ForbiddenException('Only the instructor can start the session');
        }

        return this.prisma.liveSession.update({
            where: { id },
            data: {
                status: LiveSessionStatus.LIVE,
                startedAt: new Date(),
            },
        });
    }

    async end(id: string, instructorId: string) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id },
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.instructorId !== instructorId) {
            throw new ForbiddenException('Only the instructor can end the session');
        }

        return this.prisma.liveSession.update({
            where: { id },
            data: {
                status: LiveSessionStatus.ENDED,
                endedAt: new Date(),
            },
        });
    }

    async createRecording(sessionId: string, recordingUrl: string, duration: number) {
        return this.prisma.sessionRecording.create({
            data: {
                sessionId,
                recordingUrl,
                duration,
            },
        });
    }
}
