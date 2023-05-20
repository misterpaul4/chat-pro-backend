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
import { getValue } from 'express-ctx';
import { Thread } from '../thread/entities/thread.entity';

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
    thread: Thread,
    payload: CreateInboxDto,
    newThread?: boolean,
  ) {
    const user: User = getValue('user');
    const instance = this.inboxRepo.create(payload);

    try {
      const message = await this.inboxRepo.save(instance);
      if (newThread) {
        const recipientEmails: string[] = thread.users
          .filter((usr) => usr.id !== user.id)
          .map((usr) => usr.email);
        const socketPayload = { ...thread, messages: [message] };
        this.gatewayService.send(recipientEmails, 'request', socketPayload);
        this.gatewayService.sendToUser(user.email, 'inbox', socketPayload);
      } else {
        const recipientEmails: string[] = thread.users.map((usr) => usr.email);
        const socketPayload = message;
        this.gatewayService.send(recipientEmails, 'newMessage', socketPayload);
      }

      return { message: 'sent' };
    } catch (error) {
      this.logger.error({
        message: 'Error saving message to Inbox Table',
        payload: instance,
        error,
      });

      throw new BadRequestException('Invalid thread');
    }
  }

  // async saveMessage(
  //   payload: { inbox: CreateInboxDto; rest?: { [key in string]: any } },
  //   socketEvent: `${SocketEvents}`,
  //   recipientEmails: string[],
  // ) {
  //   const user: User = getValue('user');
  //   const instance = this.inboxRepo.create(payload.inbox);

  //   try {
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     const { sender, thread, ...resp } = await this.inboxRepo.save(instance);

  //     const wsPayload = payload.rest
  //       ? {
  //           ...payload.rest,
  //           messages: [resp],
  //         }
  //       : { ...resp, sender: user };
  //     this.gatewayService.send(recipientEmails, socketEvent, wsPayload);
  //     this.gatewayService.sendToUser(
  //       user.email,
  //       payload.rest ? 'inbox' : 'newMessage',
  //       wsPayload,
  //     );
  //     return resp;
  //   } catch (error) {
  //     this.logger.error({
  //       message: 'Error saving message to Inbox Table',
  //       payload: instance,
  //       error,
  //     });

  //     throw new BadRequestException('Invalid thread');
  //   }
  // }

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
