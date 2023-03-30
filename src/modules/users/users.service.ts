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
    return this.userRepo
      .createQueryBuilder()
      .insert()
      .into('users_blocked_list')
      .values(values)
      .orIgnore()
      .execute();
  }
}
