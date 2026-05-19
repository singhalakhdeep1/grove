import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gamification')
export class GamificationController {
    constructor(private readonly service: GamificationService) { }

    @Get('progress')
    @UseGuards(JwtAuthGuard)
    getUserProgress(@Req() req: any) {
        return this.service.getUserProgress(req.user.id);
    }

    @Get('achievements')
    @UseGuards(JwtAuthGuard)
    getAchievements(@Req() req: any) {
        return this.service.getAchievements(req.user.id);
    }

    @Get('badges')
    @UseGuards(JwtAuthGuard)
    getBadges(@Req() req: any) {
        return this.service.getBadges(req.user.id);
    }

    @Get('leaderboard')
    getLeaderboard(@Query('timeframe') timeframe: 'daily' | 'weekly' | 'allTime') {
        return this.service.getLeaderboard(timeframe);
    }

    @Post('award-xp')
    @UseGuards(JwtAuthGuard)
    awardXP(
        @Req() req: any,
        @Body() body: { points: number; reason: string },
    ) {
        return this.service.awardXP(req.user.id, body.points, body.reason);
    }
}
