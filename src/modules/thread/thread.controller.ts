import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import {
  Crud,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  ParsedRequest,
} from '@nestjsx/crud';
import { Thread } from './entities/thread.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { CreateThreadDto } from './dto/create-thread.dto';
import { AuthGuard } from '@nestjs/passport';

@Crud({
  model: {
    type: Thread,
  },
  ...generalCrudOptions,
  routes: { only: ['getOneBase', 'getManyBase'] },
})
@Controller('thread')
@UseGuards(AuthGuard())
// @UseFilters(HttpExceptionFilter)
export class ThreadController implements CrudController<Thread> {
  constructor(public service: ThreadService) {}

  @Post()
  createThread(@Body() body: CreateThreadDto) {
    return this.service.createdThread(body);
  }
}
