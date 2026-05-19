import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MentorshipService } from './mentorship.service';
import { MentorshipController } from './mentorship.controller';

@Module({
    imports: [PrismaModule],
    controllers: [MentorshipController],
    providers: [MentorshipService],
})
export class MentorshipModule { }
