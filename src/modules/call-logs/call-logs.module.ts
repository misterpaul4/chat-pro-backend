import { CallLog } from './call-logs.entity';
import { CallLogController } from './call-logs.controller';
import { CallLogService } from './call-logs.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallLog]),
    AuthModule,
    CacheModule.register(),
  ],
  controllers: [CallLogController],
  providers: [CallLogService],
})
export class CallLogModule {}
