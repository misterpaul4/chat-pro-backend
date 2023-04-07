import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BlockUserDto } from './dto/user-operations.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {
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
}
