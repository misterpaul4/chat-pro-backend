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
import { ChangePasswordDto, EmailChangeDto } from './dto/index.dto';
import { getValue } from 'express-ctx';
import { AuthProvidersService } from '../auth-providers/auth-providers.service';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly authProviderService: AuthProvidersService,
  ) {}

  async createUser(values: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    values.password = await bcrypt.hash(values.password, salt);

    return this.userService.createOne(undefined, values);
  }

  async createUserWith3rdParty() {
    const firebaseUser: DecodedIdToken = getValue('user');

    const name = firebaseUser.name.split(' ');
    const firstName = name[0];
    const lastName = name[name.length - 1];

    const user = await this.userService.createOne(undefined, {
      email: firebaseUser.email,
      has3rdPartyAuth: true,
      firstName,
      lastName,
    });

    await this.authProviderService.createOne({
      providerId: firebaseUser.uid,
      name: firebaseUser.firebase.sign_in_provider,
      userId: user.id,
      extraData: {
        photo: firebaseUser.picture,
        emailVerified: firebaseUser.email_verified,
      },
    });

    user.password = undefined;

    const token = this.issueToken({
      email: firebaseUser.email,
      id: user.id,
    });

    return {
      token,
      user,
    };
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
        const { id, firstName, lastName, middleName, email, has3rdPartyAuth } =
          user;
        return {
          token,
          user: {
            id,
            firstName,
            lastName,
            middleName,
            email,
            has3rdPartyAuth,
            hasPassword: !!user.password,
          },
        };
      }

      throw new UnauthorizedException('Incorrect email or password');
    }

    throw new NotFoundException('Unauthorized');
  }

  async loginWih3rdParty() {
    const firebaseUser: DecodedIdToken = getValue('user');

    const { id, firstName, lastName, email } = firebaseUser.user;

    const token = this.issueToken({
      email: firebaseUser.email,
      id,
    });

    return {
      token,
      user: { id, firstName, lastName, email },
    };
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

  async sendEmailCode(
    getEmailContent: (code: number) => [string, string],
    email: string,
    userId: string,
  ) {
    const verificationCode = generateRandomNumber(6);

    const [subject, content] = getEmailContent(verificationCode);

    try {
      await this.mailService.sendMail({
        to: email,
        from: process.env.MAIL_CRED_EMAIL,
        subject,
        html: content,
      });

      const update = await this.userService.updateSingleUser(userId, {
        verifCode: verificationCode.toString(),
        verifCodeCreatedAt: new Date(),
      });

      return update;
    } catch (error) {
      await this.userService.updateSingleUser(userId, {
        verifCode: null,
      });

      throw new BadRequestException('Your request could not be completed');
    }
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

    await this.sendEmailCode(
      (verificationCode) => [
        'Password Reset Request',
        `<div>
      <p>
        Hi ${user.firstName}, We have received a request to reset the password associated with your account.
        </p>

        <p>
        The verification code for your request is <strong>${verificationCode}</strong>
        </p>
        <p>
        If you did not initiate this request, please disregard this email. Your account remains secure, and no changes have been made
      </p>
    </div>`,
      ],
      user.email,
      user.id,
    );

    return { id: user.id };
  }

  async changeEmailStep1(email: string) {
    const user: User = getValue('user');

    const emailExist = await this.userService.findOne({ where: { email } });

    if (emailExist) {
      throw new BadRequestException('This email cannot be used');
    }

    const resp = await this.sendEmailCode(
      (code: number) => [
        'Email Change Request',
        `<div>
    <p>
     Hi ${user.firstName}, We have received a request to change the email address associated with your account. To ensure the security of your account, we require a verification step to complete this process.
    </p>

   <p>
   Please find below a 6-digit verification code that you will need to enter in the app to verify your email change:
   </p>

   <p>
   Verification Code: <strong>${code}</strong>
   </p>

   <p>
     <em>If you did not initiate this email change request, please disregard this email and ensure the security of your account by changing your password immediately.</em>
   </p>
   </div>`,
      ],
      email,
      user.id,
    );

    if (!resp) {
      throw new BadRequestException('Request not completed');
    }

    return { email };
  }

  async changeEmailStep2(payload: EmailChangeDto) {
    const user: User = getValue('user');

    const value = await this.verifyPasswordResetCode({
      code: payload.code,
      id: user.id,
    });

    await this.userService.updateSingleUser(user.id, {
      email: payload.email,
      lastEmailChangeDate: new Date(),
    });

    const token = this.issueToken({ email: payload.email, id: user.id });

    return { ...value, email: payload.email, token };
  }

  async changePassword(payload: ChangePasswordDto) {
    const _user: User = getValue('user');
    const user = await this.userService.findOne({
      where: { id: _user.id },
      select: ['password'],
    });

    const addPassword = async () => {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(payload.newPassword, salt);
      await this.userService.updateSingleUser(_user.id, {
        password: hashPassword,
        lastPasswordChangeDate: new Date(),
      });

      return { message: 'Password reset successful' };
    };

    if (user.password) {
      if (!payload.oldPassword) {
        throw new BadRequestException('Old password is required');
      }

      const passwordIsValid = await bcrypt.compare(
        payload.oldPassword,
        user.password,
      );

      if (passwordIsValid) {
        return addPassword();
      }

      throw new BadRequestException('Old password is not correct');
    }

    return addPassword();
  }

  async getSelf(id: string) {
    const user = await this.userService.findOne({
      where: { id },
      select: [
        'firstName',
        'lastName',
        'email',
        'id',
        'has3rdPartyAuth',
        'password',
        'middleName',
        'createdAt',
        'updatedAt',
      ],
    });

    return { hasPassword: !!user.password, ...user, password: undefined };
  }

  verify(payload: string): IJwtUser {
    return this.jwtService.verify(payload);
  }

  private issueToken(payload: IJwtPayload) {
    return this.jwtService.sign(payload);
  }
}
