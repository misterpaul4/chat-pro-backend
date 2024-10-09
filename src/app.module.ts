/* eslint-disable @typescript-eslint/no-var-requires */
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { ThreadModule } from './modules/thread/thread.module';
import { MailModule } from './modules/mail/mail.module';
import { UserGatewayModule } from './modules/user-gateway/user-gateway.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { AuthProvidersModule } from './modules/auth-providers/auth-providers.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          synchronize: true,
          autoLoadEntities: true,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          schema: process.env.DB_SCHEMA,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          port: Number(process.env.DB_PORT),
          ssl: process.env.DB_SSL_CERT
            ? {
                ca: process.env.DB_SSL_CERT,
                rejectUnauthorized: true,
              }
            : undefined,
        };

        return options;
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          FB_SERVICE_ACCOUNT_CRED: process.env.FB_SERVICE_ACCOUNT_CRED,
          JWT_SECRET: process.env.JWT_SECRET,
          JWT_EXPIRY: process.env.JWT_EXPIRY,
        }),
      ],
      envFilePath: '.env',
    }),
    AuthModule,
    InboxModule,
    ThreadModule,
    MailModule,
    UserGatewayModule,
    FirebaseModule,
    AuthProvidersModule,
  ],
})
export class AppModule {}
