import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Thread } from './entities/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateThreadDto } from './dto/create-thread.dto';
import { InboxService } from '../inbox/inbox.service';
import { getValue } from 'express-ctx';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
  ) {
    super(threadRepo);
  }

  async createdThread(payload: CreateThreadDto) {
    const { inbox, userIds } = payload;
    const users = userIds.map((id) => ({ id })) as any;

    const instance = this.threadRepo.create({ users });

    const sender = getValue('user');

    let thread: Thread;

    // save thread
    try {
      thread = await this.threadRepo.save(instance);
    } catch (error) {
      this.logger.error({ message: 'Error saving thread', payload: instance });
      throw new BadRequestException({
        message: 'One or more users does not exist',
      });
    }

    // save message
    await this.inboxService.sendMessage({ ...inbox, thread, sender });

    return thread;
  }
}
