import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';

// Learning Modules
import { CoursesModule } from './courses/courses.module';
import { LiveSessionsModule } from './live-sessions/live-sessions.module';
import { CertificationModule } from './certification/certification.module';

// Community Modules
import { ForumsModule } from './forums/forums.module';
import { MessagingModule } from './messaging/messaging.module';
import { StudyGroupsModule } from './study-groups/study-groups.module';
import { MentorshipModule } from './mentorship/mentorship.module';

// Gamification & Analytics
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';

// AI Recommendations
import { RecommendationsModule } from './recommendations/recommendations.module';

// Real-time Analytics
import { RealtimeAnalyticsModule } from './realtime-analytics/realtime-analytics.module';

// Interactive Video
import { VideoModule } from './video/video.module';

// Advanced Gamification
import { AdvancedGamificationModule } from './advanced-gamification/advanced-gamification.module';

// Two-Factor Authentication
import { TwoFactorModule } from './two-factor/two-factor.module';

// Subscriptions & Payments
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60,
        limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      },
    ]),

    // Bull Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Core
    PrismaModule,
    RedisModule,
    AuthModule,
    EmailModule,

    // Learning
    CoursesModule,
    LiveSessionsModule,
    CertificationModule,

    // Community
    ForumsModule,
    MessagingModule,
    StudyGroupsModule,
    MentorshipModule,

    // Gamification & Analytics
    GamificationModule,
    AnalyticsModule,

    // AI Recommendations
    RecommendationsModule,

    // Real-time Analytics
    RealtimeAnalyticsModule,

    // Interactive Video
    VideoModule,

    // Advanced Gamification
    AdvancedGamificationModule,

    // Two-Factor Authentication
    TwoFactorModule,

    // Subscriptions & Payments
    SubscriptionsModule,
  ],
})
export class AppModule { }
