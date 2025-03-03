import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => {
  return {
    mutex: {
      redis1: {
        host: process.env.MUTEX_REDIS1_HOST || 'localhost',
        port: parseInt(process.env.MUTEX_REDIS1_PORT, 10) || 6379,
      },
      redis2: {
        host: process.env.MUTEX_REDIS2_HOST || 'localhost',
        port: parseInt(process.env.MUTEX_REDIS2_PORT, 10) || 6379,
      },
      redis3: {
        host: process.env.MUTEX_REDIS3_HOST || 'localhost',
        port: parseInt(process.env.MUTEX_REDIS3_PORT, 10) || 6379,
      },
    },
    mqttUrl: process.env.NOTIFICATION_MQTT_URL || 'mqtt://localhost:1883',
    mergeNotificationThreshold:
      parseInt(process.env.NOTIFICATION_MERGE_THRESHOLD, 10) || 1800,
    maxSubjectsPerNotification:
      parseInt(process.env.NOTIFICATION_MAX_SUBJECTS, 10) || 10,
    // Delivery configuration
    deliveryTimeout:
      parseInt(process.env.NOTIFICATION_DELIVERY_TIMEOUT, 10) || 5000,
    maxDeliveryRetries:
      parseInt(process.env.NOTIFICATION_MAX_DELIVERY_RETRIES, 10) || 3,
    retryDelayMs: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS, 10) || 1000,
  };
});
