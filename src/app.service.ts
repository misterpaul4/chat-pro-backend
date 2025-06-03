import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './modules/users/entities/user.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getHealthCheck() {
    try {
      // Try to fetch one user from the database
      const user = await this.userRepository.findOne({
        select: ['id'],
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running',
        databaseStatus: user ? 'connected' : 'disconnected',
      };
    } catch (error) {
      this.logger.error('Health check failed', error);

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Server is running but database check failed',
        database: {
          status: 'error',
          error: error.message,
        },
      };
    }
  }
}
