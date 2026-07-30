import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventType } from '@prisma/client';

interface RealTimeMetric {
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class RealtimeAnalyticsService {
  private readonly logger = new Logger(RealtimeAnalyticsService.name);
  private readonly METRIC_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Track an analytics event
   */
  async trackEvent(
    userId: string | null,
    eventType: EventType,
    eventData: any,
    sessionId?: string,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventData: JSON.stringify(eventData),
        sessionId,
      },
    });

    // Update real-time counters
    await this.updateRealTimeCounters(eventType, eventData);

    // Publish to WebSocket for real-time updates
    await this.publishEventUpdate(eventType, eventData);
  }

  /**
   * Update real-time counters in Redis
   */
  private async updateRealTimeCounters(eventType: EventType, eventData: any) {
    const timestamp = new Date();
    const minuteKey = `${eventType}:${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;

    // Increment counter
    await this.redis.incr(minuteKey);
    await this.redis.expire(minuteKey, this.METRIC_TTL);

    // Store in aggregated metrics
    const metricKey = `metric:${eventType}`;
    await this.redis.incr(metricKey);
    await this.redis.expire(metricKey, this.METRIC_TTL);
  }

  /**
   * Publish event updates to WebSocket
   */
  private async publishEventUpdate(eventType: EventType, eventData: any) {
    const channel = 'analytics:events';
    const message = JSON.stringify({
      type: eventType,
      data: eventData,
      timestamp: new Date(),
    });

    await this.redis.publish(channel, message);
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    const metrics = [
      'active_users',
      'enrollments',
      'course_completions',
      'quiz_attempts',
      'forum_posts',
      'live_sessions',
    ];

    const results = await Promise.all(
      metrics.map(async (metric) => {
        const value = await this.redis.get(`metric:${metric}`);
        return {
          metric,
          value: parseInt(value || '0', 10),
          timestamp: new Date(),
        };
      }),
    );

    return results;
  }

  /**
   * Get active users count (last 5 minutes)
   */
  async getActiveUsers(): Promise<number> {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const activeUsers = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: fiveMinutesAgo },
        userId: { not: null },
      },
    });

    return activeUsers.length;
  }

  /**
   * Get enrollment trends (last 24 hours)
   */
  async getEnrollmentTrends() {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const enrollments = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: EventType.ENROLLMENT,
        timestamp: { gte: twentyFourHoursAgo },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by hour
    const hourlyData = new Map<number, number>();
    enrollments.forEach((event) => {
      const hour = event.timestamp.getHours();
      hourlyData.set(hour, (hourlyData.get(hour) || 0) + 1);
    });

    return Array.from(hourlyData.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));
  }

  /**
   * Get course performance metrics
   */
  async getCoursePerformance(courseId?: string) {
    const where = courseId ? { id: courseId } : {};

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
        category: true,
      },
    });

    // Get completion data separately
    const courseIds = courses.map(c => c.id);
    const completions = await this.prisma.courseProgress.findMany({
      where: {
        courseId: { in: courseIds },
        completedAt: { not: null },
      },
    });

    const completionMap = new Map<string, number>();
    completions.forEach(c => {
      completionMap.set(c.courseId, (completionMap.get(c.courseId) || 0) + 1);
    });

    // Get review data
    const reviews = await this.prisma.courseReview.findMany({
      where: { courseId: { in: courseIds } },
    });

    const reviewMap = new Map<string, { total: number; sum: number }>();
    reviews.forEach(r => {
      const current = reviewMap.get(r.courseId) || { total: 0, sum: 0 };
      reviewMap.set(r.courseId, {
        total: current.total + 1,
        sum: current.sum + r.rating,
      });
    });

    return courses.map((course) => {
      const totalEnrollments = course._count.enrollments;
      const completedCount = completionMap.get(course.id) || 0;
      const reviewData = reviewMap.get(course.id);
      const avgRating = reviewData ? reviewData.sum / reviewData.total : 0;

      return {
        courseId: course.id,
        title: course.title,
        totalEnrollments,
        completions: completedCount,
        completionRate: totalEnrollments > 0 ? completedCount / totalEnrollments : 0,
        avgRating,
        category: course.category?.name,
      };
    });
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId?: string) {
    const where = userId ? { userId } : {};

    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        ...where,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: {
        eventType: true,
      },
    });

    return events.map((event) => ({
      eventType: event.eventType,
      count: event._count.eventType,
    }));
  }

  /**
   * Get learning progress analytics
   */
  async getLearningProgress(userId?: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: userId ? { userId } : {},
      include: {
        course: {
          select: {
            title: true,
            category: {
              select: { name: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
      take: 50,
    });

    return enrollments.map((e) => ({
      courseId: e.courseId,
      courseTitle: e.course.title,
      category: e.course.category?.name,
      userName: e.user.name,
      progress: e.progress || 0,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
    }));
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Course views
    const courseViews = await this.prisma.analyticsEvent.count({
      where: {
        eventType: EventType.COURSE_VIEW,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Enrollments
    const enrollments = await this.prisma.analyticsEvent.count({
      where: {
        eventType: EventType.ENROLLMENT,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Lesson starts
    const lessonStarts = await this.prisma.analyticsEvent.count({
      where: {
        eventType: EventType.LESSON_START,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Completions
    const completions = await this.prisma.analyticsEvent.count({
      where: {
        eventType: EventType.COURSE_COMPLETION,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    return {
      courseViews,
      enrollments,
      lessonStarts,
      completions,
      viewToEnrollmentRate: courseViews > 0 ? enrollments / courseViews : 0,
      enrollmentToCompletionRate: enrollments > 0 ? completions / enrollments : 0,
    };
  }

  /**
   * Scheduled job to aggregate and persist real-time metrics
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async aggregateRealTimeMetrics() {
    this.logger.log('Aggregating real-time metrics...');

    const metrics = await this.getRealTimeMetrics();

    await this.prisma.realTimeAnalytics.createMany({
      data: metrics.map((metric) => ({
        metric: metric.metric,
        value: metric.value,
        timestamp: metric.timestamp,
        metadata: metric.metadata ? JSON.stringify(metric.metadata) : null,
      })),
      skipDuplicates: true,
    });

    this.logger.log(`Aggregated ${metrics.length} metrics`);
  }

  /**
   * Scheduled job to clean up old analytics events
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldEvents() {
    this.logger.log('Cleaning up old analytics events...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await this.prisma.analyticsEvent.deleteMany({
      where: {
        timestamp: { lt: ninetyDaysAgo },
      },
    });

    this.logger.log(`Deleted ${deleted.count} old analytics events`);
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary() {
    const [
      activeUsers,
      realTimeMetrics,
      enrollmentTrends,
      coursePerformance,
      funnelAnalytics,
    ] = await Promise.all([
      this.getActiveUsers(),
      this.getRealTimeMetrics(),
      this.getEnrollmentTrends(),
      this.getCoursePerformance(),
      this.getFunnelAnalytics(),
    ]);

    return {
      activeUsers,
      realTimeMetrics,
      enrollmentTrends,
      coursePerformance: coursePerformance.slice(0, 10), // Top 10
      funnelAnalytics,
      timestamp: new Date(),
    };
  }
}