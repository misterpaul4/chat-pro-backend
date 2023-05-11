import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { Thread } from './entities/thread.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { AuthGuard } from '@nestjs/passport';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';

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
  createPrivateThread(@Body() body: CreatePrivateThreadDto) {
    return this.service.createPrivateThread(body);
  }
}
