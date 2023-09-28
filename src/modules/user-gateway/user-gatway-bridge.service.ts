import { InjectRepository } from '@nestjs/typeorm';
import { Thread } from '../thread/entities/thread.entity';
import { Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateInboxDto } from '../inbox/dto/create-inbox.dto';
import { ThreadTypeEnum } from '../thread/dto/enum';
import { InboxService } from '../inbox/inbox.service';

@Injectable()
export class UserGatewayBridgeService {
  constructor(
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    private inboxService: InboxService,
  ) {}

  async dispatchMessage(payload: CreateInboxDto, userId: string) {
    const thread = await this.threadRepo.findOne({
      where: { id: payload.threadId, type: Not(ThreadTypeEnum.Request) },
      relations: ['users'],
      select: {
        users: {
          id: true,
          firstName: true,
          lastName: true,
        },
        id: true,
        createdBy: true,
        unreadCountByUsers: {},
        type: true,
      },
    });

    // if thread exist
    if (!thread) {
      return;
    }

    const sender = thread.users.find((user) => user.id === userId);

    // if user is present in thread users
    if (!sender) {
      return;
    }

    // save message
    const message = await this.inboxService.saveMessage({
      ...payload,
      senderId: userId,
      id: payload.updateId, // TODO: ID must not come from UI
    });

    const unreadCountByUsers = await this.updateThreadReadCount(userId, thread);
    const recipientIds: string[] = thread.users.map((usr) => usr.id);

    const socketPayload = {
      message,
      unreadCountByUsers,
      updateId: payload.updateId,
      type: thread.type,
      sender: `${sender.firstName} ${sender.lastName}`,
    };

    return { socketPayload, recipientIds };
  }

  async dispatchReadMessage(
    userId: string,
    threadId: string,
  ): Promise<string[]> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      relations: ['users'],
      select: {
        id: true,
        unreadCountByUsers: {},
        users: { id: true },
      },
    });

    if (!thread) {
      return;
    }

    await this.threadRepo.update(threadId, {
      unreadCountByUsers: { ...thread.unreadCountByUsers, [userId]: 0 },
    });

    return thread.users.map((user) => user.id);
  }

  private async updateThreadReadCount(
    senderId: string,
    thread: Thread,
  ): Promise<Thread['unreadCountByUsers']> {
    const threadReadCount = { ...thread.unreadCountByUsers };

    thread.users.forEach((user) => {
      threadReadCount[user.id] = (threadReadCount[user.id] ?? 0) + 1;
    });

    threadReadCount[senderId] = 0;
    await this.threadRepo.update(thread.id, {
      unreadCountByUsers: threadReadCount,
    });

    return threadReadCount;
  }
}
