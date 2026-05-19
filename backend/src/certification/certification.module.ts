import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificationService } from './certification.service';
import { CertificationController } from './certification.controller';

@Module({
    imports: [PrismaModule],
    controllers: [CertificationController],
    providers: [CertificationService],
})
export class CertificationModule { }
