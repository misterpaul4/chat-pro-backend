import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Blocklist } from './entities/blocklist.entity';

@Injectable()
export class BlocklistService extends TypeOrmCrudService<Blocklist> {
  constructor(
    @InjectRepository(Blocklist) private blocklistRepo: Repository<Blocklist>,
  ) {
    super(blocklistRepo);
  }
}
