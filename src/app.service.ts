import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getHealthCheck() {
    try {
      await this.dataSource.query('SELECT 1'); // Check database connectivity

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running',
        databaseStatus: 'connected',
      };
    } catch (error) {
      this.logger.error('Health check failed', error);

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Server is running but database check failed',
        databaseStatus: 'error',
        error: error.message,
      };
    }
  }
}
