import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { UsersGateway } from './users.gateway';
import { UsersGatewayService } from './users-gateway.service';
import { UserGatewayController } from './user-gateway.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread } from '../thread/entities/thread.entity';
import { UserGatewayBridgeService } from './user-gatway-bridge.service';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  providers: [UsersGateway, UsersGatewayService, UserGatewayBridgeService],
  imports: [
    UsersModule,
    AuthModule,
    TypeOrmModule.forFeature([Thread]),
    InboxModule,
  ],
  exports: [UsersGateway],
  controllers: [UserGatewayController],
})
export class UserGatewayModule {}
