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
import { ThreadTypeEnum } from './dto/enum';
import { UserContactList } from '../users/entities/user-contactlist';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
    private dataSource: DataSource,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
  ) {
    super(threadRepo);
  }

  async createThread(payload: CreatePrivateThreadDto) {
    const sender: User = getValue('user');
    const { inbox, receiverId } = payload;
    const users = [sender, { id: receiverId }] as any;
    const code = generatePrivateThreadCode(receiverId, sender.id);

    let thread: Thread;

    let type: ThreadTypeEnum;

    if (receiverId !== sender.id) {
      // check if in contact list
      const inContactList = await this.userContactListRepo.findOne({
        where: { userId: sender.id, contactId: receiverId },
      });

      if (inContactList?.blocked) {
        throw new BadRequestException(
          'This thread cannot be created. you have been blocked by user',
        );
      }

      type = inContactList ? ThreadTypeEnum.Private : ThreadTypeEnum.Request;
    } else {
      // user can create thread with themself
      type = ThreadTypeEnum.Private;
    }

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
    const instance = this.threadRepo.create({
      users,
      code,
      type,
    });
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
      const resp = await this.dataSource
        .createQueryBuilder()
        .from('thread_users_user', 'th')
        .innerJoinAndSelect('thread', 'thread')
        .where('th.userId = :userId', { userId })
        .andWhere('th.threadId = :threadId', { threadId })
        .andWhere('thread.type != :type', {
          type: ThreadTypeEnum.Request,
        })
        .getRawOne();

      if (!resp) {
        throw new Error();
      }

      return resp;
    } catch (error) {
      this.logger.error('Thread not found while trying to send message');
      throw new BadRequestException('You cannot send a message to this thread');
    }
  }
}
