import { Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Inbox } from './entities/inbox.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { CrudRequest } from '@nestjsx/crud';
import { UsersService } from '../users/users.service';

@Injectable()
export class InboxService extends TypeOrmCrudService<Inbox> {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(Inbox) private inboxRepo: Repository<Inbox>,
    private readonly userService: UsersService,
  ) {
    super(inboxRepo);
  }

  async sendMessage(
    currentUser: string,
    payload: CreateInboxDto,
    req: CrudRequest,
  ) {
    // check contact and if blocked
    await this.userService.contactGuard(currentUser, payload.receiverId);
    return super.createOne(req, { ...payload, senderId: currentUser });
  }

  getShallowInbox(currentUser: string) {
    return (
      this.inboxRepo
        .createQueryBuilder('inbox')
        // .distinctOn(['inbox.senderId', 'inbox.receiverId'])
        .where('inbox.senderId = :userId OR inbox.receiverId = :userId', {
          userId: currentUser,
        })
        .orderBy('inbox.createdAt', 'DESC')
        .getMany()
    );

    // return super.getMany(req);
  }
}
