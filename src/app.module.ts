import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { ThreadModule } from './modules/thread/thread.module';
import { MailModule } from './modules/mail/mail.module';
import { UserGatewayModule } from './modules/user-gateway/user-gateway.module';

const dbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  synchronize: true,
  autoLoadEntities: true,
  host: 'localhost',
  database: 'postgres',
  schema: 'chat-pro',
  username: 'postgres',
  password: null,
  url: process.env.DATABASE_URL,
};

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRootAsync({ useFactory: () => dbConfig }),
    AuthModule,
    InboxModule,
    ThreadModule,
    MailModule,
    UserGatewayModule,
  ],
})
export class AppModule {}
