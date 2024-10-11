import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './call-logs.entity';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { MakeCallDto } from './call-logs.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { CallLogStatus, CallLogType } from './enum';
@Injectable()
export class CallLogService extends TypeOrmCrudService<CallLog> {
  private readonly logger = new Logger(CallLogService.name);

  constructor(
    @InjectRepository(CallLog) public repo: Repository<CallLog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super(repo);
  }

  getMany(
    req: CrudRequest,
  ): Promise<CallLog[] | GetManyDefaultResponse<CallLog>> {
    return super.getMany(req);
  }

  getOne(req: CrudRequest): Promise<CallLog> {
    return super.getOne(req);
  }

  async storePeerId(peerId: string) {
    const user: User = getValue('user');
    await this.cacheManager.set(this.getPeerKey(user.id), peerId, { ttl: 60 * 60 * 24 });

    return peerId;
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

    await this.repo.save({
      callFromId: user.id,
      callToId: dto.receiverId
    }).catch((error) => {
      this.logger.error({ message: 'Error saving call log', error })
    })

    return peerId;
  }

  async endCall(receiverId: string, duration: number) {
    const user: User = getValue('user');

    const callLog = await this.repo.findOne({ where: { callFromId: user.id, callToId: receiverId }, select: ['id'] })

    if (callLog) {
      await this.repo.update(callLog.id, { status: CallLogStatus.Finished, duration })
    }
  }
}
