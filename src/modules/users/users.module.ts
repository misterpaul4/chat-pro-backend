import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UserContactList } from './entities/user-contactlist';
import { UsersGateway } from './users.gateway';
import { UsersPresetsService } from './users-presets.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersGateway, UsersPresetsService],
  imports: [
    TypeOrmModule.forFeature([User, UserContactList]),
    forwardRef(() => AuthModule),
  ],
  exports: [UsersService, UsersGateway],
})
export class UsersModule {}
