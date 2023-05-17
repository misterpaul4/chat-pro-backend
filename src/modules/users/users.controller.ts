import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { User } from './entities/user.entity';
import { excludeAllRoutes, generalCrudOptions } from 'src/utils/crud';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/current-user-decorator';
import {
  AddContactDto,
  EmailDto,
  UpdateContactsDto,
} from './dto/user-operations.dto';
import { AuthGuard } from '@nestjs/passport';
import { UuidValidationPipe } from 'src/lib/uuid-validation.pipe';

@Crud({
  model: {
    type: User,
  },
  ...generalCrudOptions,
  dto: { create: CreateUserDto, update: UpdateUserDto },
  routes: excludeAllRoutes,
  query: {
    ...generalCrudOptions.query,
    exclude: ['password'],
    join: {
      threads: {
        eager: false,
        exclude: ['code'],
      },
      ['threads.messages']: {
        eager: false,
      },
      ['threads.users']: {
        eager: false,
        exclude: ['password'],
      },
    },
  },
})
@Controller('users')
@UseGuards(AuthGuard())
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}

  @Get('contacts')
  getContacts(@CurrentUser() user: User) {
    return this.service.getContacts(user.id);
  }

  @Post('contacts/add')
  addContact(@CurrentUser() user: User, @Body() body: AddContactDto) {
    return this.service.addToContact(user.id, body.contactId, !!body.blocked);
  }

  @Delete('contacts/remove/:id')
  @UsePipes(new UuidValidationPipe())
  removeContact(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.removeContact(user.id, id);
  }

  @Post('verify-email')
  verifyUser(@Body() body: EmailDto) {
    return this.service.verifyUser(body.email);
  }

  @Patch('mass-update-contacts')
  updateContacts(@Body() body: UpdateContactsDto) {
    return this.service.updateContacts(body);
  }
}
