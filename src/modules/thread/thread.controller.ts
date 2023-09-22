import {
  Body,
  Controller,
  Get,
  Param,
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
import { excludeAllRoutes, generalCrudOptions } from 'src/utils/crud';
import { AuthGuard } from '@nestjs/passport';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';
import { CreateInboxDto } from '../inbox/dto/create-inbox.dto';
import { ReadMessage } from './dto/message.dto';

@Crud({
  model: {
    type: Thread,
  },
  ...generalCrudOptions,
  routes: excludeAllRoutes,
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

  @Get(':id')
  @UseInterceptors(CrudRequestInterceptor)
  getSingleThread(@ParsedRequest() req: CrudRequest) {
    return this.service.getSingleThread(req);
  }

  @Post()
  createThread(@Body() body: CreatePrivateThreadDto) {
    return this.service.createThread(body);
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
