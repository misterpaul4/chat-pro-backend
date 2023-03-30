import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';
import { generalCrudOptions } from 'src/utils/crud';

import { BlocklistService } from './blocklist.service';
import { Blocklist } from './entities/blocklist.entity';

@Crud({
  model: {
    type: Blocklist,
  },
  ...generalCrudOptions,
})
@UseGuards(AuthGuard())
@Controller('blocklist')
export class BlocklistController implements CrudController<Blocklist> {
  constructor(public service: BlocklistService) {}
}
