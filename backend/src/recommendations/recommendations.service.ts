import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  RecommendationAlgorithm,
  RecommendationReason,
  InteractionAction,
} from '@prisma/client';

interface RecommendationScore {
  courseId: string;
  score: number;
  reason: RecommendationReason;
  algorithm: RecommendationAlgorithm;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(userId: string, limit: number = 10) {
    const cacheKey = `recommendations:${userId}`;

    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Generate recommendations using hybrid approach
    const recommendations = await this.generateHybridRecommendations(userId, limit);

    // Cache the results
    await this.redis.set(cacheKey, JSON.stringify(recommendations), this.CACHE_TTL);

    return recommendations;
  }

  /**
   * Generate hybrid recommendations combining multiple algorithms
   */
  private async generateHybridRecommendations(
    userId: string,
    limit: number,
  ): Promise<RecommendationScore[]> {
    const scores = new Map<string, RecommendationScore>();

    // Get user's enrolled courses to exclude them
    const enrolledCourses = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledIds = new Set(enrolledCourses.map((e) => e.courseId));

    // 1. Collaborative Filtering (40% weight)
    const collaborativeScores = await this.collaborativeFiltering(userId);
    collaborativeScores.forEach((score) => {
      if (!enrolledIds.has(score.courseId)) {
        this.mergeScore(scores, score, 0.4);
      }
    });

    // 2. Content-Based Filtering (30% weight)
    const contentScores = await this.contentBasedFiltering(userId);
    contentScores.forEach((score) => {
      if (!enrolledIds.has(score.courseId)) {
        this.mergeScore(scores, score, 0.3);
      }
    });

    // 3. Popular Courses (20% weight)
    const popularScores = await this.popularityBasedRecommendations();
    popularScores.forEach((score) => {
      if (!enrolledIds.has(score.courseId)) {
        this.mergeScore(scores, score, 0.2);
      }
    });

    // 4. Trending Courses (10% weight)
    const trendingScores = await this.trendingRecommendations();
    trendingScores.forEach((score) => {
      if (!enrolledIds.has(score.courseId)) {
        this.mergeScore(scores, score, 0.1);
      }
    });

    // Convert to array and sort by score
    const sorted = Array.from(scores.values()).sort((a, b) => b.score - a.score);

    // Take top N and save to database
    const topRecommendations = sorted.slice(0, limit);
    await this.saveRecommendations(userId, topRecommendations);

    return topRecommendations;
  }

  /**
   * Collaborative Filtering: Find courses liked by similar users
   */
  private async collaborativeFiltering(
    userId: string,
  ): Promise<RecommendationScore[]> {
    // Find users with similar interaction patterns
    const userInteractions = await this.prisma.userCourseInteraction.findMany({
      where: { userId },
      select: { courseId: true, action: true, rating: true },
    });

    if (userInteractions.length === 0) {
      return [];
    }

    const userCourseIds = new Set(userInteractions.map((i) => i.courseId));

    // Find other users who interacted with same courses
    const similarUsers = await this.prisma.userCourseInteraction
      .groupBy({
        by: ['userId'],
        where: {
          courseId: { in: Array.from(userCourseIds) },
          userId: { not: userId },
        },
        _count: { courseId: true },
        having: { courseId: { _count: { gt: 2 } } }, // At least 3 common courses
        orderBy: { _count: { courseId: 'desc' } },
        take: 20,
      })
      .then((results) => results.map((r) => r.userId));

    if (similarUsers.length === 0) {
      return [];
    }

    // Get courses liked by similar users
    const recommendedCourses = await this.prisma.userCourseInteraction.findMany({
      where: {
        userId: { in: similarUsers },
        action: { in: [InteractionAction.RATED, InteractionAction.COURSE_COMPLETED] },
        courseId: { notIn: Array.from(userCourseIds) },
      },
      include: { course: true },
    });

    // Calculate scores based on ratings and completion
    const courseScores = new Map<string, number>();
    recommendedCourses.forEach((interaction) => {
      const courseId = interaction.courseId;
      const currentScore = courseScores.get(courseId) || 0;
      const weight = interaction.action === InteractionAction.COURSE_COMPLETED ? 2 : 1;
      const ratingWeight = interaction.rating || 3;
      courseScores.set(courseId, currentScore + weight * ratingWeight);
    });

    // Convert to recommendation scores
    return Array.from(courseScores.entries()).map(([courseId, score]) => ({
      courseId,
      score: Math.min(score / 10, 1), // Normalize to 0-1
      reason: RecommendationReason.SIMILAR_USERS,
      algorithm: RecommendationAlgorithm.COLLABORATIVE_FILTERING,
    }));
  }

  /**
   * Content-Based Filtering: Recommend similar courses to user's interests
   */
  private async contentBasedFiltering(
    userId: string,
  ): Promise<RecommendationScore[]> {
    // Get user's enrolled courses with their categories and tags
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return [];
    }

    // Extract user's preferences
    const preferredCategories = new Map<string, number>();
    const preferredTags = new Map<string, number>();
    const preferredLevels = new Map<string, number>();

    enrollments.forEach((enrollment) => {
      const course = enrollment.course;

      // Category preference
      if (course.category) {
        preferredCategories.set(
          course.category.id,
          (preferredCategories.get(course.category.id) || 0) + 1,
        );
      }

      // Tag preference
      course.tags.forEach((courseTag) => {
        preferredTags.set(
          courseTag.tag.id,
          (preferredTags.get(courseTag.tag.id) || 0) + 1,
        );
      });

      // Level preference
      preferredLevels.set(
        course.level,
        (preferredLevels.get(course.level) || 0) + 1,
      );
    });

