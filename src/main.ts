import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import RestResponse from 'src/common/presentation/rest/RestResponse';
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
      exceptionFactory: RestResponse.transformValidatorError,
    }),
  );

  // API docs
  const swaggerDocConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(
      `${config.get<string>('app.name')} v${config.get<string>('app.version')}`,
    )
    .setDescription('The API document is generated automatically')
    .setVersion(version)
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerDocConfig);

  SwaggerModule.setup('api', app, swaggerDoc);

  await app.listen(config.get<string>('app.port'));
}
bootstrap();
