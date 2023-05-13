import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { AuthGuard } from '@nestjs/passport';
import {
  Crud,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  ParsedRequest,
} from '@nestjsx/crud';
import { Inbox } from './entities/inbox.entity';
import { excludeAllRoutes, generalCrudOptions } from 'src/utils/crud';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UpdateInboxDto } from './dto/update-inbox.dto';
import { CurrentUser } from '../auth/current-user-decorator';
import { User } from '../users/entities/user.entity';

@Crud({
  model: {
    type: Inbox,
  },
  ...generalCrudOptions,
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
  dto: { create: CreateInboxDto, update: UpdateInboxDto },
  routes: excludeAllRoutes,
})
@Controller('inbox')
@UseGuards(AuthGuard())
export class InboxController implements CrudController<Inbox> {
  constructor(public service: InboxService) {}

  @Get()
  @UseInterceptors(CrudRequestInterceptor)
  getUserInbox(@ParsedRequest() req: CrudRequest, @CurrentUser() user: User) {
    return this.service.getUserInbox(req, user.id);
  }
}
