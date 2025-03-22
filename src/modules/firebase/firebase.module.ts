import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthStrategy } from './auth/auth-strategy';
import { AuthProvidersModule } from '../auth-providers/auth-providers.module';

@Module({
  providers: [FirebaseService, FirebaseAuthStrategy],
  exports: [FirebaseService, FirebaseAuthStrategy],
  imports: [AuthProvidersModule],
})
export class FirebaseModule {}
