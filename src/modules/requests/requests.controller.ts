import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import {
  Crud,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  ParsedRequest,
} from '@nestjsx/crud';
import { Request } from './entities/request.entity';
import { generalCrudOptions } from 'src/utils/crud';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user-decorator';
import { User } from '../users/entities/user.entity';

@Crud({
  model: {
    type: Request,
  },
  ...generalCrudOptions,
  routes: { only: ['getManyBase'] },
})
@Controller('requests')
@UseGuards(AuthGuard())
export class RequestsController implements CrudController<Request> {
  constructor(public service: RequestsService) {}

  @Post('accept/:id')
  acceptRequest(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.service.acceptRequest(id, currentUser.id);
  }

  @UseInterceptors(CrudRequestInterceptor)
  @Post('send')
  sendRequest(
    @CurrentUser() sender: User,
    @Body() body: Request,
    @ParsedRequest() req: CrudRequest,
  ) {
    return this.service.sendRequest(req, {
      ...body,
      senderId: sender.id,
    });
  }
}
