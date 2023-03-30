import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
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

  async acceptRequest(requestId: string, currentUserId: string) {
    // check if request belongs to owner
    await this.validate(requestId, currentUserId);

    return this.requestRepo.update(requestId, {
      accepted: true,
    });
  }

  async sendRequest(req: CrudRequest, payload: Request) {
    // user cannot send request to themselves
    if (payload.senderId === payload.receiverId) {
      throw new BadRequestException();
    }
    // check pending request
    await this.validatePendingRequest(payload.senderId, payload.receiverId);

    // check block list

    return this.createOne(req, payload);
  }

  private async validatePendingRequest(senderId: string, receiverId: string) {
    const request = await this.requestRepo.findOne({
      where: { receiverId, senderId },
    });

    if (request) {
      throw new NotAcceptableException('You have a pending request');
    }
  }

  private async validate(id: string, currentUserId: string): Promise<Request> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException();
    }

    if (request.receiverId !== currentUserId) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }
    return request;
  }
}
