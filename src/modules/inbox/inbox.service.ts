import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Inbox } from './entities/inbox.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UsersService } from '../users/users.service';
import { CrudRequest, CrudRequestOptions } from '@nestjsx/crud';

@Injectable()
export class InboxService extends TypeOrmCrudService<Inbox> {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(Inbox) private inboxRepo: Repository<Inbox>,
    private readonly userService: UsersService,
  ) {
    super(inboxRepo);
  }

  async sendMessage(payload: CreateInboxDto) {
    const instance = this.inboxRepo.create(payload);

    try {
      return await this.inboxRepo.save(instance);
    } catch (error) {
      this.logger.error({
        message: 'Error saving message to Inbox Table',
        payload: instance,
      });

      throw new BadRequestException('Invalid thread');
    }
  }

  async getUserInbox(req: CrudRequest, currentUser: string) {
    req.parsed.paramsFilter.push({
      field: 'id',
      operator: '$eq',
      value: currentUser,
    });

    req.parsed.search.$and.push({ id: { $eq: currentUser } });

    const resp = await this.userService.getOne(req);

    return resp.threads;
  }
}
