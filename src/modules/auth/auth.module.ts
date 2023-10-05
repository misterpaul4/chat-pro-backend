import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JWT_EXPIRY, JWT_SECRET } from 'src/settings';
import { JwtStrategy } from './jwt-strategy';
import { MailModule } from '../mail/mail.module';
import { AuthProvidersModule } from '../auth-providers/auth-providers.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, AuthService],
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: JWT_EXPIRY,
      },
    }),
    MailModule,
    AuthProvidersModule,
  ],
})
export class AuthModule {}
