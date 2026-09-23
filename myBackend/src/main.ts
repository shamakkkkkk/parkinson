import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that aren't part of the DTO
      forbidNonWhitelisted: true, // reject requests that send unexpected fields
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: configService.get('cors.origins', { infer: true }),
    credentials: true,
  });

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`myBackend listening on http://localhost:${port}`);
}

bootstrap();
