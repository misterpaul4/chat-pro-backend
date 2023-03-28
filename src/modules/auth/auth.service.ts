import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async createUser(values: CreateUserDto) {
    return { values, action: 'sign up' };
  }

  async login(values: LoginDto) {
    return { values, action: 'login' };
  }
}
