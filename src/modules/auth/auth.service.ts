import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto, PasswordResetCode } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload, IJwtUser } from './dto/jwt-payload';
import { MailService } from '../mail/mail.service';
import { getValue } from 'express-ctx';
import { User } from '../users/entities/user.entity';
import { generateRandomNumber } from 'src/utils/string';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

  async resetPassword(password: string) {
    //
  }

  async verifyPasswordResetCode(param: PasswordResetCode) {
    const { code, id } = param;
    const user = await this.userService.findOne({
      where: { id, verifCode: code },
      select: ['id', 'verifCode', 'verifCodeCreatedAt'],
    });

    if (!user) {
      throw new BadRequestException('Invalid Request');
    }

    // check if code is still valid
    const date = new Date(user.verifCodeCreatedAt);
    const now = new Date();
    const timeDifference = now.getTime() - date.getTime();
    const oneHourInMilliseconds = 60 * 60 * 1000;

    return timeDifference < oneHourInMilliseconds;
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

    const verificationCode = generateRandomNumber(6);

    await this.userService.updateSingleUser(user.id, {
      verifCode: verificationCode.toString(),
      verifCodeCreatedAt: new Date(),
    });

    const emailContent = `<div>
    <p>
      We have received a request to reset your password associated with your account.
      </p>

      <p>
      The verification code for your request is <strong>${verificationCode}</strong>
      </p>
      <small>
      If you did not initiate this password reset request, please disregard this email. Your account remains secure, and no changes have been made
    </small>
  </div>`;

    // send password reset email
    await this.mailService.sendMail({
      to: email,
      from: process.env.MAIL_CRED_EMAIL,
      subject: 'Password Reset Request',
      html: emailContent,
    });

    return user.id;
  }

  verify(payload: string): IJwtUser {
    return this.jwtService.verify(payload);
  }

  private issueToken(payload: IJwtPayload) {
    return this.jwtService.sign(payload);
  }
}
