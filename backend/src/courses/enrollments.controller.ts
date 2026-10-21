import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) {}

    @Post(':id/enroll')
    @UseGuards(JwtAuthGuard)
    enroll(@Param('id') courseId: string, @Req() req: any) {
        return this.enrollmentsService.enroll(req.user.id, courseId);
    }

    @Delete(':id/enroll')
    @UseGuards(JwtAuthGuard)
    unenroll(@Param('id') courseId: string, @Req() req: any) {
        return this.enrollmentsService.unenroll(req.user.id, courseId);
    }

    @Get('enrollments/mine')
    @UseGuards(JwtAuthGuard)
    myEnrollments(@Req() req: any) {
        return this.enrollmentsService.findByUser(req.user.id);
    }

    @Get(':id/enrollments')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    byCourse(@Param('id') courseId: string) {
        return this.enrollmentsService.findByCourse(courseId);
    }

    @Get(':id/enrollment-status')
    @UseGuards(JwtAuthGuard)
    status(@Param('id') courseId: string, @Req() req: any) {
        return this.enrollmentsService.getStatus(req.user.id, courseId);
    }
}
