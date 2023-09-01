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
        },
        id: true,
        createdBy: true,
        unreadCountByUsers: {},
      },
    });

    // if thread exist
    if (!thread) {
      return;
    }

    // if user is present in thread users
    if (!thread.users.find((user) => user.id === userId)) {
      return;
    }

    // save message
    const message = await this.inboxService.saveMessage({
      ...payload,
      senderId: userId,
    });

    const unreadCountByUsers = await this.updateThreadReadCount(userId, thread);
    const recipientIds: string[] = thread.users.map((usr) => usr.id);

    const socketPayload = { message, unreadCountByUsers };

    return { socketPayload, recipientIds };
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
