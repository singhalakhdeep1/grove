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
import { AdvancedGamificationService } from './advanced-gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class AdvancedGamificationController {
  constructor(
    private readonly gamificationService: AdvancedGamificationService,
  ) {}

  // ============================================
  // TEAM CHALLENGES
  // ============================================

  /**
   * Get active challenges
   */
  @Get('challenges')
  async getActiveChallenges() {
    return await this.gamificationService.getActiveChallenges();
  }

  /**
   * Create a challenge (admin only)
   */
  @Post('challenges')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createChallenge(@Body() body: {
    name: string;
    description: string;
    type: ChallengeType;
    startDate: Date;
    endDate: Date;
    targetValue: number;
    rewardXP: number;
    rewardBadge?: string;
    maxTeams?: number;
  }) {
    return await this.gamificationService.createChallenge(body);
  }

  /**
   * Create a team
   */
  @Post('challenges/:challengeId/teams')
  async createTeam(
    @Request() req,
    @Param('challengeId') challengeId: string,
    @Body() body: {
      name: string;
      description?: string;
      maxMembers: number;
    },
  ) {
    return await this.gamificationService.createTeam(
      req.user.id,
      challengeId,
      body,
    );
  }

  /**
   * Join a team
   */
  @Post('teams/:teamId/join')
  async joinTeam(@Request() req, @Param('teamId') teamId: string) {
    return await this.gamificationService.joinTeam(req.user.id, teamId);
  }

  /**
   * Get challenge leaderboard
   */
  @Get('challenges/:challengeId/leaderboard')
  async getChallengeLeaderboard(@Param('challengeId') challengeId: string) {
    return await this.gamificationService.getChallengeLeaderboard(challengeId);
  }

  // ============================================
  // SEASONAL EVENTS
  // ============================================

  /**
   * Get active seasonal events
   */
  @Get('seasonal-events')
  async getActiveSeasonalEvents() {
    return await this.gamificationService.getActiveSeasonalEvents();
  }

  /**
   * Create seasonal event (admin only)
   */
  @Post('seasonal-events')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSeasonalEvent(@Body() body: {
    name: string;
    description: string;
    theme: string;
    startDate: Date;
    endDate: Date;
    multiplier: number;
    specialRewards: string[];
  }) {
    return await this.gamificationService.createSeasonalEvent(body);
  }

  /**
   * Unlock seasonal achievement
   */
  @Post('seasonal-achievements/:achievementId/unlock')
  async unlockSeasonalAchievement(
    @Request() req,
    @Param('achievementId') achievementId: string,
  ) {
    return await this.gamificationService.unlockSeasonalAchievement(
      req.user.id,
      achievementId,
    );
  }

  /**
   * Get current XP multiplier
   */
  @Get('xp-multiplier')
  async getCurrentXPMultiplier() {
    const multiplier = await this.gamificationService.getCurrentXPMultiplier();
    return { multiplier };
  }

  // ============================================
  // VIRTUAL CURRENCY
  // ============================================

  /**
   * Get user's currency balance
   */
  @Get('currency')
  async getUserCurrency(@Request() req) {
    return await this.gamificationService.getUserCurrency(req.user.id);
  }

  /**
   * Get transaction history
   */
  @Get('currency/transactions')
  async getTransactionHistory(
    @Request() req,
    @Query('limit') limit: number = 20,
  ) {
    return await this.gamificationService.getTransactionHistory(req.user.id, limit);
  }

  /**
   * Award currency (admin only)
   */
  @Post('currency/award')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async awardCurrency(@Body() body: {
    userId: string;
    amount: number;
    description: string;
    metadata?: any;
  }) {
    return await this.gamificationService.awardCurrency(
      body.userId,
      body.amount,
      body.description,
      body.metadata,
    );
  }

  // ============================================
  // REWARD SHOP
  // ============================================

  /**
   * Get available rewards
   */
  @Get('rewards')
  async getAvailableRewards() {
    return await this.gamificationService.getAvailableRewards();
  }

  /**
   * Create reward item (admin only)
   */
  @Post('rewards')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createRewardItem(@Body() body: {
    name: string;
    description: string;
    type: RewardType;
    cost: number;
    image?: string;
    stock?: number;
    metadata?: any;
  }) {
    return await this.gamificationService.createRewardItem(body);
  }

  /**
   * Purchase a reward
   */
  @Post('rewards/:rewardId/purchase')
  async purchaseReward(
    @Request() req,
    @Param('rewardId') rewardId: string,
  ) {
    return await this.gamificationService.purchaseReward(req.user.id, rewardId);
  }

  /**
   * Get user's purchase history
   */
  @Get('rewards/purchases')
  async getUserPurchases(@Request() req) {
    return await this.gamificationService.getUserPurchases(req.user.id);
  }

  // ============================================
  // SUMMARY
  // ============================================

  /**
   * Get user's gamification summary
   */
  @Get('summary')
  async getUserGamificationSummary(@Request() req) {
    return await this.gamificationService.getUserGamificationSummary(req.user.id);
  }
}