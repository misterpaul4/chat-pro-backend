import { Module } from '@nestjs/common';
import { BlocklistService } from './blocklist.service';
import { BlocklistController } from './blocklist.controller';
import { Blocklist } from './entities/blocklist.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [BlocklistController],
  providers: [BlocklistService],
  imports: [TypeOrmModule.forFeature([Blocklist]), AuthModule],
})
export class BlocklistModule {}
