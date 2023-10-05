import { Module } from '@nestjs/common';
import { AuthProvidersService } from './auth-providers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthProviders } from './entities/auth-providers.entity';

@Module({
  providers: [AuthProvidersService],
  exports: [AuthProvidersService],
  imports: [TypeOrmModule.forFeature([AuthProviders])],
})
export class AuthProvidersModule {}
