import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';

@Module({
    imports: [PrismaModule],
    controllers: [ForumsController],
    providers: [ForumsService],
    exports: [ForumsService],
})
export class ForumsModule { }
