/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableCors();
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
