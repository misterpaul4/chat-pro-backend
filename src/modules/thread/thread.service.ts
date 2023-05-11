import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Thread } from './entities/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';
import { InboxService } from '../inbox/inbox.service';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { generatePrivateThreadCode } from 'src/utils/string';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
  ) {
    super(threadRepo);
  }

  async createPrivateThread(payload: CreatePrivateThreadDto) {
    const sender: User = getValue('user');
    const { inbox, receiverId } = payload;
    const users = [sender, { id: receiverId }] as any;
    const code = generatePrivateThreadCode(receiverId, sender.id);

    const instance = this.threadRepo.create({
      users,
      code,
    });

    let thread: Thread;

    // check if duplicate thread does not exist between both users
    const existingThread = await this.threadRepo.findOne({
      where: {
        code,
      },
    });

    if (existingThread) {
      this.logger.error({
        message: 'Error creating private thread, already exist',
        payload: { user: sender, receiverId },
      });
      throw new NotAcceptableException('You have an existing thread');
    }

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
