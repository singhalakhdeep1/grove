import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses/:courseId/modules/:moduleId/lessons')
export class LessonsController {
    constructor(private readonly lessonsService: LessonsService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Param('moduleId') moduleId: string) {
        return this.lessonsService.findByModule(moduleId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.lessonsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    create(@Param('moduleId') moduleId: string, @Body() dto: any) {
        return this.lessonsService.create(moduleId, dto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.lessonsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.lessonsService.delete(id);
    }

    @Post(':id/complete')
    @UseGuards(JwtAuthGuard)
    markComplete(@Param('id') id: string, @Req() req: any, @Body() body: { watchTime?: number }) {
        return this.lessonsService.markComplete(req.user.id, id, body.watchTime);
    }

    @Get(':id/progress')
    @UseGuards(JwtAuthGuard)
    getProgress(@Param('id') id: string, @Req() req: any) {
        return this.lessonsService.getProgress(req.user.id, id);
    }
}
