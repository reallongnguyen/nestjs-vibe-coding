import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { FeedErrorCode } from '../errors';
import { FeedType } from '../entities/feed.types';

describe('Feed Error Handling (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Feed Generation Errors', () => {
    it('should handle feed generation errors gracefully', async () => {
      // Mock a user ID that will trigger an error
      const userId = 'error-trigger-user';

      const response = await request(app.getHttpServer())
        .get(`/feed?userId=${userId}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain(
        FeedErrorCode.FEED_GENERATION_FAILED,
      );
    });

    it('should handle personalized feed errors gracefully', async () => {
      // Mock a user ID that will trigger an error
      const userId = 'personalized-error-user';

      const response = await request(app.getHttpServer())
        .get(`/feed?userId=${userId}&type=${FeedType.PERSONALIZED}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain(
        FeedErrorCode.PERSONALIZED_FEED_FAILED,
      );
    });
  });

  describe('Feed Cache Errors', () => {
    it('should handle cache errors gracefully', async () => {
      // Mock a user ID that will trigger a cache error
      const userId = 'cache-error-user';

      const response = await request(app.getHttpServer())
        .get(`/feed?userId=${userId}&forceCacheError=true`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain(
        FeedErrorCode.FEED_CACHE_FAILED,
      );
    });
  });

  describe('Feed Enrichment Errors', () => {
    it('should handle enrichment errors gracefully', async () => {
      // Mock a user ID that will trigger an enrichment error
      const userId = 'enrichment-error-user';

      const response = await request(app.getHttpServer())
        .get(`/feed?userId=${userId}&forceEnrichmentError=true`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toContain(
        FeedErrorCode.FEED_ENRICHMENT_FAILED,
      );
    });
  });
});
