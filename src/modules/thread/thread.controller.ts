import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { Thread } from './entities/thread.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { AuthGuard } from '@nestjs/passport';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';
import { CreateInboxDto } from '../inbox/dto/create-inbox.dto';

@Crud({
  model: {
    type: Thread,
  },
  ...generalCrudOptions,
  routes: { only: ['getOneBase', 'getManyBase'] },
  query: {
    ...generalCrudOptions.query,
    join: {
      users: { eager: false, exclude: ['password'] },
      messages: { eager: false },
    },
    exclude: ['code'],
  },
})
@Controller('thread')
@UseGuards(AuthGuard())
// @UseFilters(HttpExceptionFilter)
export class ThreadController implements CrudController<Thread> {
  constructor(public service: ThreadService) {}

  @Post()
  createThread(@Body() body: CreatePrivateThreadDto) {
    return this.service.createThread(body);
  }

  @Post('send-message')
  addMessage(@Body() body: CreateInboxDto) {
    return this.service.addMessage(body);
  }

  @Post(':id/approve')
  approveRequest(@Param('id') id: string) {
    return this.service.approveRequest(id);
  }

  @Post(':id/decline')
  declineRequest(@Param('id') id: string) {
    return this.service.declineRequest(id);
  }
}
