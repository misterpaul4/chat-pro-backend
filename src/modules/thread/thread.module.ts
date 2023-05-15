import { Module } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { ThreadController } from './thread.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread } from './entities/thread.entity';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { UserContactList } from '../users/entities/user-contactlist';

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [
    TypeOrmModule.forFeature([Thread, UserContactList]),
    AuthModule,
    InboxModule,
  ],
})
export class ThreadModule {}
