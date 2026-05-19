import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudyGroupsService {
    constructor(private prisma: PrismaService) { }

    async create(creatorId: string, createDto: any) {
        return this.prisma.studyGroup.create({
            data: {
                ...createDto,
                creatorId,
                members: {
                    create: {
                        userId: creatorId,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                creator: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                _count: { select: { members: true, posts: true } },
            },
        });
    }

    async findAll(query: any) {
        const { search, page = 1, limit = 20 } = query;
        const where: any = { isPublic: true };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [groups, total] = await Promise.all([
            this.prisma.studyGroup.findMany({
                where,
                include: {
                    creator: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    _count: { select: { members: true, posts: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.studyGroup.count({ where }),
        ]);

        return {
            data: groups,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const group = await this.prisma.studyGroup.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
                posts: {
                    include: {
                        author: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!group) throw new NotFoundException('Study group not found');
        return group;
    }

    async join(groupId: string, userId: string) {
        return this.prisma.groupMember.create({
            data: {
                groupId,
                userId,
                role: 'MEMBER',
            },
        });
    }

    async createPost(groupId: string, userId: string, createDto: any) {
        return this.prisma.groupPost.create({
            data: {
                groupId,
                authorId: userId,
                ...createDto,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
    }
}
