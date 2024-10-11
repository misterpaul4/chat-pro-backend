import { CallLog } from './call-logs.entity';
import { CallLogController } from './call-logs.controller';
import { CallLogService } from './call-logs.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog]), AuthModule],
  controllers: [CallLogController],
  providers: [CallLogService],
})
export class CallLogModule {}
