import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getUserProgress(userId: string) {
    const [xp, achievements, badges, rank] = await Promise.all([
      this.prisma.xP.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      this.prisma.userAchievement.count({
        where: { userId },
      }),
      this.prisma.userBadge.count({
        where: { userId },
      }),
      this.getUserRank(userId),
    ]);

    return {
      totalXP: xp._sum.points || 0,
      level: this.calculateLevel(xp._sum.points || 0),
      achievements: achievements,
      badges: badges,
      rank: rank,
    };
  }

  async awardXP(userId: string, points: number, reason: string) {
    await this.prisma.xP.create({
      data: { userId, points, source: reason },
    });

    await this.checkAchievements(userId);
    return { message: `Awarded ${points} XP` };
  }

  async getAchievements(userId: string) {
    const [earned, available] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.achievement.findMany({
        where: {
          NOT: {
            users: { some: { userId } },
          },
        },
      }),
    ]);

    return { earned, available };
  }

  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime' = 'allTime') {
    const startDate = this.getLeaderboardStartDate(timeframe);

    const topUsers = await this.prisma.xP.groupBy({
      by: ['userId'],
      where: startDate ? { createdAt: { gte: startDate } } : {},
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: 100,
    });

    const usersWithDetails = await Promise.all(
      topUsers.map(async (entry, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: entry.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        });

        return {
          rank: index + 1,
          user,
          points: entry._sum.points,
        };
      }),
    );

    return usersWithDetails;
  }

  async getBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private async getUserRank(userId: string): Promise<number> {
    const userXP = await this.prisma.xP.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const higherRanked = await this.prisma.xP.groupBy({
      by: ['userId'],
      _sum: { points: true },
      having: {
        points: { _sum: { gt: userXP._sum.points || 0 } },
      },
    });

    return higherRanked.length + 1;
  }

  private async checkAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany();

    for (const achievement of achievements) {
      const earned = await this.prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
      });

      if (!earned && (await this.isAchievementEarned(userId, achievement))) {
        await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });
      }
    }
  }

  private async isAchievementEarned(userId: string, achievement: any): Promise<boolean> {
    // Implementation logic for checking achievement conditions
    return false; // Placeholder
  }

  private getLeaderboardStartDate(timeframe: string): Date | null {
    const now = new Date();
    switch (timeframe) {
      case 'daily':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'weekly':
        const dayOfWeek = now.getDay();
        return new Date(now.setDate(now.getDate() - dayOfWeek));
      default:
        return null;
    }
  }
}
