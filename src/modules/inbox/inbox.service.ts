import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Inbox } from './entities/inbox.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UsersService } from '../users/users.service';
import { CrudRequest } from '@nestjsx/crud';
import { User } from '../users/entities/user.entity';

@Injectable()
export class InboxService extends TypeOrmCrudService<Inbox> {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(Inbox) private inboxRepo: Repository<Inbox>,
    private readonly userService: UsersService,
  ) {
    super(inboxRepo);
  }

  async saveMessage(payload: CreateInboxDto) {
    if (payload.reply) {
      const inbox = await this.inboxRepo.findOne({
        where: { id: payload.reply },
        relations: ['sender'],
        select: {
          message: true,
          id: true,
          sender: { id: true, firstName: true },
        },
      });

      if (inbox) {
        payload.replyingTo = {
          message: inbox.message,
          sender: inbox.sender.firstName,
          id: inbox.id,
          senderId: inbox.sender.id,
        };
      }
    }
    const instance = this.inboxRepo.create(payload);

    try {
      const message = await this.inboxRepo.save(instance);
      return message;
    } catch (error) {
      this.logger.error({
        message: 'Error saving message to Inbox Table',
        payload: instance,
        error,
      });

      throw new BadRequestException('Invalid thread');
    }
  }

  async starInbox(id: string, userId: string, shouldStar = true) {
    try {
      const inbox = await this.inboxRepo.findOne({
        where: { id },
        select: ['id', 'starredBy', 'starred'],
      });

      if (!inbox) {
        throw new BadRequestException('Inbox message not found');
      }

      // Convert starredBy string to array for easier manipulation
      const starredUsers = inbox.starredBy
        ? inbox.starredBy.split(',').filter(Boolean)
        : [];
      const isStarredByUser = starredUsers.includes(userId);

      if (shouldStar === isStarredByUser) {
        return {
          starred: isStarredByUser,
          message: `Message already ${
            isStarredByUser ? 'starred' : 'unstarred'
          }`,
        };
      }

      if (shouldStar) {
        starredUsers.push(userId);
      } else {
        const index = starredUsers.indexOf(userId);
        if (index > -1) {
          starredUsers.splice(index, 1);
        }
      }

      // Update the inbox
      await this.inboxRepo.update(id, {
        starredBy: starredUsers.join(','),
        starred: starredUsers.length > 0,
      });

      return {
        starred: shouldStar,
        message: `Message ${shouldStar ? 'starred' : 'unstarred'} successfully`,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error updating inbox star status',
        inboxId: id,
        userId,
        error,
      });
      throw new BadRequestException('Failed to update star status');
    }
  }

  async getUserInbox(
    req: CrudRequest,
    currentUser: string,
  ): Promise<User['threads'] | []> {
    req.parsed.paramsFilter.push({
      field: 'id',
      operator: '$eq',
      value: currentUser,
    });

    req.parsed.search.$and.push({ id: { $eq: currentUser } });

    let resp: User;

    try {
      resp = await this.userService.getOne(req);
    } catch (error) {
      return [];
    }

    return resp.threads;
  }
}
