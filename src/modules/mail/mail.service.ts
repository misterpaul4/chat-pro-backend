import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  sendMail(payload: ISendMailOptions) {
    return this.mailerService.sendMail(payload);
  }
}
