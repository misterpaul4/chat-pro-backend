import { Controller, UseGuards } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';
import { Inbox } from './entities/inbox.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UpdateInboxDto } from './dto/update-inbox.dto';

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
  routes: { only: ['getManyBase', 'getOneBase'] },
})
@Controller('inbox')
@UseGuards(AuthGuard())
export class InboxController implements CrudController<Inbox> {
  constructor(public service: InboxService) {}
}
