import { Controller } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { Crud, CrudController } from '@nestjsx/crud';
import { Request } from './entities/request.entity';
import { generalCrudOptions } from 'src/utils/crud';

@Crud({
  model: {
    type: Request,
  },
  ...generalCrudOptions,
  dto: { create: CreateRequestDto },
  routes: {
    only: ['createManyBase', 'updateOneBase'],
  },
})
@Controller('requests')
export class RequestsController implements CrudController<Request> {
  constructor(public service: RequestsService) {}
}
