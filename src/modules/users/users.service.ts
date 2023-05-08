import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { StatusEnum } from './dto/user-operations.dto';
import { User } from './entities/user.entity';
import { UserChatRequests } from './entities/user-chat-requests';
import { UserBlockList } from './entities/user-blocklist';
import { UserContactList } from './entities/user-contactlist';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserChatRequests)
    private userChatRequestsRepo: Repository<UserChatRequests>,
    @InjectRepository(UserBlockList)
    private userBlockListRepo: Repository<UserBlockList>,
    @InjectRepository(UserContactList)
    private userContactListRepo: Repository<UserContactList>,
  ) {
    super(userRepo);
  }

  async verifyRequest(email: string) {
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
    // prevent users from blocking themselves
    // const list = blockList.filter((userId) => userId !== currentUser);

    // const values = list.map((blockedUserId) => ({
    //   userId: currentUser,
    //   blockedUserId,
    // }));

    // const response = await this.userRepo
    //   .createQueryBuilder()
    //   .insert()
    //   .into(UserBlockList)
    //   .values(values)
    //   .orIgnore()
    //   .execute();

    // const totalBlocked = response.raw.length;

    // return {
    //   message: `${totalBlocked} ${
    //     totalBlocked === 1 ? 'user' : 'users'
    //   } blocked`,
    // };
    return this.blockUnblock(currentUser, blockList, 'block');
  }

  async unblock(currentUser: string, unBlockList: string[]) {
    // const response = await this.userRepo
    //   .createQueryBuilder()
    //   .delete()
    //   .from(UserBlockList)
    //   .where('userId = :currentUser', { currentUser })
    //   .andWhere('blockedUserId IN (:...unBlockList)', { unBlockList })
    //   .execute();

    // const totalUnBlocked = response.raw.length;

    // return {
    //   message: `${totalUnBlocked} ${
    //     totalUnBlocked === 1 ? 'user' : 'users'
    //   } unblocked`,
    // };
    return this.blockUnblock(currentUser, unBlockList, 'unblock');
  }

  async sendRequest(currentUser: string, payload: UserChatRequests) {
    // user cannot send request to themselves
    if (currentUser === payload.receiverId) {
      throw new BadRequestException('You cannot send a request to yourself');
    }

    // check block list
    const userIsBlocked = await this.checkBlockList(
      currentUser,
      payload.receiverId,
    );

    if (userIsBlocked) {
      throw new BadRequestException('You cannot send this user a request');
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
      // add to contact
      await this.addToContact(currentUser, payload.receiverId);
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
      where: { receiverId: currentUser, status: StatusEnum.Pending },
      relations: ['sender'],
    });
  }

  async getSentRequests(currentUser: string) {
    return this.userChatRequestsRepo.find({ where: { senderId: currentUser } });
  }

  async approveRequest(currentUser: string, id: string) {
    // check if request can be approved by user
    const request = await this.userChatRequestsRepo.findOne({
      where: { id, receiverId: currentUser },
    });

    if (!request) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }

    // update request
    await this.userChatRequestsRepo.update(id, {
      status: StatusEnum.Approved,
    });

    // add to contact
    return this.addToContact(currentUser, request.senderId);
  }

  async declineRequest(currentUser: string, id: string) {
    // check if request can be declined by user
    const request = await this.userChatRequestsRepo.findOne({
      where: { id, receiverId: currentUser },
    });

    if (!request) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }

    // update request
    await this.userChatRequestsRepo.update(id, {
      status: StatusEnum.Rejected,
    });

    // add to contact
    return this.addToContact(currentUser, request.senderId, true);
  }

  getContacts(currentUser: string) {
    return this.userContactListRepo.find({
      where: { userId: currentUser },
      relations: ['contact'],
    });
  }

  async getContactInbox(currentUser: string) {
    return this.userContactListRepo
      .createQueryBuilder('ct')
      .innerJoinAndSelect('ct.contact', 'contact')
      .innerJoinAndSelect('contact.sentMessages', 'sentMessages')
      .innerJoinAndSelect('contact.receivedMessages', 'receivedMessages')
      .where('ct.userId = :currentUser', { currentUser })
      .andWhere('receivedMessages.senderId = :currentUser', { currentUser })
      .andWhere('sentMessages.receiverId = :currentUser', { currentUser })
      .orderBy('sentMessages.createdAt', 'DESC')
      .addOrderBy('receivedMessages.createdAt', 'DESC')
      .getMany();
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

  private checkBlockList(userId: string, blockedUserId: string) {
    // return this.userBlockListRepo.findOne({
    //   where: { blockedUserId, userId },
    //   select: ['id'],
    // });
    return this.userContactListRepo.findOne({
      where: { userId, contactId: blockedUserId, blocked: true },
    });
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
