import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, Repository, DataSource } from 'typeorm';
import { BlockUserDto } from './dto/user-operations.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly datasource: DataSource,
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

  block(currentUser: string, blockList: BlockUserDto['userIds']) {
    const values = blockList.map((blocked_userId) => ({
      userId: currentUser,
      blocked_userId,
    }));

    // prevent users from blocking themselves
    const _blockList = values.filter((v) => v.blocked_userId !== currentUser);

    return this.userRepo
      .createQueryBuilder()
      .insert()
      .into('users_blocked_list')
      .values(_blockList)
      .orIgnore()
      .execute();
  }

  unblock(currentUser: string, unBlockList: BlockUserDto['userIds']) {
    return this.userRepo
      .createQueryBuilder()
      .delete()
      .from('users_blocked_list')
      .where('userId = :currentUser', { currentUser })
      .andWhere('blocked_userId IN (:...unBlockList)', { unBlockList })
      .execute();
  }

  async sendRequest(currentUser: string, receiverId: string) {
    // check block list
    const blocked = await this.checkBlockList(currentUser, receiverId);

    if (blocked) {
      this.logger.warn({
        error: 'request error, user in blockedlist',
        data: { currentUser, receiverId },
      });
      throw new ForbiddenException('You cannot send request to this user');
    }

    try {
      // send request
      await this.userRepo
        .createQueryBuilder()
        .insert()
        .into('users_chat_requests')
        .values([{ senderId: currentUser, receiverId: receiverId }])
        .execute();
    } catch (error) {
      this.logger.error('error sending request');
      throw new BadRequestException({ message: 'Request unsuccessful' });
    }

    return { message: 'Your request was sent successfully' };
  }

  private async checkBlockList(userId: string, blocked_userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
      select: ['id'],
    });

    return user.blockedUsers.find((u) => u.id === blocked_userId);
  }
}
