import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certification')
export class CertificationController {
    constructor(private readonly service: CertificationService) { }

    @Get('certificates')
    @UseGuards(JwtAuthGuard)
    findUserCertificates(@Req() req: any) {
        return this.service.findUserCertificates(req.user.id);
    }

    @Get('verify/:code')
    verifyCertificate(@Param('code') code: string) {
        return this.service.verifyCertificate(code);
    }

    @Post('exams/:examId/attempt')
    @UseGuards(JwtAuthGuard)
    submitExamAttempt(
        @Param('examId') examId: string,
        @Req() req: any,
        @Body('answers') answers: any[],
    ) {
        return this.service.submitExamAttempt(examId, req.user.id, answers);
    }
}
