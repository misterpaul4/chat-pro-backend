import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';

@Injectable()
export class RequestsService extends TypeOrmCrudService<Request> {
  constructor(
    @InjectRepository(Request) private requestRepo: Repository<Request>,
  ) {
    super(requestRepo);
  }
}
