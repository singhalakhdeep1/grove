import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionsController } from './live-sessions.controller';
import { LiveSessionsGateway } from './live-sessions.gateway';

@Module({
    imports: [PrismaModule],
    controllers: [LiveSessionsController],
    providers: [LiveSessionsService, LiveSessionsGateway],
    exports: [LiveSessionsService],
})
export class LiveSessionsModule { }
