import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';

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
  ],
})
export class AppModule {}
