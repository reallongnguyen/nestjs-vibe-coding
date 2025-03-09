import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import { EventEmitterModule } from '@nestjs/event-emitter';
import KeyvRedis from '@keyv/redis';
import { BullModule } from '@nestjs/bull';

import { LoggerModule } from './logger/logger.module';
import { AppConfigModule } from './configuration/config.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ImgProxyModule } from './img-proxy/img-proxy.module';
import { EventManagerModule } from './event-manager/event-manager.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CacheModule.registerAsync<RedisClientOptions>({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (service: ConfigService) => {
        return {
          stores: [new KeyvRedis(service.get<string>('redis.url'))],
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('redis.url'),
      }),
    }),
    EventEmitterModule.forRoot(),
    EventManagerModule,
    AuthModule,
    HealthModule,
    PrismaModule,
    ConfigModule,
    ImgProxyModule,
  ],
})
export class CommonModule {}
