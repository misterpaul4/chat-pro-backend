import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthStrategy } from './auth/auth-strategy';

@Module({
  providers: [FirebaseService, FirebaseAuthStrategy],
  exports: [FirebaseService],
})
export class FirebaseModule {}
