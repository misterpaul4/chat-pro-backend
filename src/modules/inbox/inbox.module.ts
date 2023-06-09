import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbox } from './entities/inbox.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [InboxController],
  providers: [InboxService],
  imports: [TypeOrmModule.forFeature([Inbox]), AuthModule, UsersModule],
  exports: [InboxService],
})
export class InboxModule {}
