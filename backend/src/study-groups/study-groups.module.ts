import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudyGroupsService } from './study-groups.service';
import { StudyGroupsController } from './study-groups.controller';

@Module({
    imports: [PrismaModule],
    controllers: [StudyGroupsController],
    providers: [StudyGroupsService],
})
export class StudyGroupsModule { }
