import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async storePeerId(peerId: string) {
    const user: User = getValue('user');
    await this.cacheManager.set(this.getPeerKey(user.id), peerId, {
      ttl: 60 * 60 * 24,
    });

    return { peerId };
  }

  removePeerId() {
    const user: User = getValue('user');
    this.cacheManager.del(this.getPeerKey(user.id));
  }

  async getPeerId(userId: string) {
    return this.cacheManager.get(this.getPeerKey(userId));
  }

  private getPeerKey(userId: string) {
    return `peer-${userId}`;
  }

  async makeCall(dto: MakeCallDto) {
    const peerId = await this.getPeerId(dto.receiverId);

    if (!peerId) {
      throw new NotFoundException('Peer not found');
    }

    // save call log
    const user: User = getValue('user');

    const instance = this.repo.create({
      id: dto.sessionId,
      callFromId: user.id,
      callToId: dto.receiverId,
    });

    const resp: CallLog = await this.repo.save(instance);

    return { peerId, callId: resp.id };
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
