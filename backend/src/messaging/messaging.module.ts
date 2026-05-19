import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';

@Module({
    imports: [PrismaModule],
    controllers: [MessagingController],
    providers: [MessagingService, MessagingGateway],
    exports: [MessagingService],
})
export class MessagingModule { }
