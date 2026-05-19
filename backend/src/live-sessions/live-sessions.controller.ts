import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('live-sessions')
export class LiveSessionsController {
    constructor(private readonly service: LiveSessionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    create(@Req() req: any, @Body() createDto: any) {
        return this.service.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.service.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    join(@Param('id') id: string, @Req() req: any) {
        return this.service.join(id, req.user.id);
    }

    @Post(':id/start')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    start(@Param('id') id: string, @Req() req: any) {
        return this.service.start(id, req.user.id);
    }

    @Post(':id/end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    end(@Param('id') id: string, @Req() req: any) {
        return this.service.end(id, req.user.id);
    }
}
