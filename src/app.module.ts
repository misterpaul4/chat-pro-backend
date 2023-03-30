import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RequestsModule } from './modules/requests/requests.module';
import { BlocklistModule } from './modules/blocklist/blocklist.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      synchronize: true,
      autoLoadEntities: true,
      host: 'localhost',
      database: 'postgres',
      schema: 'chat-pro',
      username: 'postgres',
      password: null,
    }),
    AuthModule,
    RequestsModule,
    BlocklistModule,
  ],
})
export class AppModule {}
