import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { setValue } from 'express-ctx';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { IJwtPayload } from './dto/jwt-payload';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService, configService: ConfigService) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate({ email }: IJwtPayload) {
    const user = await this.userService.findOne({
      where: { email },
      select: [
        'createdAt',
        'email',
        'firstName',
        'lastName',
        'middleName',
        'updatedAt',
        'id',
      ],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    setValue('user', user);

    return user;
  }
}
