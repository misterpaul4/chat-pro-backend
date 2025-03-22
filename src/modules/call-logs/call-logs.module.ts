import { CallLog } from './call-logs.entity';
import { CallLogController } from './call-logs.controller';
import { CallLogService } from './call-logs.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UserGatewayModule } from '../user-gateway/user-gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallLog]),
    AuthModule,
    CacheModule.register(),
    UserGatewayModule,
  ],
  controllers: [CallLogController],
  providers: [CallLogService],
  exports: [CallLogService],
})
export class CallLogModule {}
