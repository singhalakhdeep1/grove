import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentorshipService {
    constructor(private prisma: PrismaService) { }

    async findMentors(query: any) {
        const { expertise, page = 1, limit = 20 } = query;
        const where: any = {};
        if (expertise) where.expertise = { has: expertise };

        const [mentors, total] = await Promise.all([
            this.prisma.mentor.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true },
                    },
                    _count: { select: { sessions: true, reviews: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.mentor.count({ where }),
        ]);

        return {
            data: mentors,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async requestMentorship(mentorId: string, menteeId: string, createDto: any) {
        return this.prisma.mentorshipRequest.create({
            data: {
                mentorId,
                menteeId,
                ...createDto,
            },
            include: {
                mentor: { include: { user: true } },
                mentee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
    }

    async createSession(requestId: string, createDto: any) {
        return this.prisma.mentorshipSession.create({
            data: {
                requestId,
                ...createDto,
            },
        });
    }

    async addReview(sessionId: string, menteeId: string, createDto: any) {
        return this.prisma.mentorReview.create({
            data: {
                sessionId,
                menteeId,
                ...createDto,
            },
        });
    }
}
