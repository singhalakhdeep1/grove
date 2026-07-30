import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { 
  ChallengeType, 
  TeamRole, 
  TransactionType, 
  RewardType, 
  PurchaseStatus 
} from '@prisma/client';

@Injectable()
export class AdvancedGamificationService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ============================================
  // TEAM CHALLENGES
  // ============================================

  /**
   * Create a new team challenge
   */
  async createChallenge(data: {
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
    return await this.prisma.teamChallenge.create({
      data,
    });
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges() {
    const now = new Date();
    return await this.prisma.teamChallenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        teams: {
          include: {
            _count: {
              select: { members: true },
            },
          },
          orderBy: { currentXP: 'desc' },
        },
        _count: {
          select: { teams: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Create a team for a challenge
   */
  async createTeam(userId: string, challengeId: string, data: {
    name: string;
    description?: string;
    maxMembers: number;
  }) {
    const challenge = await this.prisma.teamChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (!challenge.isActive) {
      throw new BadRequestException('Challenge is not active');
    }

    if (challenge.maxTeams && challenge.teams.length >= challenge.maxTeams) {
      throw new BadRequestException('Challenge has reached maximum teams');
    }

    const team = await this.prisma.challengeTeam.create({
      data: {
        challengeId,
        name: data.name,
        description: data.description,
        maxMembers: data.maxMembers,
      },
    });

    // Add creator as captain
    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: TeamRole.CAPTAIN,
      },
    });

    return team;
  }

  /**
   * Join a team
   */
  async joinTeam(userId: string, teamId: string) {
    const team = await this.prisma.challengeTeam.findUnique({
      where: { id: teamId },
      include: { challenge: true, members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (!team.challenge.isActive) {
      throw new BadRequestException('Challenge is not active');
    }

    if (team.members.length >= team.maxMembers) {
      throw new BadRequestException('Team is full');
    }

    // Check if user is already in a team for this challenge
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { challengeId: team.challengeId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already in a team for this challenge');
    }

    return await this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: TeamRole.MEMBER,
      },
    });
  }

  /**
   * Update team progress
   */
  async updateTeamProgress(teamId: string, metric: string, value: number) {
    const progress = await this.prisma.challengeProgress.upsert({
      where: {
        challengeId_teamId_metric: {
          challengeId: (await this.prisma.challengeTeam.findUnique({
            where: { id: teamId },
            select: { challengeId: true },
          }))!.challengeId,
          teamId,
          metric,
        },
      },
      create: {
        teamId,
        challengeId: (await this.prisma.challengeTeam.findUnique({
          where: { id: teamId },
          select: { challengeId: true },
        }))!.challengeId,
        metric,
        value,
      },
      update: { value },
    });

    // Update team XP
    await this.prisma.challengeTeam.update({
      where: { id: teamId },
      data: { currentXP: { increment: value } },
    });

    return progress;
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string) {
    const teams = await this.prisma.challengeTeam.findMany({
      where: { challengeId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        progress: true,
      },
      orderBy: { currentXP: 'desc' },
    });

    // Assign ranks
    return teams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  }

  // ============================================
  // SEASONAL EVENTS
  // ============================================

  /**
   * Create a seasonal event
   */
  async createSeasonalEvent(data: {
    name: string;
    description: string;
    theme: string;
    startDate: Date;
    endDate: Date;
    multiplier: number;
    specialRewards: string[];
  }) {
    return await this.prisma.seasonalEvent.create({
      data,
    });
  }

  /**
   * Get active seasonal events
   */
  async getActiveSeasonalEvents() {
    const now = new Date();
    return await this.prisma.seasonalEvent.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        achievements: true,
      },
    });
  }

  /**
   * Get current XP multiplier
   */
  async getCurrentXPMultiplier(): Promise<number> {
    const cacheKey = 'xp_multiplier';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return parseFloat(cached);
    }

    const now = new Date();
    const activeEvent = await this.prisma.seasonalEvent.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { multiplier: 'desc' },
    });

    const multiplier = activeEvent?.multiplier || 1.0;
    await this.redis.set(cacheKey, multiplier.toString(), this.CACHE_TTL);
    
    return multiplier;
  }

  /**
   * Unlock seasonal achievement
   */
  async unlockSeasonalAchievement(userId: string, achievementId: string) {
    const achievement = await this.prisma.seasonalAchievement.findUnique({
      where: { id: achievementId },
      include: { event: true },
    });

    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    if (!achievement.event.isActive) {
      throw new BadRequestException('Event is not active');
    }

    // Check if already unlocked
    const existing = await this.prisma.userSeasonalAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId },
      },
    });

    if (existing) {
      throw new BadRequestException('Achievement already unlocked');
    }

    // Award XP with multiplier
    const multiplier = await this.getCurrentXPMultiplier();
    const awardXP = Math.floor(achievement.rewardXP * multiplier);

    // Create unlock record
    const unlock = await this.prisma.userSeasonalAchievement.create({
      data: { userId, achievementId },
    });

    // Award XP
    await this.awardXP(userId, awardXP, `Seasonal achievement: ${achievement.name}`);

    return { ...unlock, awardedXP: awardXP, multiplier };
  }

  // ============================================
  // VIRTUAL CURRENCY
  // ============================================

  /**
   * Get or create user's virtual currency wallet
   */
  async getUserCurrency(userId: string) {
    return await this.prisma.virtualCurrency.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  /**
   * Award virtual currency
   */
  async awardCurrency(userId: string, amount: number, description: string, metadata?: any) {
    const currency = await this.getUserCurrency(userId);

    await this.prisma.virtualCurrency.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        earnedTotal: { increment: amount },
      },
    });

    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        type: TransactionType.EARNED,
        amount,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return currency;
  }

  /**
   * Deduct virtual currency
   */
  async deductCurrency(userId: string, amount: number, description: string, metadata?: any) {
    const currency = await this.getUserCurrency(userId);

    if (currency.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.prisma.virtualCurrency.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        spentTotal: { increment: amount },
      },
    });

    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        type: TransactionType.SPENT,
        amount: -amount,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return currency;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20) {
    return await this.prisma.currencyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ============================================
  // REWARD SHOP
  // ============================================

  /**
   * Create a reward shop item
   */
  async createRewardItem(data: {
    name: string;
    description: string;
    type: RewardType;
    cost: number;
    image?: string;
    stock?: number;
    metadata?: any;
  }) {
    return await this.prisma.rewardShop.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards() {
    return await this.prisma.rewardShop.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });
  }

  /**
   * Purchase a reward
   */
  async purchaseReward(userId: string, rewardId: string) {
    const reward = await this.prisma.rewardShop.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (!reward.isActive) {
      throw new BadRequestException('Reward is not available');
    }

    if (reward.stock !== null && reward.stock <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    // Check user's balance
    const currency = await this.getUserCurrency(userId);
    if (currency.balance < reward.cost) {
      throw new BadRequestException('Insufficient balance');
    }

    // Deduct currency
    await this.deductCurrency(userId, reward.cost, `Purchased reward: ${reward.name}`);

    // Create purchase record
    const purchase = await this.prisma.rewardPurchase.create({
      data: {
        userId,
        rewardId,
        cost: reward.cost,
        status: PurchaseStatus.COMPLETED,
      },
    });

    // Update stock if limited
    if (reward.stock !== null) {
      await this.prisma.rewardShop.update({
        where: { id: rewardId },
        data: { stock: { decrement: 1 } },
      });
    }

    return purchase;
  }

  /**
   * Get user's purchase history
   */
  async getUserPurchases(userId: string) {
    return await this.prisma.rewardPurchase.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  // ============================================
  // XP AWARDING
  // ============================================

  /**
   * Award XP to user with seasonal multiplier
   */
  async awardXP(userId: string, baseXP: number, reason: string) {
    const multiplier = await this.getCurrentXPMultiplier();
    const finalXP = Math.floor(baseXP * multiplier);

    // Update user profile
    await this.prisma.userProfile.update({
      where: { userId },
      data: { totalPoints: { increment: finalXP } },
    });

    // Award virtual currency (10% of XP)
    const currencyAward = Math.floor(finalXP * 0.1);
    if (currencyAward > 0) {
      await this.awardCurrency(userId, currencyAward, `XP bonus: ${reason}`);
    }

    return { awardedXP: finalXP, multiplier };
  }

  /**
   * Get user's gamification summary
   */
  async getUserGamificationSummary(userId: string) {
    const [
      profile,
      currency,
      achievements,
      badges,
      activeChallenges,
      seasonalEvents,
    ] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.getUserCurrency(userId),
      this.prisma.userAchievement.count({ where: { userId } }),
      this.prisma.userBadge.count({ where: { userId } }),
      this.prisma.teamMember.findMany({
        where: { userId },
        include: { team: { include: { challenge: true } } },
      }),
      this.prisma.userSeasonalAchievement.findMany({
        where: { userId },
        include: { achievement: { include: { event: true } } },
      }),
    ]);

    return {
      totalPoints: profile?.totalPoints || 0,
      currentStreak: profile?.currentStreak || 0,
      longestStreak: profile?.longestStreak || 0,
      currencyBalance: currency.balance,
      achievementsUnlocked: achievements,
      badgesCollected: badges,
      activeChallenges: activeChallenges.length,
      seasonalAchievements: seasonalEvents.length,
      currentXPMultiplier: await this.getCurrentXPMultiplier(),
    };
  }
}