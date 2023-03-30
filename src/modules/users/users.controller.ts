import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './entities/user.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Crud({
  model: {
    type: User,
  },
  ...generalCrudOptions,
  dto: { create: CreateUserDto, update: UpdateUserDto },
  routes: {
    only: ['updateOneBase', 'deleteOneBase', 'getOneBase', 'getManyBase'],
  },
  query: {
    join: {
      tasks: {
        eager: false,
      },
      tags: {
        eager: false,
      },
      blocklist: {
        eager: false,
      },
    },
    exclude: ['password'],
  },
})
@Controller('users')
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
