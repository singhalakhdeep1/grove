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
import { ForumsService } from './forums.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteType } from '@prisma/client';

@Controller('forums')
export class ForumsController {
    constructor(private readonly service: ForumsService) { }

    @Get()
    findAllForums() {
        return this.service.findAllForums();
    }

    @Get(':forumId/threads')
    findThreads(@Param('forumId') forumId: string, @Query() query: any) {
        return this.service.findThreads(forumId, query);
    }

    @Post(':forumId/threads')
    @UseGuards(JwtAuthGuard)
    createThread(
        @Param('forumId') forumId: string,
        @Req() req: any,
        @Body() createDto: any,
    ) {
        return this.service.createThread(forumId, req.user.id, createDto);
    }

    @Get('threads/:id')
    findThread(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.service.findThread(id, userId);
    }

    @Post('threads/:threadId/posts')
    @UseGuards(JwtAuthGuard)
    createPost(
        @Param('threadId') threadId: string,
        @Req() req: any,
        @Body() createDto: any,
    ) {
        return this.service.createPost(threadId, req.user.id, createDto);
    }

    @Put('posts/:id')
    @UseGuards(JwtAuthGuard)
    updatePost(@Param('id') id: string, @Req() req: any, @Body() updateDto: any) {
        return this.service.updatePost(id, req.user.id, updateDto);
    }

    @Delete('posts/:id')
    @UseGuards(JwtAuthGuard)
    deletePost(@Param('id') id: string, @Req() req: any) {
        return this.service.deletePost(id, req.user.id);
    }

    @Post('posts/:postId/vote')
    @UseGuards(JwtAuthGuard)
    votePost(
        @Param('postId') postId: string,
        @Req() req: any,
        @Body('voteType') voteType: VoteType,
    ) {
        return this.service.votePost(postId, req.user.id, voteType);
    }

    @Post('posts/:postId/best-answer')
    @UseGuards(JwtAuthGuard)
    markAsBestAnswer(@Param('postId') postId: string, @Req() req: any) {
        return this.service.markAsBestAnswer(postId, req.user.id);
    }
}
