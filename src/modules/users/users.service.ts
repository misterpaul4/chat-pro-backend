import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserContactList } from './entities/user-contactlist';
import { IThreadUsers, UpdateContactsDto } from './dto/user-operations.dto';
import { getValue } from 'express-ctx';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
    private dataSource: DataSource,
  ) {
    super(userRepo);
  }

  async verifyUser(email: string) {
    // check if user exist
    const recipient = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'firstName', 'email'],
    });

    if (!recipient) {
      throw new NotFoundException('User not found');
    }

    return recipient;
  }

  async createOne(
    req: CrudRequest | undefined,
    dto: DeepPartial<User>,
  ): Promise<User> {
    const user = this.userRepo.create(dto);
    const result = await this.userRepo.save(user);

    return { ...result, password: undefined };
  }

  getContacts(
    currentUser: string,
    joinContact = true,
  ): Promise<UserContactList[]> {
    return this.userContactListRepo.find({
      where: { userId: currentUser },
      relations: joinContact ? ['contact'] : [],
    });
  }

  async addToContact(currentUser: string, contactId: string, blocked = false) {
    const contact = this.userContactListRepo.create({
      contactId,
      userId: currentUser,
      blocked,
    });

    try {
      const result = await this.userContactListRepo.save(contact);
      return result;
    } catch (error) {
      this.logger.error({ message: 'Error saving contact', error });
      throw new BadRequestException('Failed to perform action');
    }
  }

  async removeContact(currentUser: string, id: string) {
    // check if user can delete contact
    const contact = await this.userContactListRepo.findOne({
      where: { id, userId: currentUser },
      select: ['id'],
    });

    if (!contact) {
      throw new NotFoundException();
    }

    return this.userContactListRepo.delete(id);
  }

  async updateContacts(payload: UpdateContactsDto) {
    const { contactIds, ...rest } = payload;
    const { id }: User = getValue('user');

    if (!Object.keys(rest).length) {
      throw new BadRequestException('Update values not provided');
    }

    const contacts = await this.userContactListRepo.find({
      where: { id: In(contactIds), userId: id },
    });

    if (!contacts.length) {
      throw new BadRequestException('Invalid contact ids');
    }

    const resp = await this.userContactListRepo
      .createQueryBuilder()
      .update(UserContactList)
      .set(rest)
      .whereInIds(contacts.map((ct) => ct.id))
      .execute();

    return {
      message: `${resp.affected} ${
        resp.affected > 1 ? 'contacts' : 'contact'
      } updated successfully`,
    };
  }

  async getThreadUsers(threadId: string): Promise<Partial<IThreadUsers>[]> {
    try {
      return this.dataSource
        .createQueryBuilder()
        .from('thread_users_user', 'tuu')
        .where('tuu.threadId = :threadId', { threadId })
        .getRawMany();
    } catch (error) {
      this.logger.error({ error, message: 'Error getting thread users' });
      return [];
    }
  }

  async updateSingleUser(id: string, values: Partial<User>) {
    return this.repo.update(id, values);
  }
}
