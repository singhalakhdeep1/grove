import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
    constructor(private prisma: PrismaService) { }

    async createConversation(userId: string, participantIds: string[]) {
        const allParticipants = [userId, ...participantIds];

        const conversation = await this.prisma.conversation.create({
            data: {
                participants: {
                    create: allParticipants.map((id) => ({ userId: id })),
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        return conversation;
    }

    async findConversations(userId: string) {
        return this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findMessages(conversationId: string, userId: string, query: any) {
        const { page = 1, limit = 50 } = query;

        // Verify user is participant
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { userId },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { conversationId },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    readReceipts: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true },
                            },
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.message.count({ where: { conversationId } }),
        ]);

        return {
            data: messages.reverse(),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async sendMessage(conversationId: string, senderId: string, content: string) {
        const message = await this.prisma.message.create({
            data: {
                conversationId,
                senderId,
                content,
            },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });

        // Update conversation timestamp
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    async markAsRead(messageId: string, userId: string) {
        await this.prisma.messageReadReceipt.create({
            data: {
                messageId,
                userId,
            },
        });

        return { message: 'Marked as read' };
    }

    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) throw new NotFoundException('Message not found');
        if (message.senderId !== userId) {
            throw new NotFoundException('You can only delete your own messages');
        }

        await this.prisma.message.delete({ where: { id: messageId } });
        return { message: 'Message deleted' };
    }
}
