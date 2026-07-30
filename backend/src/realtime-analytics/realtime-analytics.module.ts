import { Module } from '@nestjs/common';
import { RealtimeAnalyticsService } from './realtime-analytics.service';
import { RealtimeAnalyticsController } from './realtime-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [RealtimeAnalyticsController],
  providers: [RealtimeAnalyticsService],
  exports: [RealtimeAnalyticsService],
})
export class RealtimeAnalyticsModule {}