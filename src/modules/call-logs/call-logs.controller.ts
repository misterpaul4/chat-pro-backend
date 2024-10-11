import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';
import { generalCrudOptions } from 'src/utils/crud';
import { CallLog } from './call-logs.entity';
import { CallLogService } from './call-logs.service';
import { MakeCallDto } from './call-logs.dto';

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

  @Post('make-call')
  makeCall(@Body() dto: MakeCallDto) {
    return this.service.makeCall(dto);
  }
}
