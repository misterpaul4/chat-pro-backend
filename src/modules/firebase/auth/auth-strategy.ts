import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import { setValue } from 'express-ctx';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { Logger } from '@firebase/logger';
import { FirebaseService } from '../firebase.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-auth',
) {
  private readonly logger = new Logger(FirebaseAuthStrategy.name);

  constructor(private firebaseService: FirebaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }
  async validate(token: string) {
    const firebaseUser: DecodedIdToken = await this.firebaseService.fireBaseApp
      .auth()
      .verifyIdToken(token)
      .catch((err) => {
        this.logger.error(err);
        throw new UnauthorizedException('Invalid Token');
      });
    if (!firebaseUser) {
      throw new UnauthorizedException();
    }

    setValue('user', firebaseUser);
    return firebaseUser;
  }
}
