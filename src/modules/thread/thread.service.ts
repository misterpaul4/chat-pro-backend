import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Thread } from './entities/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';
import { InboxService } from '../inbox/inbox.service';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { generatePrivateThreadCode } from 'src/utils/string';
import { CreateInboxDto } from '../inbox/dto/create-inbox.dto';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
    private dataSource: DataSource,
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

  async addMessage(payload: CreateInboxDto) {
    const sender: User = getValue('user');
    await this.threadGuard(sender.id, payload.threadId);

    return this.inboxService.sendMessage({
      ...payload,
      sender,
    });
  }

  private async threadGuard(userId: string, threadId: string) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .from('thread_users_user', 'th')
        .where('th.userId = :userId', { userId })
        .andWhere('th.threadId = :threadId', { threadId })
        .getRawOne();
    } catch (error) {
      this.logger.error('Thread not found for user');
      throw new BadRequestException('You cannot send a message to this thread');
    }
  }
}
