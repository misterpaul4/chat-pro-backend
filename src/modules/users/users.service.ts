import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserContactList } from './entities/user-contactlist';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
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

  async block(currentUser: string, blockList: string[]) {
    return this.blockUnblock(currentUser, blockList, 'block');
  }

  async unblock(currentUser: string, unBlockList: string[]) {
    return this.blockUnblock(currentUser, unBlockList, 'unblock');
  }

  getContacts(currentUser: string) {
    return this.userContactListRepo.find({
      where: { userId: currentUser },
      relations: ['contact'],
    });
  }

  async contactGuard(
    currentUser: string,
    contactId: string,
    errorMessage = 'Error while performing request',
  ) {
    try {
      const contact = await this.userContactListRepo.findOneOrFail({
        where: { userId: currentUser, contactId, blocked: false },
        select: ['id'],
      });

      return contact;
    } catch (error) {
      this.logger.error({ errorMessage, error });
      throw new BadRequestException({ error: errorMessage });
    }
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

  private async blockUnblock(
    currentUser: string,
    _list: string[],
    type: 'block' | 'unblock',
  ) {
    const getContacts = await this.userContactListRepo.find({
      where: { id: In(_list), userId: currentUser },
    });

    const config =
      type === 'block'
        ? { block: true, text: 'blocked' }
        : { block: false, text: 'unblocked' };

    // make sure user can block or unblock these contacts and also not block themselves
    const currentUserContacts = getContacts.filter(
      (contact) =>
        contact.contactId !== currentUser && !contact.blocked == config.block,
    );
    const list = currentUserContacts.map((contact) => contact.id);

    if (list.length) {
      const response = await this.userContactListRepo
        .createQueryBuilder()
        .update(UserContactList)
        .set({ blocked: config.block })
        .whereInIds(list)
        .execute();

      const totalBlocked = response.affected;

      return {
        message: `${totalBlocked} ${totalBlocked === 1 ? 'user' : 'users'} ${
          config.text
        }`,
      };
    }

    return { message: `No user was ${config.text}` };
  }
}
