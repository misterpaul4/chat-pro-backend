import {
  Body,
  Controller,
  Get,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HttpExceptionFilter } from 'src/lib/http-exception.filter';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user-decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  PasswordResetCode,
  ResetPasswordDto,
} from './dto/login-auth.dto';
import { CrudRequestInterceptor } from '@nestjsx/crud';
import {
  ChangePasswordDto,
  EmailChangeDto,
  EmailChangeRequestDto,
} from './dto/index.dto';
import { FirebaseAuthGuard } from '../firebase/auth/auth-guard';
import { FirebaseAuthMetadata } from 'src/lib/decorators/firebase-auth.decorator';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('signup/firebase')
  signupOther() {
    return this.authService.createUserWith3rdParty();
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @FirebaseAuthMetadata('login')
  @UseGuards(FirebaseAuthGuard)
  @Post('login/firebase')
  loginOther() {
    return this.authService.loginWih3rdParty();
  }

  @Post('forgot-password')
  @UseInterceptors(CrudRequestInterceptor)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.password, body.code, body.id);
  }

  @Post('change-password')
  @UseGuards(AuthGuard())
  changePassword(@Body() body: ChangePasswordDto) {
    return this.authService.changePassword(body);
  }

  @Post('email-change-request')
  @UseGuards(AuthGuard())
  changeEmailRequest(@Body() body: EmailChangeRequestDto) {
    return this.authService.changeEmailStep1(body.email);
  }

  @Post('email-change-submit')
  @UseGuards(AuthGuard())
  changeEmail(@Body() body: EmailChangeDto) {
    return this.authService.changeEmailStep2(body);
  }

  @Post('verify-password-reset-code')
  verifyPasswordResetCode(@Body() body: PasswordResetCode) {
    return this.authService.verifyPasswordResetCode(body);
  }

  @Get('get-self')
  @UseGuards(AuthGuard())
  getSelf(@CurrentUser() user: User) {
    return this.authService.getSelf(user.id);
  }
}
