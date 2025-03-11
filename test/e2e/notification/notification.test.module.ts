import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { NotificationModule } from '../../../src/notification/notification.module';
import { NotificationTestHelper } from './helpers/notification.test-helper';
import { TestDataGenerator } from './helpers/test-data.generator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    EventEmitterModule.forRoot(),
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
        db: 1,
      },
    }),
    NotificationModule,
  ],
  providers: [NotificationTestHelper, TestDataGenerator],
  exports: [NotificationTestHelper, TestDataGenerator],
})
export class NotificationTestModule {}
