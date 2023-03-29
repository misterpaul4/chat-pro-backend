import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HttpExceptionFilter } from 'src/lib/http-exception.filter';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user-decorator';
import { LoginDto } from './dto/login-auth.dto';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('get-self')
  @UseGuards(AuthGuard())
  getSelf(@CurrentUser() user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}
