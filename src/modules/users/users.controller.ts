import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './entities/user.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/current-user-decorator';
import { BlockUserDto } from './dto/user-operations.dto';
import { AuthGuard } from '@nestjs/passport';
import { HttpExceptionFilter } from 'src/lib/http-exception.filter';
import { UuidValidationPipe } from 'src/lib/uuid-validation.pipe';

// @Crud({
//   model: {
//     type: User,
//   },
//   ...generalCrudOptions,
//   dto: { create: CreateUserDto, update: UpdateUserDto },
//   routes: {
//     only: ['updateOneBase', 'deleteOneBase', 'getOneBase', 'getManyBase'],
//   },
//   query: {
//     join: {
//       tasks: {
//         eager: false,
//       },
//       tags: {
//         eager: false,
//       },
//       blocklist: {
//         eager: false,
//       },
//     },
//     exclude: ['password'],
//   },
// })
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

  @Post('send-request/:receiverId')
  @UsePipes(new UuidValidationPipe())
  sendRequest(
    @CurrentUser() user: User,
    @Param('receiverId') receiverId: string,
  ) {
    return this.service.sendRequest(user.id, receiverId);
  }
}
