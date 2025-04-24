import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running',
    };
  }
}
