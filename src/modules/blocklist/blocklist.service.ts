import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Blocklist } from './entities/blocklist.entity';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BlocklistService extends TypeOrmCrudService<Blocklist> {
  constructor(
    @InjectRepository(Blocklist) private blocklistRepo: Repository<Blocklist>,
  ) {
    super(blocklistRepo);
  }

  createOne(req: CrudRequest, dto: DeepPartial<Blocklist>): Promise<Blocklist> {
    const currentUser: User = getValue('user');
    return super.createOne(req, { ...dto, userId: currentUser.id });
  }
}
