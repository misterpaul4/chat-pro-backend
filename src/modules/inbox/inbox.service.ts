import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Inbox } from './entities/inbox.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UsersService } from '../users/users.service';
import { CrudRequest } from '@nestjsx/crud';
import { User } from '../users/entities/user.entity';
import { SocketEvents } from '../users/enums';
import { UsersGateway } from '../users/users.gateway';

@Injectable()
export class InboxService extends TypeOrmCrudService<Inbox> {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(Inbox) private inboxRepo: Repository<Inbox>,
    private readonly userService: UsersService,
    private readonly gatewayService: UsersGateway,
  ) {
    super(inboxRepo);
  }

  async saveMessage(
    payload: CreateInboxDto,
    socketEvent: `${SocketEvents}`,
    recipientEmails: string[],
  ) {
    const instance = this.inboxRepo.create(payload);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sender, ...resp } = await this.inboxRepo.save(instance);
      this.gatewayService.send(recipientEmails, socketEvent, resp);
      return resp;
    } catch (error) {
      this.logger.error({
        message: 'Error saving message to Inbox Table',
        payload: instance,
      });

      throw new BadRequestException('Invalid thread');
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
