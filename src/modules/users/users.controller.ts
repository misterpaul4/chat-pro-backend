import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './entities/user.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/current-user-decorator';
import { BlockUserDto } from './dto/user-operations.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserChatRequests } from './entities/user-chat-requests';

@Crud({
  model: {
    type: User,
  },
  ...generalCrudOptions,
  dto: { create: CreateUserDto, update: UpdateUserDto },
  routes: {
    only: ['getOneBase'],
  },
  query: {
    join: {
      blockedUsers: {
        eager: false,
        exclude: ['password'],
      },
      receivedRequest: {
        eager: false,
        exclude: ['password'],
      },
      sentRequest: {
        eager: false,
        exclude: ['password'],
      },
    },
    exclude: ['password'],
  },
})
@Controller('users')
@UseGuards(AuthGuard())
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}

  @Post('block/add')
  block(@CurrentUser() user: User, @Body() dto: BlockUserDto) {
    return this.service.block(user.id, dto.userIds);
  }

  @Post('block/remove')
  unBlock(@CurrentUser() user: User, @Body() dto: BlockUserDto) {
    return this.service.unblock(user.id, dto.userIds);
  }

  @Post('chat-requests/send')
  sendRequest(@CurrentUser() user: User, @Body() payload: UserChatRequests) {
    return this.service.sendRequest(user.id, payload);
  }

  @Get('chat-requests/received')
  getChatRequest(@CurrentUser() user: User) {
    return this.service.getRequests(user.id);
  }

  @Get('chat-requests/sent')
  getSentChatRequest(@CurrentUser() user: User) {
    return this.service.getSentRequests(user.id);
  }
}
