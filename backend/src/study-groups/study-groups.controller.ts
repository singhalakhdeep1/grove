import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { StudyGroupsService } from './study-groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('study-groups')
export class StudyGroupsController {
    constructor(private readonly service: StudyGroupsService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.service.findAll(query);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Req() req: any, @Body() createDto: any) {
        return this.service.create(req.user.id, createDto);
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

    @Post(':id/posts')
    @UseGuards(JwtAuthGuard)
    createPost(@Param('id') id: string, @Req() req: any, @Body() createDto: any) {
        return this.service.createPost(id, req.user.id, createDto);
    }
}
