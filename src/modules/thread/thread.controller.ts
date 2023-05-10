import { Controller, UseGuards } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { Thread } from './entities/thread.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { AuthGuard } from '@nestjs/passport';

@Crud({
  model: {
    type: Thread,
  },
  ...generalCrudOptions,
  dto: { create: CreateThreadDto, update: UpdateThreadDto },
  routes: { only: ['getOneBase', 'getManyBase'] },
})
@Controller('thread')
@UseGuards(AuthGuard())
// @UseFilters(HttpExceptionFilter)
export class ThreadController implements CrudController<Thread> {
  constructor(public service: ThreadService) {}
}
