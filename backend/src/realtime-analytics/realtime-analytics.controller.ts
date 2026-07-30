import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RealtimeAnalyticsService } from './realtime-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventType, UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class RealtimeAnalyticsController {
  constructor(
    private readonly realtimeAnalyticsService: RealtimeAnalyticsService,
  ) {}

  /**
   * Track an analytics event
   */
  @Post('track')
  async trackEvent(
    @Request() req,
    @Body() body: {
      eventType: EventType;
      eventData: any;
      sessionId?: string;
    },
  ) {
    await this.realtimeAnalyticsService.trackEvent(
      req.user?.id || null,
      body.eventType,
      body.eventData,
      body.sessionId,
    );
    return { success: true };
  }

  /**
   * Get real-time metrics
   */
  @Get('realtime')
  async getRealTimeMetrics() {
    return await this.realtimeAnalyticsService.getRealTimeMetrics();
  }

  /**
   * Get active users count
   */
  @Get('active-users')
  async getActiveUsers() {
    const count = await this.realtimeAnalyticsService.getActiveUsers();
    return { count };
  }

  /**
   * Get enrollment trends
   */
  @Get('enrollment-trends')
  async getEnrollmentTrends() {
    return await this.realtimeAnalyticsService.getEnrollmentTrends();
  }

  /**
   * Get course performance metrics
   */
  @Get('course-performance')
  async getCoursePerformance(@Query('courseId') courseId?: string) {
    return await this.realtimeAnalyticsService.getCoursePerformance(courseId);
  }

  /**
   * Get user engagement metrics
   */
  @Get('user-engagement')
  async getUserEngagement(@Query('userId') userId?: string) {
    return await this.realtimeAnalyticsService.getUserEngagement(userId);
  }

  /**
   * Get learning progress analytics
   */
  @Get('learning-progress')
  async getLearningProgress(@Query('userId') userId?: string) {
    return await this.realtimeAnalyticsService.getLearningProgress(userId);
  }

  /**
   * Get funnel analytics
   */
  @Get('funnel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async getFunnelAnalytics() {
    return await this.realtimeAnalyticsService.getFunnelAnalytics();
  }

  /**
   * Get dashboard summary (admin only)
   */
  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDashboardSummary() {
    return await this.realtimeAnalyticsService.getDashboardSummary();
  }
}