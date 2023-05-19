import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
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
import { CrudRequest } from '@nestjsx/crud';
import { camelCase, mapKeys } from 'lodash';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
    private dataSource: DataSource,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    super(threadRepo);
  }

  async getSingleThread(req: CrudRequest) {
    const currentUser: User = getValue('user');
    // add users relation
    if (!req.parsed.join.find((j) => j.field === 'users')) {
      req.parsed.join.push({ field: 'users' });
    }

    const resp = await super.getOne(req);

    // check if authorized
    if (!resp.users.find((user) => user.id === currentUser.id)) {
      throw new UnauthorizedException();
    }

    return resp;
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
        where: { contactId: sender.id, userId: receiverId },
      });

      if (inContactList?.blocked) {
        throw new BadRequestException(
          'This thread cannot be created. you have been blocked by user',
        );
      }

      // save contact
      try {
        const instance = this.userContactListRepo.create({
          userId: sender.id,
          contactId: receiverId,
        });
        await this.userContactListRepo.save(instance);
      } catch (error) {
        this.logger.error({
          message: 'Error saving contact',
          userId: sender.id,
          contactId: receiverId,
        });
      }

      type = inContactList ? ThreadTypeEnum.Private : ThreadTypeEnum.Request;
    } else {
      // user can create thread with themself
      type = ThreadTypeEnum.Self;
    }

    // check for duplicate thread
    const existingThread = await this.threadRepo.findOne({
      where: {
        code,
      },
    });

    if (existingThread) {
      this.logger.error({
        message: 'Error creating thread, already exist',
        payload: { user: sender, receiverId, existingThread },
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

    const recipient = await this.userRepo.findOne({
      where: { id: receiverId },
      select: ['email'],
    });

    // save message
    await this.inboxService.saveMessage(
      { ...inbox, thread, sender },
      type === ThreadTypeEnum.Request ? 'request' : 'inbox',
      [recipient.email],
    );

    return thread;
  }

  async addMessage(payload: CreateInboxDto) {
    const sender: User = getValue('user');
    const resp = await this.threadGuard(sender.id, payload.threadId);

    const recipientEmails: string[] = resp
      .map((thread) => thread.users_email)
      .filter((email) => email !== sender.email);

    return this.inboxService.saveMessage(
      {
        ...payload,
        sender,
      },
      'inbox',
      recipientEmails,
    );
  }

  async approveRequest(id: string): Promise<Thread> {
    const currentUser: User = getValue('user');
    const resp = await this.requestActionGuard(currentUser.id, id);
    const res = mapKeys(resp, (_, key) =>
      camelCase(key.replace('thread_', '')),
    ) as Thread;

    const instance = this.userContactListRepo.create({
      userId: currentUser.id,
      contactId: res.createdBy,
    });

    try {
      await this.userContactListRepo.save(instance);
    } catch (error) {
      this.logger.error({ message: 'Error saving contact', payload: instance });
    }

    return this.threadRepo.save({ ...res, type: ThreadTypeEnum.Private });
  }

  async declineRequest(id: string) {
    const currentUser: User = getValue('user');
    const thread = await this.requestActionGuard(currentUser.id, id);
    // soft delete thread
    await this.threadRepo.update(id, { deletedAt: new Date() });
    const instance = this.userContactListRepo.create({
      userId: currentUser.id,
      contactId: thread.thread_createdBy,
      blocked: true,
    });

    // block user
    return this.userContactListRepo.save(instance);
  }

  private async requestActionGuard(userId: string, threadId: string) {
    try {
      const resp = await this.dataSource
        .createQueryBuilder()
        .from('thread_users_user', 'th')
        .innerJoinAndSelect('thread', 'thread')
        .where('th.userId = :userId', { userId })
        .andWhere('th.threadId = :threadId', { threadId })
        .andWhere('thread.type = :type', {
          type: ThreadTypeEnum.Request,
        })
        .andWhere('thread.createdBy != :userId', { userId })
        .getRawOne();

      if (!resp) {
        throw new Error();
      }

      return resp;
    } catch (error) {
      this.logger.error('Thread not found while trying update thread type');
      throw new BadRequestException('You cannot perform action on this thread');
    }
  }

  private async threadGuard(userId: string, threadId: string) {
    try {
      const resp = await this.dataSource
        .createQueryBuilder()
        .from('thread_users_user', 'th')
        .innerJoinAndSelect('thread', 'thread')
        .innerJoinAndSelect('thread.users', 'users')
        .where('th.userId = :userId', { userId })
        .andWhere('th.threadId = :threadId', { threadId })
        .andWhere('thread.type != :type', {
          type: ThreadTypeEnum.Request,
        })
        .getRawMany();

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
