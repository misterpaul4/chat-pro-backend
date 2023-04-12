import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BlockUserDto, StatusEnum } from './dto/user-operations.dto';
import { User } from './entities/user.entity';
import { UserChatRequests } from './entities/user-chat-requests';
import { UserBlockList } from './entities/user-blocklist';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserChatRequests)
    private userChatRequestsRepo: Repository<UserChatRequests>,
    @InjectRepository(UserBlockList)
    private userBlockListRepo: Repository<UserBlockList>,
  ) {
    super(userRepo);
  }

  createOne(
    req: CrudRequest | undefined,
    dto: DeepPartial<User>,
  ): Promise<User> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async block(currentUser: string, blockList: BlockUserDto['userIds']) {
    // prevent users from blocking themselves
    const list = blockList.filter((userId) => userId !== currentUser);

    const values = list.map((blockedUserId) => ({
      userId: currentUser,
      blockedUserId,
    }));

    const response = await this.userRepo
      .createQueryBuilder()
      .insert()
      .into(UserBlockList)
      .values(values)
      .orIgnore()
      .execute();

    const totalBlocked = response.raw.length;

    return {
      message: `${totalBlocked} ${
        totalBlocked === 1 ? 'user' : 'users'
      } blocked`,
    };
  }

  async unblock(currentUser: string, unBlockList: BlockUserDto['userIds']) {
    const response = await this.userRepo
      .createQueryBuilder()
      .delete()
      .from(UserBlockList)
      .where('userId = :currentUser', { currentUser })
      .andWhere('blockedUserId IN (:...unBlockList)', { unBlockList })
      .execute();

    const totalUnBlocked = response.raw.length;

    return {
      message: `${totalUnBlocked} ${
        totalUnBlocked === 1 ? 'user' : 'users'
      } unblocked`,
    };
  }

  async sendRequest(currentUser: string, payload: UserChatRequests) {
    // check block list
    const userIsBlocked = await this.checkBlockList(
      currentUser,
      payload.receiverId,
    );

    if (userIsBlocked) {
      throw new BadRequestException('This user is blocked');
    }

    // save request
    const instance = this.userChatRequestsRepo.create({
      ...payload,
      senderId: currentUser,
    });

    const pendingRequestErrorMessage =
      'You already have a request with this user';

    // check if pending requests from receiver
    const hasPendingRequest = await this.userChatRequestsRepo.findOne({
      where: { senderId: payload.receiverId, receiverId: currentUser },
    });

    if (hasPendingRequest) {
      throw new BadRequestException(pendingRequestErrorMessage);
    }

    try {
      const response = await this.userChatRequestsRepo.save(instance);
      return response;
    } catch (error) {
      const message = 'error sending message request';
      this.logger.error({
        error,
        message,
        payload: instance,
      });
      throw new BadRequestException(pendingRequestErrorMessage);
    }
  }

  async getRequests(currentUser: string) {
    return this.userChatRequestsRepo.find({
      where: { receiverId: currentUser },
    });
  }

  async getSentRequests(currentUser: string) {
    return this.userChatRequestsRepo.find({ where: { senderId: currentUser } });
  }

  async approveRequest(currentUser: string, id: string) {
    // check if request can be approved by user
    const request = this.userChatRequestsRepo.findOne({
      where: { id, receiverId: currentUser },
    });

    if (!request) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }

    return this.userChatRequestsRepo.update(id, {
      status: StatusEnum.Approved,
    });
  }

  private checkBlockList(userId: string, blockedUserId: string) {
    return this.userBlockListRepo.findOne({
      where: { blockedUserId, userId },
      select: ['id'],
    });
  }
}
