import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user-decorator';
import { User } from '../users/entities/user.entity';
import { UsersGatewayService } from './users-gateway.service';

@Controller()
@UseGuards(AuthGuard())
export class UserGatewayController {
  constructor(private presetsService: UsersGatewayService) {}

  @Get('users/online-contacts')
  getOnlineContacts(@CurrentUser() user: User) {
    return this.presetsService.getOnlineContacts(user.id);
  }
}
