import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  public fireBaseApp: admin.app.App;

  constructor(configService: ConfigService) {
    if (admin.apps.length === 0) {
      try {
        const cert = JSON.parse(configService.get('FB_SERVICE_ACCOUNT_CRED'));
        this.fireBaseApp = admin.initializeApp({
          credential: admin.credential.cert(cert),
        });
        this.logger.log('Successfully initialized firebaseAdmin');
      } catch (e) {
        this.logger.error(
          {
            message: 'Error initializing firebase Exiting...',
            errorMessage: e.message,
          },
          e.stack,
        );
      }
    }
  }
}
