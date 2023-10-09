import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ExpressKeys, MetadataKeys } from 'src/utils/enums';
import { setValue } from 'express-ctx';

@Injectable()
export class FirebaseAuthGuard
  extends AuthGuard('firebase-auth')
  implements CanActivate
{
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const metadata = this.reflector.getAllAndOverride(
      MetadataKeys.firebaseAuth,
      [context.getClass(), context.getHandler()],
    );

    if (metadata) {
      setValue(ExpressKeys.firebaseLogin, metadata);
    }

    return super.canActivate(context);
  }
}
