import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    create(@Req() req: any, @Body() createCourseDto: any) {
        return this.coursesService.create(req.user.id, createCourseDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.coursesService.findAll(query);
    }

    @Get('my-courses')
    @UseGuards(JwtAuthGuard)
    getInstructorCourses(@Req() req: any) {
        return this.coursesService.getInstructorCourses(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.coursesService.findOne(id, userId);
    }

    @Get(':id/statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    getStatistics(@Param('id') id: string, @Req() req: any) {
        return this.coursesService.getStatistics(id, req.user.id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    update(@Param('id') id: string, @Req() req: any, @Body() updateCourseDto: any) {
        return this.coursesService.update(id, req.user.id, updateCourseDto);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    publish(@Param('id') id: string, @Req() req: any) {
        return this.coursesService.publish(id, req.user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    remove(@Param('id') id: string, @Req() req: any) {
        return this.coursesService.remove(id, req.user.id);
    }
}
