import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    {
      bodyParser: false
    }
  );

  const webOrigin = (
    process.env.WEB_ORIGIN?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    'http://localhost:3001'
  ).replace(/\/$/, '');

  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  await app.listen(3000, '0.0.0.0');
  console.log(`Server is running on port ${3000}! :)`);
}
void bootstrap();
