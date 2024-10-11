import { Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './call-logs.entity';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { MakeCallDto } from './call-logs.dto';
@Injectable()
export class CallLogService extends TypeOrmCrudService<CallLog> {
  private readonly logger = new Logger(CallLogService.name);

  constructor(
    @InjectRepository(CallLog) private callRepo: Repository<CallLog>,
  ) {
    super(callRepo);
  }

  getMany(
    req: CrudRequest,
  ): Promise<CallLog[] | GetManyDefaultResponse<CallLog>> {
    return super.getMany(req);
  }

  getOne(req: CrudRequest): Promise<CallLog> {
    return super.getOne(req);
  }

  makeCall(dto: MakeCallDto) {
    return dto;
  }
}
