import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
    constructor(private readonly service: MessagingService) { }

    @Get('conversations')
    findConversations(@Req() req: any) {
        return this.service.findConversations(req.user.id);
    }

    @Post('conversations')
    createConversation(@Req() req: any, @Body('participantIds') participantIds: string[]) {
        return this.service.createConversation(req.user.id, participantIds);
    }

    @Get('conversations/:id/messages')
    findMessages(@Param('id') id: string, @Req() req: any, @Query() query: any) {
        return this.service.findMessages(id, req.user.id, query);
    }

    @Post('conversations/:id/messages')
    sendMessage(
        @Param('id') id: string,
        @Req() req: any,
        @Body('content') content: string,
    ) {
        return this.service.sendMessage(id, req.user.id, content);
    }

    @Post('messages/:id/read')
    markAsRead(@Param('id') id: string, @Req() req: any) {
        return this.service.markAsRead(id, req.user.id);
    }

    @Delete('messages/:id')
    deleteMessage(@Param('id') id: string, @Req() req: any) {
        return this.service.deleteMessage(id, req.user.id);
    }
}
