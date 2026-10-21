import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('lessons/:lessonId/assignment')
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    findByLesson(@Param('lessonId') lessonId: string) {
        return this.assignmentsService.findByLesson(lessonId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    create(@Param('lessonId') lessonId: string, @Body() dto: any) {
        return this.assignmentsService.create(lessonId, dto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.assignmentsService.update(id, dto);
    }

    @Post(':id/submit')
    @UseGuards(JwtAuthGuard)
    submit(@Param('id') id: string, @Req() req: any, @Body() dto: { content: string; attachments?: string[] }) {
        return this.assignmentsService.submit(req.user.id, id, dto);
    }

    @Put('submissions/:submissionId/grade')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    grade(@Param('submissionId') submissionId: string, @Body() body: { score: number; feedback?: string }) {
        return this.assignmentsService.grade(submissionId, body.score, body.feedback);
    }

    @Get(':id/submissions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    getSubmissions(@Param('id') id: string) {
        return this.assignmentsService.getSubmissions(id);
    }

    @Get(':id/my-submission')
    @UseGuards(JwtAuthGuard)
    getMySubmission(@Param('id') id: string, @Req() req: any) {
        return this.assignmentsService.getMySubmission(req.user.id, id);
    }
}
