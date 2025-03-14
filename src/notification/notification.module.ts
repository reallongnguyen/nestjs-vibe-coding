/**
 * @module NotificationModule
 *
 * The Notification module handles all notification-related functionality in the application.
 * It follows a Domain-Driven Design approach for managing user notifications across the system.
 *
 * Key Features:
 * 1. User Notifications
 *    - Stores and manages user-specific notifications
 *    - Supports different notification types (likes, comments, mentions, system updates)
 *    - Handles notification grouping for high-volume activities
 *
 * 2. Real-time Notifications
 *    - Delivers notifications in real-time using MQTT
 *    - Powered by EMQX for reliable message delivery
 *    - Supports notification delivery within 5 seconds
 *
 * 3. Notification Structure
 *    - key: Unique identifier for grouping similar notifications
 *    - type: Type of notification (like, comment, mention, etc.)
 *    - subjects: Array of entities that triggered the notification
 *    - subjectCount: Count of subjects for grouped notifications
 *    - diObject: Direct object of the notification (e.g., the post being liked)
 *    - inObject: Indirect object (e.g., the comment being liked)
 *    - prObject: Parent object (e.g., the post containing the comment)
 *    - text: Human-readable notification message
 *    - decorators: Text decorations for rich notification content
 *    - link: URL associated with the notification
 *
 * 4. Event Handling
 *    - Listens to domain events from other modules
 *    - Creates notifications based on social interactions
 *    - Supports notification preferences per user
 *
 * 5. Features
 *    - Pagination support for notification lists
 *    - Mark notifications as viewed (single or batch)
 *    - Notification grouping for better UX
 *    - Real-time delivery via MQTT
 *    - Support for rich text and decorated content
 *    - User-configurable notification preferences
 *
 * Database Schema:
 * The module uses the Notification model from Prisma schema with the following key fields:
 * - id: Unique identifier
 * - userId: Target user for the notification
 * - type: Notification type
 * - subjects: JSON array of notification subjects
 * - text: Notification message
 * - notificationTime: Time when notification should be shown
 * - viewedAt: When the user viewed the notification
 *
 * The module also uses the NotificationPreference model with the following key fields:
 * - id: Unique identifier
 * - userId: User the preference belongs to
 * - type: Notification type the preference applies to
 * - channels: Array of channels to deliver notifications on
 * - enabled: Whether notifications of this type are enabled
 *
 * Integration Points:
 * - Integrates with EventBus for cross-module communication
 * - Uses MQTT for real-time notification delivery
 * - Interfaces with the social module for engagement notifications
 * - Works with the user module for preference management
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { NotificationController } from './presentation/notification.controller';
import { NotificationPreferenceController } from './presentation/notification-preference.controller';
import { NotificationTemplateController } from './presentation/notification-template.controller';
import { NotificationProcessor } from './presentation/notification.processor';
import { NotificationHandler } from './presentation/handlers/notification.handler';
import { LikeNotificationHandler } from './presentation/handlers/like-notification.handler';
import { CommentNotificationHandler } from './presentation/handlers/comment-notification.handler';
import { FollowNotificationHandler } from './presentation/handlers/follow-notification.handler';
import { NotificationService } from './services/notification.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationConsumerService } from './services/notification-consumer.service';
import { NotificationProducerService } from './services/notification-producer.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationMonitoringService } from './services/notification-monitoring.service';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationPreferenceRepository } from './repositories/notification-preference.repository';
import { NotificationTemplateRepository } from './repositories/notification-template.repository';
import { RedlockMutex } from './repositories/redlock.mutex';
import moduleConfig from './notification.config';
import { NotificationCounterService } from './services/notification-counter.service';
import { NotificationMetricsService } from './services/notification-metrics.service';
import { NotificationBatchService } from './services/notification-batch.service';
import { NotificationBatchProcessor } from './presentation/notification-batch.processor';
import { NotificationCacheService } from './services/notification-cache.service';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    BullModule.registerQueue(
      { name: 'notification' },
      { name: 'notification-batch' },
    ),
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
    EventBusModule,
  ],
  controllers: [
    NotificationController,
    NotificationPreferenceController,
    NotificationTemplateController,
  ],
  providers: [
    // Services
    NotificationService,
    NotificationPreferenceService,
    NotificationTemplateService,
    NotificationConsumerService,
    NotificationProducerService,
    NotificationDeliveryService,
    NotificationMonitoringService,
    NotificationCounterService,
    NotificationMetricsService,
    NotificationBatchService,
    NotificationCacheService,

    // Repositories
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
    {
      provide: 'INotificationPreferenceRepository',
      useClass: NotificationPreferenceRepository,
    },
    {
      provide: 'INotificationTemplateRepository',
      useClass: NotificationTemplateRepository,
    },
    NotificationRepository,
    NotificationPreferenceRepository,
    NotificationTemplateRepository,
    RedlockMutex,

    // Event handlers
    NotificationHandler,
    LikeNotificationHandler,
    CommentNotificationHandler,
    FollowNotificationHandler,
    NotificationProcessor,
    NotificationBatchProcessor,
  ],
})
export class NotificationModule {}
