import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';
import { generalCrudOptions } from 'src/utils/crud';
import { CallLog } from './call-logs.entity';
import { CallLogService } from './call-logs.service';
import { EndCallDto, MakeCallDto } from './call-logs.dto';
import { CurrentUser } from '../auth/current-user-decorator';
import { User } from '../users/entities/user.entity';

@Crud({
  model: {
    type: CallLog,
  },
  ...generalCrudOptions,
  query: {
    ...generalCrudOptions.query,
    exclude: ['password'],
    join: {
      callFrom: {
        eager: false,
      },
      callTo: {
        eager: false,
      },
    },
  },
  routes: {
    only: ['getManyBase', 'getOneBase'],
  },
})
@Controller('call-logs')
@UseGuards(AuthGuard())
export class CallLogController implements CrudController<CallLog> {
  constructor(public service: CallLogService) {}

  @Post('call/make-call')
  makeCall(@Body() dto: MakeCallDto) {
    return this.service.makeCall(dto);
  }

  @Post('call/end-call')
  endCall(@Body() dto: EndCallDto) {
    return this.service.endCall(dto);
  }

  @Post('call/initialize/:id')
  initialize(@Param('id') id: string) {
    return this.service.storePeerId(id);
  }

  @Get('call/get-peer')
  getPeer(@CurrentUser() user: User) {
    return this.service.getPeerId(user.id);
  }
}
