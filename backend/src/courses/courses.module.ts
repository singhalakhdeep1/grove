import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { VideoProcessingService } from './video-processing.service';
import { S3Service } from '../common/services/s3.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, EmailModule],
    controllers: [
        CoursesController,
        LessonsController,
        QuizzesController,
        AssignmentsController,
        EnrollmentsController,
    ],
    providers: [
        CoursesService,
        LessonsService,
        QuizzesService,
        AssignmentsService,
        EnrollmentsService,
        VideoProcessingService,
        S3Service,
    ],
    exports: [CoursesService, EnrollmentsService],
})
export class CoursesModule { }
