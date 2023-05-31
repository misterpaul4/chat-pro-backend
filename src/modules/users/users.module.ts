import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UserContactList } from './entities/user-contactlist';
import { UsersGateway } from './users.gateway';
import { Thread } from '../thread/entities/thread.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersGateway],
  imports: [
    TypeOrmModule.forFeature([User, UserContactList, Thread]),
    forwardRef(() => AuthModule),
  ],
  exports: [UsersService, UsersGateway],
})
export class UsersModule {}
