import { Inject, Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './call-logs.entity';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { EndCallDto, MakeCallDto } from './call-logs.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { CallLogStatus } from './enum';
import { UsersGateway } from '../user-gateway/users.gateway';
import { SocketEvents } from '../users/enums';
@Injectable()
export class CallLogService extends TypeOrmCrudService<CallLog> {
  private readonly logger = new Logger(CallLogService.name);

  constructor(
    @InjectRepository(CallLog) public repo: Repository<CallLog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly userGateway: UsersGateway,
  ) {
    super(repo);
  }

  getMany(
    req: CrudRequest,
  ): Promise<CallLog[] | GetManyDefaultResponse<CallLog>> {
    return super.getMany(this.getRequestGuard(req));
  }

  getOne(req: CrudRequest): Promise<CallLog> {
    return super.getOne(this.getRequestGuard(req));
  }

  private getRequestGuard(req: CrudRequest) {
    const user: User = getValue('user');

    req.parsed.search.$and.push({
      $or: [
        {
          callFromId: {
            $eq: user.id,
          },
        },
        {
          callToId: {
            $eq: user.id,
          },
        },
      ],
    });

    return req;
  }

  async makeCall(dto: MakeCallDto) {
    // save call log
    const user: User = getValue('user');

    const instance = this.repo.create({
      id: dto.sessionId,
      callFromId: user.id,
      callToId: dto.receiverId,
    });

    const resp: CallLog = await this.repo.save(instance);

    return { callId: resp.id };
  }

  async endCall({ sessionId, duration, status }: EndCallDto) {
    const user: User = getValue('user');

    const callLog = await this.repo.findOne({
      where: {
        id: sessionId,
        status: CallLogStatus.Pending,
      },
      select: ['id', 'callFromId', 'callToId'],
    });

    if (
      callLog &&
      (user.id === callLog.callToId || user.id === callLog.callFromId)
    ) {
      this.userGateway.send(
        [user.id === callLog.callToId ? callLog.callFromId : callLog.callToId],
        SocketEvents.END_CALL,
        status === CallLogStatus.Declined,
      );

      this.repo.update(callLog.id, {
        status: status || CallLogStatus.Finished,
        duration,
      });
    }
  }
}
