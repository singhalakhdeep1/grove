import {
    Controller,
    Get,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('user')
    @UseGuards(JwtAuthGuard)
    getUserAnalytics(@Req() req: any) {
        return this.service.getUserAnalytics(req.user.id);
    }

    @Get('course/:id')
    @UseGuards(JwtAuthGuard)
    getCourseAnalytics(@Param('id') id: string) {
        return this.service.getCourseAnalytics(id);
    }

    @Get('progress')
    @UseGuards(JwtAuthGuard)
    getLearningProgress(@Req() req: any) {
        return this.service.getLearningProgress(req.user.id);
    }
}
