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
import { IJwtPayload, IJwtUser } from './dto/jwt-payload';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
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
          id: user.id,
        });
        const { id, firstName, lastName, middleName, email } = user;
        return {
          token,
          user: { id, firstName, lastName, middleName, email },
        };
      }

      throw new UnauthorizedException('Incorrect email or password');
    }

    throw new NotFoundException('Unauthorized');
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // send password reset email
    return this.mailService.sendMail({
      to: email,
      from: process.env.MAIL_CRED_EMAIL,
      subject: 'Password Reset Request',
      html: `<div>
      <p>
        We have received a request to reset your password associated with your account.

        </p>

        <p>
        Click on the following link to access the password reset page: <a href='google.com'>link</a>
        </p>

        <small>

        You will be redirected to a secure page where you can set a new password.
        If you did not initiate this password reset request, please disregard this email. Your account remains secure, and no changes have been made
      </small>
    </div>
    `,
    });
  }

  verify(payload: string): IJwtUser {
    return this.jwtService.verify(payload);
  }

  private issueToken(payload: IJwtPayload) {
    return this.jwtService.sign(payload);
  }
}
