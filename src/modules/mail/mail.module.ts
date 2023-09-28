import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          auth: {
            user: process.env.MAIL_CRED_EMAIL,
            pass: process.env.MAIL_CRED_APP_PASS,
          },
          port: 465,
        },
      }),
    }),
  ],
})
export class MailModule {}
