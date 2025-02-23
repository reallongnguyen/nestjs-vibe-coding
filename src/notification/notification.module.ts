import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationConsumerService } from './usecases/notification-consumer.service';
import { EventSubscriber } from './controllers/event.subscriber';
import { NotificationProcessor } from './controllers/notification.processor';
import { NotificationProducerService } from './usecases/notification-producer.service';
import { RedlockMutex } from './repositories/redlock.mutex';
import { NotificationService } from './usecases/notification.service';
import moduleConfig from './notification.config';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    BullModule.registerQueue({ name: 'notification' }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule.forFeature(moduleConfig)],
        inject: [ConfigService],
        name: 'notification_mqtt_client',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: { url: configService.get<string>('notification.mqttUrl') },
        }),
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    EventSubscriber,
    NotificationConsumerService,
    NotificationService,
    NotificationProcessor,
    NotificationProducerService,
    RedlockMutex,
  ],
})
export class NotificationModule {}
