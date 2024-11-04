import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import HttpResponse from 'src/common/user-interface/http/HttpResponse';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { version } from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config: ConfigService = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.enableVersioning();
  app.enableCors();
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: HttpResponse.transformValidatorError,
    }),
  );

  // API docs
  const swaggerDocConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${config.get<string>('app.name')} API docs`)
    .setDescription('The API document is generated automatically')
    .setVersion(version)
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerDocConfig);

  SwaggerModule.setup('api', app, swaggerDoc);

  await app.listen(config.get<string>('app.port'));
}
bootstrap();
