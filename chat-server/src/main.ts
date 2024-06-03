import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Boots up the application by creating the NestFactory and listening on port 3001.
 * @returns {Promise<void>} A promise that resolves when the application is successfully bootstrapped.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
}
bootstrap();