    // Find similar courses
    const similarCourses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        id: { notIn: enrollments.map((e) => e.courseId) },
        OR: [
          { categoryId: { in: Array.from(preferredCategories.keys()) } },
          {
            tags: {
              some: { tagId: { in: Array.from(preferredTags.keys()) } },
            },
          },
          { level: { in: Array.from(preferredLevels.keys()) } },
        ],
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      take: 50,
    });

    // Calculate similarity scores
    return similarCourses.map((course) => {
      let score = 0;

      // Category match
      if (course.category && preferredCategories.has(course.category.id)) {
        score += 0.4 * preferredCategories.get(course.category.id)!;
      }

      // Tag matches
      course.tags.forEach((courseTag) => {
        if (preferredTags.has(courseTag.tag.id)) {
          score += 0.3 * preferredTags.get(courseTag.tag.id)!;
        }
      });

      // Level match
      if (preferredLevels.has(course.level)) {
        score += 0.3 * preferredLevels.get(course.level)!;
      }

      return {
        courseId: course.id,
        score: Math.min(score / enrollments.length, 1), // Normalize
        reason: RecommendationReason.CONTENT_BASED,
        algorithm: RecommendationAlgorithm.CONTENT_BASED,
      };
    });
  }

  /**
   * Popularity-Based: Recommend highly-rated and enrolled courses
   */
  private async popularityBasedRecommendations(): Promise<RecommendationScore[]> {
    const popularCourses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        _count: {
          select: { enrollments: true, reviews: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 20,
    });

    return popularCourses.map((course) => {
      const enrollmentScore = Math.min(course._count.enrollments / 1000, 1);
      const avgRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
          : 0;
      const ratingScore = avgRating / 5;

      return {
        courseId: course.id,
        score: (enrollmentScore * 0.7 + ratingScore * 0.3),
        reason: RecommendationReason.POPULAR,
        algorithm: RecommendationAlgorithm.POPULARITY_BASED,
      };
    });
  }

  /**
   * Trending: Recommend courses with recent activity
   */
  private async trendingRecommendations(): Promise<RecommendationScore[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingCourses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        enrollments: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { createdAt: { gte: thirtyDaysAgo } },
            },
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 15,
    });

    const maxEnrollments = Math.max(
      ...trendingCourses.map((c) => c._count.enrollments),
      1,
    );

    return trendingCourses.map((course) => ({
      courseId: course.id,
      score: course._count.enrollments / maxEnrollments,
      reason: RecommendationReason.TRENDING,
      algorithm: RecommendationAlgorithm.TRENDING,
    }));
  }

  /**
   * Merge scores from different algorithms
   */
  private mergeScore(
    scores: Map<string, RecommendationScore>,
    newScore: RecommendationScore,
    weight: number,
  ) {
    const existing = scores.get(newScore.courseId);
    if (existing) {
      existing.score += newScore.score * weight;
    } else {
      scores.set(newScore.courseId, {
        ...newScore,
        score: newScore.score * weight,
      });
    }
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(
    userId: string,
    recommendations: RecommendationScore[],
  ) {
    // Delete old recommendations
    await this.prisma.courseRecommendation.deleteMany({
      where: { userId },
    });

    // Insert new recommendations
    await this.prisma.courseRecommendation.createMany({
      data: recommendations.map((rec) => ({
        userId,
        courseId: rec.courseId,
        score: rec.score,
        reason: rec.reason,
        algorithm: rec.algorithm,
      })),
    });
  }

  /**
   * Track user interaction with recommendations
   */
  async trackInteraction(
    userId: string,
    courseId: string,
    action: 'click' | 'enroll',
  ) {
    if (action === 'click') {
      await this.prisma.courseRecommendation.updateMany({
        where: { userId, courseId },
        data: { clicked: true },
      });
    } else if (action === 'enroll') {
      await this.prisma.courseRecommendation.updateMany({
        where: { userId, courseId },
        data: { enrolled: true },
      });
    }

    // Invalidate cache
    await this.redis.del(`recommendations:${userId}`);
  }

  /**
   * Track user course interaction for learning
   */
  async trackCourseInteraction(
    userId: string,
    courseId: string,
    action: InteractionAction,
    metadata?: { duration?: number; rating?: number },
  ) {
    await this.prisma.userCourseInteraction.create({
      data: {
        userId,
        courseId,
        action,
        duration: metadata?.duration,
        rating: metadata?.rating,
        completed: action === InteractionAction.COURSE_COMPLETED,
      },
    });

    // Invalidate recommendations cache as interactions changed
    await this.redis.del(`recommendations:${userId}`);
  }

  /**
   * Get recommendation analytics
   */
  async getRecommendationAnalytics(userId: string) {
    const recommendations = await this.prisma.courseRecommendation.findMany({
      where: { userId },
      include: { course: true },
    });

    const total = recommendations.length;
    const clicked = recommendations.filter((r) => r.clicked).length;
    const enrolled = recommendations.filter((r) => r.enrolled).length;

    return {
      total,
      clicked,
      enrolled,
      clickRate: total > 0 ? clicked / total : 0,
      conversionRate: total > 0 ? enrolled / total : 0,
      byAlgorithm: this.groupByAlgorithm(recommendations),
      byReason: this.groupByReason(recommendations),
    };
  }

  private groupByAlgorithm(recommendations: any[]) {
    const grouped = {};
    recommendations.forEach((r) => {
      grouped[r.algorithm] = (grouped[r.algorithm] || 0) + 1;
    });
    return grouped;
  }

  private groupByReason(recommendations: any[]) {
    const grouped = {};
    recommendations.forEach((r) => {
      grouped[r.reason] = (grouped[r.reason] || 0) + 1;
    });
    return grouped;
  }
}