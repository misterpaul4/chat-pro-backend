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
import { generateRandomNumber } from 'src/utils/string';
import { User } from '../users/entities/user.entity';
import { EmailChangeDto } from './dto/index.dto';
import { getValue } from 'express-ctx';

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

  async resetPassword(password: string, code: string, id: string) {
    const user = await this.verifyPasswordResetCode({ code, id });

    const salt = await bcrypt.genSalt();
    password = await bcrypt.hash(password, salt);

    await this.userService.updateSingleUser(id, {
      password,
      verifCode: null,
      verifCodeCreatedAt: null,
    });

    const token = await this.issueToken({
      email: user.email,
      id,
    });

    const { firstName, lastName, middleName, email } = user;

    return {
      token,
      user: { id, firstName, lastName, middleName, email },
    };
  }

  async verifyPasswordResetCode(param: PasswordResetCode): Promise<User> {
    const { code, id } = param;
    const user = await this.userService.findOne({
      where: { id },
    });

    // check if code is still valid
    const date = new Date(user.verifCodeCreatedAt);
    const now = new Date();
    const timeDifference = now.getTime() - date.getTime();
    const oneHourInMilliseconds = 60 * 60 * 1000;

    if (!user || timeDifference > oneHourInMilliseconds) {
      throw new BadRequestException('Invalid Request');
    }

    if (user.verifCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    return {
      ...user,
      password: undefined,
      verifCode: undefined,
      verifCodeCreatedAt: undefined,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationCode = generateRandomNumber(6);

    await this.userService.updateSingleUser(user.id, {
      verifCode: verificationCode.toString(),
      verifCodeCreatedAt: new Date(),
    });

    const emailContent = `<div>
    <p>
      We have received a request to reset the password associated with your account.
      </p>

      <p>
      The verification code for your request is <strong>${verificationCode}</strong>
      </p>
      <p>
      If you did not initiate this request, please disregard this email. Your account remains secure, and no changes have been made
    </p>
  </div>`;

    // send password reset email
    try {
      await this.mailService.sendMail({
        to: email,
        from: process.env.MAIL_CRED_EMAIL,
        subject: 'Password Reset Request',
        html: emailContent,
      });
    } catch (error) {
      await this.userService.updateSingleUser(user.id, {
        verifCode: null,
      });

      throw new BadRequestException('Your request could not be completed');
    }

    return { id: user.id };
  }

  async changeEmail(payload: EmailChangeDto) {
    const user: User = getValue('user');

    if (user.email.toLowerCase() === payload.email.toLowerCase()) {
      throw new BadRequestException(
        'New email cannot be same as current email',
      );
    }

    await this.verifyPasswordResetCode({
      code: payload.code,
      id: user.id,
    });

    return this.userService.updateSingleUser(user.id, {
      email: payload.email,
      lastEmailChangeDate: new Date(),
    });
  }

  verify(payload: string): IJwtUser {
    return this.jwtService.verify(payload);
  }

  private issueToken(payload: IJwtPayload) {
    return this.jwtService.sign(payload);
  }
}
