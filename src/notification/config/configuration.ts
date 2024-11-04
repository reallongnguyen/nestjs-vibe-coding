export default () => ({
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
  notification: {
    mqttUrl: process.env.NOTIFICATION_MQTT_URL || 'mqtt://localhost:1883',
    mergeNotificationThreshold:
      parseInt(process.env.NOTIFICATION_MERGE_THRESHOLD, 10) || 1800,
  },
});
