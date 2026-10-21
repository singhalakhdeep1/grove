import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('lessons/:lessonId/quiz')
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    findByLesson(@Param('lessonId') lessonId: string) {
        return this.quizzesService.findByLesson(lessonId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    create(@Param('lessonId') lessonId: string, @Body() dto: any) {
        return this.quizzesService.create(lessonId, dto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.quizzesService.update(id, dto);
    }

    @Post(':id/attempt')
    @UseGuards(JwtAuthGuard)
    submitAttempt(
        @Param('id') id: string,
        @Req() req: any,
        @Body() body: { answers: { questionId: string; answer: string }[] },
    ) {
        return this.quizzesService.submitAttempt(req.user.id, id, body.answers);
    }

    @Get(':id/attempts')
    @UseGuards(JwtAuthGuard)
    getAttempts(@Param('id') id: string, @Req() req: any) {
        return this.quizzesService.getAttempts(req.user.id, id);
    }
}
