import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InteractionAction } from '@prisma/client';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get personalized recommendations for the current user
   */
  @Get()
  async getRecommendations(
    @Request() req,
    @Query('limit') limit: number = 10,
  ) {
    const recommendations = await this.recommendationsService.getRecommendations(
      req.user.id,
      limit,
    );

    // Get full course details
    const courseIds = recommendations.map((r) => r.courseId);
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
    });

    // Combine with recommendation scores
    const coursesWithScores = courses.map((course) => {
      const recommendation = recommendations.find((r) => r.courseId === course.id);
      return {
        ...course,
        recommendationScore: recommendation?.score || 0,
        recommendationReason: recommendation?.reason,
        algorithm: recommendation?.algorithm,
      };
    });

    // Sort by recommendation score
    coursesWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      data: coursesWithScores,
      meta: {
        total: coursesWithScores.length,
        algorithms: [...new Set(recommendations.map((r) => r.algorithm))],
      },
    };
  }

  /**
   * Track recommendation click
   */
  @Post(':courseId/click')
  async trackClick(@Request() req, @Param('courseId') courseId: string) {
    await this.recommendationsService.trackInteraction(req.user.id, courseId, 'click');
    return { success: true };
  }

  /**
   * Track recommendation enrollment
   */
  @Post(':courseId/enroll')
  async trackEnroll(@Request() req, @Param('courseId') courseId: string) {
    await this.recommendationsService.trackInteraction(req.user.id, courseId, 'enroll');
    return { success: true };
  }

  /**
   * Track course interaction for learning
   */
  @Post('track-interaction')
  async trackInteraction(@Request() req, @Body() body: {
    courseId: string;
    action: InteractionAction;
    duration?: number;
    rating?: number;
  }) {
    await this.recommendationsService.trackCourseInteraction(
      req.user.id,
      body.courseId,
      body.action,
      { duration: body.duration, rating: body.rating },
    );
    return { success: true };
  }

  /**
   * Get recommendation analytics
   */
  @Get('analytics')
  async getAnalytics(@Request() req) {
    return await this.recommendationsService.getRecommendationAnalytics(req.user.id);
  }
}