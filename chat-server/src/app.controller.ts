import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Returns a greeting message.
 * @returns The greeting message as a string.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
