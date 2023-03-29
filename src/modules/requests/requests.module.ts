import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { Request } from './entities/request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService],
  imports: [TypeOrmModule.forFeature([Request])],
})
export class RequestsModule {}
