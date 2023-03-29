import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from './dto/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async createUser(values: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    values.password = await bcrypt.hash(values.password, salt);

    return this.userService.createOne(undefined, values);
  }

  async login(values: LoginDto) {
    const user = await this.userService.findOne({
      where: {
        email: values.email,
      },
    });

    if (user) {
      const validPassword = await bcrypt.compare(
        values.password,
        user.password,
      );

      // valid user
      if (validPassword) {
        const token = await this.issueToken({
          email: user.email,
        });
        return { token };
      }

      throw new UnauthorizedException('Incorrect email or password');
    }

    throw new NotFoundException('Unauthorized');
  }

  private issueToken(payload: IJwtPayload) {
    return this.jwtService.sign(payload);
  }
}
