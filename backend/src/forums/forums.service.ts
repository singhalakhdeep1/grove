import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteType } from '@prisma/client';

@Injectable()
export class ForumsService {
    constructor(private prisma: PrismaService) { }

    // Forums
    async createForum(createDto: any) {
        return this.prisma.forum.create({
            data: createDto,
            include: { category: true },
        });
    }

    async findAllForums() {
        return this.prisma.forum.findMany({
            include: {
                category: true,
                _count: { select: { threads: true } },
            },
        });
    }

    // Threads
    async createThread(forumId: string, userId: string, createDto: any) {
        return this.prisma.thread.create({
            data: {
                ...createDto,
                forumId,
                authorId: userId,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                tags: true,
            },
        });
    }

    async findThreads(forumId: string, query: any) {
        const { page = 1, limit = 20, search, tag } = query;

        const where: any = { forumId };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (tag) {
            where.tags = { some: { name: tag } };
        }

        const [threads, total] = await Promise.all([
            this.prisma.thread.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    tags: true,
                    _count: { select: { posts: true, views: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.thread.count({ where }),
        ]);

        return {
            data: threads,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findThread(id: string, userId?: string) {
        const thread = await this.prisma.thread.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                forum: true,
                tags: true,
                posts: {
                    include: {
                        author: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                        _count: { select: { votes: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!thread) throw new NotFoundException('Thread not found');

        // Track view
        if (userId) {
            await this.prisma.threadView.create({
                data: { threadId: id, userId },
            });
        }

        return thread;
    }

    // Posts
    async createPost(threadId: string, userId: string, createDto: any) {
        return this.prisma.post.create({
            data: {
                ...createDto,
                threadId,
                authorId: userId,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
    }

    async updatePost(id: string, userId: string, updateDto: any) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) {
            throw new ForbiddenException('You can only edit your own posts');
        }

        return this.prisma.post.update({
            where: { id },
            data: updateDto,
        });
    }

    async deletePost(id: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        await this.prisma.post.delete({ where: { id } });
        return { message: 'Post deleted successfully' };
    }

    // Voting
    async votePost(postId: string, userId: string, voteType: VoteType) {
        const existing = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            if (existing.voteType === voteType) {
                await this.prisma.postVote.delete({
                    where: { id: existing.id },
                });
                return { message: 'Vote removed' };
            } else {
                await this.prisma.postVote.update({
                    where: { id: existing.id },
                    data: { voteType },
                });
                return { message: 'Vote updated' };
            }
        }

        await this.prisma.postVote.create({
            data: { userId, postId, voteType },
        });

        return { message: 'Vote recorded' };
    }

    async markAsBestAnswer(postId: string, threadAuthorId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { thread: true },
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.thread.authorId !== threadAuthorId) {
            throw new ForbiddenException('Only thread author can mark best answer');
        }

        await this.prisma.post.update({
            where: { id: postId },
            data: { isBestAnswer: true },
        });

        return { message: 'Marked as best answer' };
    }
}
