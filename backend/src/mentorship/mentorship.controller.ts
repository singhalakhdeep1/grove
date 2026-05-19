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
import { MentorshipService } from './mentorship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mentorship')
export class MentorshipController {
    constructor(private readonly service: MentorshipService) { }

    @Get('mentors')
    findMentors(@Query() query: any) {
        return this.service.findMentors(query);
    }

    @Post('request')
    @UseGuards(JwtAuthGuard)
    requestMentorship(
        @Body('mentorId') mentorId: string,
        @Req() req: any,
        @Body() createDto: any,
    ) {
        return this.service.requestMentorship(mentorId, req.user.id, createDto);
    }

    @Post('sessions')
    @UseGuards(JwtAuthGuard)
    createSession(@Body('requestId') requestId: string, @Body() createDto: any) {
        return this.service.createSession(requestId, createDto);
    }

    @Post('reviews')
    @UseGuards(JwtAuthGuard)
    addReview(
        @Body('sessionId') sessionId: string,
        @Req() req: any,
        @Body() createDto: any,
    ) {
        return this.service.addReview(sessionId, req.user.id, createDto);
    }
}
