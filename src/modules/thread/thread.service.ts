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
import { Repository, Not } from 'typeorm';
import { CreatePrivateThreadDto } from './dto/create-thread.dto';
import { InboxService } from '../inbox/inbox.service';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { generatePrivateThreadCode } from 'src/utils/string';
import { CreateInboxDto } from '../inbox/dto/create-inbox.dto';
import { ThreadTypeEnum } from './dto/enum';
import { UserContactList } from '../users/entities/user-contactlist';
import { CrudRequest } from '@nestjsx/crud';
import { UsersGateway } from '../users/users.gateway';
import { ReadMessage } from './dto/message.dto';

@Injectable()
export class ThreadService extends TypeOrmCrudService<Thread> {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private gatewayService: UsersGateway,
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

  async createThread(payload: CreatePrivateThreadDto): Promise<Thread> {
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

    const recipient: string[] = [];

    if (receiverId !== sender.id) {
      const resp = await this.userRepo.findOne({
        where: { id: receiverId },
        select: ['email', 'id', 'firstName', 'lastName', 'middleName'],
      });
      thread.users = [sender, resp];
      recipient.push(resp.id);
    } else {
      thread.users = [sender];
    }

    const message = await this.inboxService.saveMessage({
      ...inbox,
      threadId: thread.id,
      sender,
    });

    const recipientIds: string[] = thread.users
      .filter((usr) => usr.id !== sender.id)
      .map((usr) => usr.id);
    const socketPayload = { ...thread, messages: [message] };
    this.gatewayService.send(recipientIds, 'request', socketPayload);
    this.gatewayService.sendToUser(sender.id, 'inbox', socketPayload);

    return thread;
  }

  async addMessage(payload: CreateInboxDto): Promise<any> {
    const sender: User = getValue('user');
    const thread = await this.threadGuard(sender.id, payload.threadId);

    const message = await this.inboxService.saveMessage({ ...payload, sender });

    const unreadCountByUsers = await this.updateThreadReadCount(sender, thread);

    const recipientIds: string[] = thread.users.map((usr) => usr.id);
    const socketPayload = { message, unreadCountByUsers };
    this.gatewayService.send(recipientIds, 'newMessage', socketPayload);

    return message;
  }

  async approveRequest(id: string): Promise<Thread> {
    const currentUser: User = getValue('user');
    const thread = await this.threadGuard(currentUser.id, id, true, [
      'messages',
    ]);

    const instance = this.userContactListRepo.create({
      userId: currentUser.id,
      contactId: thread.createdBy,
    });

    try {
      await this.userContactListRepo.save(instance);
    } catch (error) {
      this.logger.error({ message: 'Error saving contact', payload: instance });
    }

    await this.threadRepo.update(id, { type: ThreadTypeEnum.Private });

    const recipientIds = thread.users
      .filter((user) => user.id !== currentUser.id)
      .map((user) => user.id);

    const wsPayload = { ...thread, type: ThreadTypeEnum.Private };

    this.gatewayService.sendToUser(
      currentUser.id,
      'approvedRequest',
      wsPayload,
    );
    this.gatewayService.send(recipientIds, 'approvedRequestUser', wsPayload);

    return wsPayload;
  }

  async declineRequest(id: string): Promise<UserContactList> {
    const currentUser: User = getValue('user');
    const thread = await this.threadGuard(currentUser.id, id, true);
    // soft delete thread
    await this.threadRepo.update(id, { deletedAt: new Date() });
    const instance = this.userContactListRepo.create({
      userId: currentUser.id,
      contactId: thread.createdBy,
      blocked: true,
    });

    // block user
    const contact = await this.userContactListRepo.save(instance);

    const recipientIds = thread.users
      .filter((user) => user.id !== currentUser.id)
      .map((user) => user.id);

    this.gatewayService.send(recipientIds, 'rejectedRequestUser', thread.id);
    this.gatewayService.sendToUser(
      currentUser.id,
      'rejectedRequest',
      thread.id,
    );
    // TODO: send notification
    return contact;
  }

  async readMessage(threadId: ReadMessage['threadId']) {
    const user: User = getValue('user');
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      select: ['id', 'unreadCountByUsers'],
    });

    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    await this.threadRepo.update(threadId, {
      unreadCountByUsers: { ...thread.unreadCountByUsers, [user.id]: 0 },
    });

    this.gatewayService.sendToUser(user.id, 'readMessage', {
      threadId,
      userId: user.id,
    });

    return true;
  }

  private async threadGuard(
    userId: string,
    threadId: string,
    actionType = false,
    relations: string[] = [],
  ): Promise<Thread> {
    try {
      const resp = await this.threadRepo.findOne({
        where: {
          id: threadId,
          type: actionType
            ? ThreadTypeEnum.Request
            : Not(ThreadTypeEnum.Request),
        },
        relations: ['users', ...relations],
        select: {
          users: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
          id: true,
          createdBy: true,
          unreadCountByUsers: {},
        },
      });

      if (!resp) {
        throw new Error();
      }

      const userInThread = resp.users.find((user) => user.id === userId);

      if (!userInThread) {
        throw new Error();
      }

      return resp;
    } catch (error) {
      this.logger.error('Thread not found or unauthorized');
      throw new BadRequestException('You cannot perform action on this thread');
    }
  }

  private async updateThreadReadCount(
    sender: User,
    thread: Thread,
  ): Promise<Thread['unreadCountByUsers']> {
    const threadReadCount = { ...thread.unreadCountByUsers };

    thread.users.forEach((user) => {
      threadReadCount[user.id] = (threadReadCount[user.id] ?? 0) + 1;
    });

    threadReadCount[sender.id] = 0;
    await this.threadRepo.update(thread.id, {
      unreadCountByUsers: threadReadCount,
    });

    return threadReadCount;
  }
}
