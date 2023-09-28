import { Module, forwardRef } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { ThreadController } from './thread.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread } from './entities/thread.entity';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { UserContactList } from '../users/entities/user-contactlist';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { UserGatewayModule } from '../user-gateway/user-gateway.module';

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [
    TypeOrmModule.forFeature([Thread, UserContactList, User]),
    AuthModule,
    InboxModule,
    UsersModule,
    UserGatewayModule,
  ],
  exports: [ThreadService],
})
export class ThreadModule {}
