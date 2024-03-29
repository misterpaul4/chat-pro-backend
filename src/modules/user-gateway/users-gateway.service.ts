import { Injectable, Logger } from '@nestjs/common';
import { UsersGateway } from './users.gateway';
import { DataSource } from 'typeorm';
import { UserContactList } from '../users/entities/user-contactlist';

@Injectable()
export class UsersGatewayService {
  private readonly logger = new Logger(UsersGatewayService.name);

  constructor(
    private readonly gatewayService: UsersGateway,
    private dataSource: DataSource,
  ) {}

  async getOnlineContacts(currentUser: string): Promise<string[]> {
    const contactList: { uc_contactId: string }[] = await this.dataSource
      .createQueryBuilder()
      .from(UserContactList, 'uc')
      .where('uc.userId = :currentUser', { currentUser })
      .select('uc.contactId')
      .getRawMany();

    return this.gatewayService.getOnlineContacts(
      contactList.map((ct) => ct.uc_contactId),
    );
  }
}
