import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import { getValue, setValue } from 'express-ctx';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { Logger } from '@firebase/logger';
import { FirebaseService } from '../firebase.service';
import { ExpressKeys } from 'src/utils/enums';
import { AuthProvidersService } from 'src/modules/auth-providers/auth-providers.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-auth',
) {
  private readonly logger = new Logger(FirebaseAuthStrategy.name);

  constructor(
    private firebaseService: FirebaseService,
    private readonly authProviderService: AuthProvidersService,
  ) {
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

    const isFirebaseLogin = getValue(ExpressKeys.firebaseLogin);

    if (isFirebaseLogin) {
      const verifiedUser = await this.authProviderService.findOne({
        where: { providerId: firebaseUser.uid },
        relations: ['user'],
        select: {
          providerId: true,
          id: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      });

      if (!verifiedUser) {
        throw new UnauthorizedException('User not found');
      }

      firebaseUser.user = verifiedUser.user;
    }

    setValue('user', firebaseUser);
    return firebaseUser;
  }
}
