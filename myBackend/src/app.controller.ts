import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Simple liveness/readiness endpoint used by uptime checks. */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
