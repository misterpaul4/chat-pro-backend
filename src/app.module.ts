import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { ThreadModule } from './modules/thread/thread.module';
import { MailModule } from './modules/mail/mail.module';
import { UserGatewayModule } from './modules/user-gateway/user-gateway.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        let options: TypeOrmModuleOptions = {
          type: 'postgres',
          synchronize: true,
          autoLoadEntities: true,
          url: process.env.DATABASE_URL,
        };

        if (process.env.DEV) {
          options = {
            ...options,
            host: 'localhost',
            database: 'postgres',
            schema: 'chat-pro',
            username: 'postgres',
            password: null,
          };
        }

        return options;
      },
    }),
    AuthModule,
    InboxModule,
    ThreadModule,
    MailModule,
    UserGatewayModule,
  ],
})
export class AppModule {}
