import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { generalCrudOptions } from 'src/utils/crud';
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
    join: {
      sender: { eager: false, exclude: ['password'] },
      receiver: { eager: false, exclude: ['password'] },
    },
  },
  dto: { create: CreateInboxDto, update: UpdateInboxDto },
  routes: {
    exclude: [
      'createOneBase',
      'getManyBase',
      'getOneBase',
      'createManyBase',
      'deleteOneBase',
      'updateOneBase',
      'recoverOneBase',
      'replaceOneBase',
    ],
  },
})
@Controller('inbox')
@UseGuards(AuthGuard())
export class InboxController implements CrudController<Inbox> {
  constructor(public service: InboxService) {}

  @Get()
  @UseInterceptors(CrudRequestInterceptor)
  getInbox(@CurrentUser() user: User, @ParsedRequest() req: CrudRequest) {
    // get only logged in user's messages
    req.parsed.search.$and.push({
      $or: [{ receiverId: { $eq: user.id } }, { senderId: { $eq: user.id } }],
    });
    req.parsed.sort = [{ field: 'createdAt', order: 'DESC' }];
    return this.service.getMany(req);
  }

  @Post()
  @UseInterceptors(CrudRequestInterceptor)
  sendMessage(
    @ParsedRequest() req: CrudRequest,
    @CurrentUser() user: User,
    @Body() body: CreateInboxDto,
  ) {
    return this.service.sendMessage(user.id, body, req);
  }
}
