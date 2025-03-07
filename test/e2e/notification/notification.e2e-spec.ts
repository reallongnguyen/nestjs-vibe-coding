import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NotificationConsumerService } from '../../../src/notification/services/notification-consumer.service';
import { NotificationTestModule } from './notification.test.module';
import { NotificationTestHelper } from './helpers/notification.test-helper';
import { TestDataGenerator } from './helpers/test-data.generator';
import { NotificationCreateInput } from '../../../src/notification/presentation/dtos/notification.dto';

describe('Notification System E2E Tests', () => {
  let app: INestApplication;
  let notificationConsumer: NotificationConsumerService;
  let testHelper: NotificationTestHelper;
  let testDataGenerator: TestDataGenerator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    notificationConsumer = moduleRef.get<NotificationConsumerService>(
      NotificationConsumerService,
    );
    testHelper = moduleRef.get<NotificationTestHelper>(NotificationTestHelper);
    testDataGenerator = moduleRef.get<TestDataGenerator>(TestDataGenerator);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic Notification Flow', () => {
    it('should create and deliver a single notification', async () => {
      // Arrange
      const testData = await testDataGenerator.createTestData();
      const notification = new NotificationCreateInput();
      notification.userId = testData.user.id;
      notification.type = 'LIKE';
      notification.key = `like:${testData.content.id}`;
      notification.subjects = [
        {
          id: testData.user.id,
          type: 'user',
          name: testData.user.firstName,
        },
      ];
      notification.subjectCount = 1;
      notification.diObject = {
        id: testData.content.id,
        type: 'post',
        name: testData.content.title,
      };

      // Act
      const result =
        await notificationConsumer.upsertNotificationSerialByKey(notification);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      await expect(
        testHelper.verifyDelivery(result.data.id),
      ).resolves.toBeTruthy();
    });

    it('should aggregate multiple notifications within time window', async () => {
      // Arrange
      const testData = await testDataGenerator.createTestData();
      const notifications = await testDataGenerator.createBulkTestData(5);

      // Act
      const promises = notifications.map((notification) => {
        const input = new NotificationCreateInput();
        input.userId = notification.userId;
        input.type = notification.type;
        input.key = `like:${notification.content.id}`;
        input.subjects = [
          {
            id: notification.userId,
            type: 'user',
            name: 'Test User',
          },
        ];
        input.subjectCount = 1;
        input.diObject = {
          id: notification.content.id,
          type: 'post',
          name: notification.content.title,
        };
        return notificationConsumer.upsertNotificationSerialByKey(input);
      });
      await Promise.all(promises);

      // Assert
      const aggregated = await testHelper.getAggregatedNotification(
        testData.user.id,
      );
      expect(aggregated).toBeDefined();
      expect(aggregated.subjectCount).toBeGreaterThan(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle normal load (1000 notifications/minute)', async () => {
      // Arrange
      const notifications = await testDataGenerator.createBulkTestData(1000);

      // Act
      const { successRate, averageLatency } = await testHelper.simulateLoad({
        notifications,
        duration: 60000, // 1 minute
        distribution: 'even',
      });

      // Assert
      expect(successRate).toBeGreaterThan(0.99); // 99% success rate
      expect(averageLatency).toBeLessThan(100); // Less than 100ms average latency
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability gracefully', async () => {
      // Arrange
      const testData = await testDataGenerator.createTestData();
      const notification = new NotificationCreateInput();
      notification.userId = testData.user.id;
      notification.type = 'LIKE';
      notification.key = `like:${testData.content.id}`;
      notification.subjects = [
        {
          id: testData.user.id,
          type: 'user',
          name: testData.user.firstName,
        },
      ];
      notification.subjectCount = 1;
      notification.diObject = {
        id: testData.content.id,
        type: 'post',
        name: testData.content.title,
      };

      // Simulate service outage
      await testHelper.simulateServiceOutage('mqtt');

      // Act
      const result =
        await notificationConsumer.upsertNotificationSerialByKey(notification);

      // Assert
      expect(result.data).toBeNull(); // Service unavailable should return null
      expect(result.err).toBe('common.serverError');

      // Restore service and try again
      await testHelper.restoreService('mqtt');
      const retryResult =
        await notificationConsumer.upsertNotificationSerialByKey(notification);
      expect(retryResult.data).toBeDefined();
      await expect(
        testHelper.verifyDelivery(retryResult.data.id),
      ).resolves.toBeTruthy();
    });
  });

  describe('Business Rules', () => {
    it('should respect user notification preferences', async () => {
      // Arrange
      const testData = await testDataGenerator.createTestData();
      const preferences = {
        LIKE: false,
        COMMENT: true,
      };

      await testHelper.setUserPreferences(testData.user.id, preferences);

      const likeNotification = new NotificationCreateInput();
      likeNotification.userId = testData.user.id;
      likeNotification.type = 'LIKE';
      likeNotification.key = `like:${testData.content.id}`;
      likeNotification.subjects = [
        {
          id: testData.user.id,
          type: 'user',
          name: testData.user.firstName,
        },
      ];
      likeNotification.subjectCount = 1;
      likeNotification.diObject = {
        id: testData.content.id,
        type: 'post',
        name: testData.content.title,
      };

      const commentNotification = new NotificationCreateInput();
      commentNotification.userId = testData.user.id;
      commentNotification.type = 'COMMENT';
      commentNotification.key = `comment:${testData.content.id}`;
      commentNotification.subjects = [
        {
          id: testData.user.id,
          type: 'user',
          name: testData.user.firstName,
        },
      ];
      commentNotification.subjectCount = 1;
      commentNotification.diObject = {
        id: testData.content.id,
        type: 'post',
        name: testData.content.title,
      };

      // Act & Assert
      const likeResult =
        await notificationConsumer.upsertNotificationSerialByKey(
          likeNotification,
        );
      expect(likeResult.data).toBeNull(); // Disabled notification should return null

      const commentResult =
        await notificationConsumer.upsertNotificationSerialByKey(
          commentNotification,
        );
      expect(commentResult.data).toBeDefined();
      expect(commentResult.data.type).toBe('COMMENT');
    });

    it('should detect milestone notifications', async () => {
      // Arrange
      const testData = await testDataGenerator.createTestData();
      const actions = await testDataGenerator.generateMultipleActions({
        count: 100,
        type: 'LIKE',
        targetContent: testData.content,
      });

      // Act
      const promises = actions.map((action) => {
        const input = new NotificationCreateInput();
        input.userId = action.userId;
        input.type = action.type;
        input.key = `like:${action.content.id}`;
        input.subjects = [
          {
            id: action.userId,
            type: 'user',
            name: 'Test User',
          },
        ];
        input.subjectCount = 1;
        input.diObject = {
          id: action.content.id,
          type: 'post',
          name: action.content.title,
        };
        return notificationConsumer.upsertNotificationSerialByKey(input);
      });
      await Promise.all(promises);

      // Assert
      await expect(
        testHelper.verifyMilestoneNotification(testData.content.id),
      ).resolves.toBeTruthy();
    });
  });
});
