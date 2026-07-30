import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class VideoService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Create a video bookmark
   */
  async createBookmark(userId: string, lessonId: string, data: {
    timestamp: number;
    title?: string;
    description?: string;
  }) {
    // Verify user has access to the lesson
    await this.verifyLessonAccess(userId, lessonId);

    return await this.prisma.videoBookmark.create({
      data: {
        userId,
        lessonId,
        timestamp: data.timestamp,
        title: data.title,
        description: data.description,
      },
    });
  }

  /**
   * Get all bookmarks for a lesson
   */
  async getLessonBookmarks(userId: string, lessonId: string) {
    await this.verifyLessonAccess(userId, lessonId);

    return await this.prisma.videoBookmark.findMany({
      where: { userId, lessonId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(userId: string, bookmarkId: string) {
    const bookmark = await this.prisma.videoBookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('You can only delete your own bookmarks');
    }

    await this.prisma.videoBookmark.delete({
      where: { id: bookmarkId },
    });

    return { success: true };
  }

  /**
   * Create a video note
   */
  async createNote(userId: string, lessonId: string, data: {
    timestamp: number;
    content: string;
    isPrivate?: boolean;
  }) {
    await this.verifyLessonAccess(userId, lessonId);

    return await this.prisma.videoNote.create({
      data: {
        userId,
        lessonId,
        timestamp: data.timestamp,
        content: data.content,
        isPrivate: data.isPrivate ?? true,
      },
    });
  }

  /**
   * Get all notes for a lesson
   */
  async getLessonNotes(userId: string, lessonId: string, includePublic: boolean = false) {
    await this.verifyLessonAccess(userId, lessonId);

    const where: any = { lessonId };
    if (!includePublic) {
      where.userId = userId;
    } else {
      where.OR = [
        { userId },
        { isPrivate: false },
      ];
    }

    return await this.prisma.videoNote.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Update a note
   */
  async updateNote(userId: string, noteId: string, data: {
    content?: string;
    isPrivate?: boolean;
  }) {
    const note = await this.prisma.videoNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    return await this.prisma.videoNote.update({
      where: { id: noteId },
      data,
    });
  }

  /**
   * Delete a note
   */
  async deleteNote(userId: string, noteId: string) {
    const note = await this.prisma.videoNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.prisma.videoNote.delete({
      where: { id: noteId },
    });

    return { success: true };
  }

  /**
   * Start a video playback session
   */
  async startPlaybackSession(userId: string, lessonId: string, data: {
    quality?: string;
    playbackSpeed?: number;
  }) {
    await this.verifyLessonAccess(userId, lessonId);

    // End any existing sessions for this lesson
    await this.prisma.videoPlaybackSession.updateMany({
      where: {
        userId,
        lessonId,
        endedAt: null,
      },
      data: { endedAt: new Date() },
    });

    return await this.prisma.videoPlaybackSession.create({
      data: {
        userId,
        lessonId,
        quality: data.quality,
        playbackSpeed: data.playbackSpeed || 1.0,
      },
    });
  }

  /**
   * Update playback session progress
   */
  async updatePlaybackProgress(userId: string, sessionId: string, data: {
    lastPosition: number;
    totalWatchTime: number;
    completionRate: number;
  }) {
    const session = await this.prisma.videoPlaybackSession.findUnique({
      where: { id: sessionId },
      include: { lesson: true },
    });

    if (!session) {
      throw new NotFoundException('Playback session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    const updatedSession = await this.prisma.videoPlaybackSession.update({
      where: { id: sessionId },
      data: {
        lastPosition: data.lastPosition,
        totalWatchTime: data.totalWatchTime,
        completionRate: data.completionRate,
      },
    });

    // Update lesson progress
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: session.lessonId,
        },
      },
      create: {
        userId,
        lessonId: session.lessonId,
        watchTime: data.totalWatchTime,
        lastPosition: data.lastPosition,
        isCompleted: data.completionRate >= 0.9,
        completedAt: data.completionRate >= 0.9 ? new Date() : null,
      },
      update: {
        watchTime: data.totalWatchTime,
        lastPosition: data.lastPosition,
        isCompleted: data.completionRate >= 0.9,
        completedAt: data.completionRate >= 0.9 ? new Date() : null,
      },
    });

    // Update video analytics
    await this.updateVideoAnalytics(session.lessonId, data);

    return updatedSession;
  }

  /**
   * End a playback session
   */
  async endPlaybackSession(userId: string, sessionId: string) {
    const session = await this.prisma.videoPlaybackSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Playback session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only end your own sessions');
    }

    return await this.prisma.videoPlaybackSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  /**
   * Get video analytics for a lesson
   */
  async getVideoAnalytics(lessonId: string) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics) {
      // Initialize analytics if not exists
      return await this.initializeVideoAnalytics(lessonId);
    }

    return analytics;
  }

  /**
   * Get user's playback history for a lesson
   */
  async getUserPlaybackHistory(userId: string, lessonId: string) {
    await this.verifyLessonAccess(userId, lessonId);

    return await this.prisma.videoPlaybackSession.findMany({
      where: { userId, lessonId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Get video heatmap data
   */
  async getVideoHeatmap(lessonId: string) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics || !analytics.heatmapData) {
      return [];
    }

    return JSON.parse(analytics.heatmapData);
  }

  /**
   * Get drop-off points
   */
  async getDropOffPoints(lessonId: string) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics || !analytics.dropOffPoints) {
      return [];
    }

    return JSON.parse(analytics.dropOffPoints);
  }

  /**
   * Verify user has access to the lesson
   */
  private async verifyLessonAccess(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if lesson is free or user is enrolled
    const isEnrolled = lesson.module.course.enrollments.length > 0;
    const isFree = lesson.isFree;

    if (!isEnrolled && !isFree) {
      throw new ForbiddenException('You need to enroll in this course to access this lesson');
    }

    return lesson;
  }

  /**
   * Initialize video analytics for a lesson
   */
  private async initializeVideoAnalytics(lessonId: string) {
    return await this.prisma.videoAnalytics.create({
      data: {
        lessonId,
        totalViews: 0,
        totalWatchTime: 0,
        averageCompletionRate: 0,
        averageWatchTime: 0,
        dropOffPoints: JSON.stringify([]),
        heatmapData: JSON.stringify([]),
      },
    });
  }

  /**
   * Update video analytics with new playback data
   */
  private async updateVideoAnalytics(lessonId: string, playbackData: {
    lastPosition: number;
    totalWatchTime: number;
    completionRate: number;
  }) {
    const analytics = await this.prisma.videoAnalytics.upsert({
      where: { lessonId },
      create: {
        lessonId,
        totalViews: 1,
        totalWatchTime: playbackData.totalWatchTime,
        averageCompletionRate: playbackData.completionRate,
        averageWatchTime: playbackData.totalWatchTime,
        dropOffPoints: JSON.stringify([playbackData.lastPosition]),
        heatmapData: JSON.stringify([{ timestamp: playbackData.lastPosition, count: 1 }]),
      },
      update: {
        totalViews: { increment: 1 },
        totalWatchTime: { increment: playbackData.totalWatchTime },
        averageCompletionRate: playbackData.completionRate,
        averageWatchTime: playbackData.totalWatchTime,
      },
    });

    // Update drop-off points and heatmap
    await this.updateHeatmapData(lessonId, playbackData.lastPosition);
    await this.updateDropOffPoints(lessonId, playbackData.lastPosition);

    return analytics;
  }

  /**
   * Update drop-off points
   */
  private async updateDropOffPoints(lessonId: string, timestamp: number) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics) return;

    const dropOffs = JSON.parse(analytics.dropOffPoints || '[]');
    dropOffs.push(timestamp);

    await this.prisma.videoAnalytics.update({
      where: { lessonId },
      data: { dropOffPoints: JSON.stringify(dropOffs) },
    });
  }

  /**
   * Update heatmap data with new timestamp
   */
  private async updateHeatmapData(lessonId: string, timestamp: number) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics) return;

    const heatmap = JSON.parse(analytics.heatmapData || '[]');
    const existingEntry = heatmap.find((h: any) => h.timestamp === timestamp);

    if (existingEntry) {
      existingEntry.count++;
    } else {
      heatmap.push({ timestamp, count: 1 });
    }

    await this.prisma.videoAnalytics.update({
      where: { lessonId },
      data: { heatmapData: JSON.stringify(heatmap) },
    });
  }

  /**
   * Update drop-off points
   */
  private async updateDropOffPoints(lessonId: string, timestamp: number) {
    const analytics = await this.prisma.videoAnalytics.findUnique({
      where: { lessonId },
    });

    if (!analytics) return;

    const dropOffs = JSON.parse(analytics.dropOffPoints || '[]');
    dropOffs.push(timestamp);

    await this.prisma.videoAnalytics.update({
      where: { lessonId },
      data: { dropOffPoints: JSON.stringify(dropOffs) },
    });
  }
}