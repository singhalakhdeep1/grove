import { Module } from '@nestjs/common';
import { AdvancedGamificationService } from './advanced-gamification.service';
import { AdvancedGamificationController } from './advanced-gamification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AdvancedGamificationController],
  providers: [AdvancedGamificationService],
  exports: [AdvancedGamificationService],
})
export class AdvancedGamificationModule {}