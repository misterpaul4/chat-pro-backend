import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { AuthProviders } from './entities/auth-providers.entity';

@Injectable()
export class AuthProvidersService {
  constructor(
    @InjectRepository(AuthProviders) private repo: Repository<AuthProviders>,
  ) {}

  findOne(options: FindOneOptions<AuthProviders>) {
    return this.repo.findOne(options);
  }

  createOne(payload: AuthProviders) {
    const instance = this.repo.create(payload);

    return this.repo.save(instance);
  }
}
