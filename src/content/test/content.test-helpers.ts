import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TEST_DRAFT_POST } from './content.test-data';

export async function createTestDraft(app: INestApplication, token: string) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/posts/drafts')
    .set('Authorization', `Bearer ${token}`)
    .send(TEST_DRAFT_POST);

  return response.body;
}

export async function publishTestPost(
  app: INestApplication,
  draftId: string,
  token: string,
) {
  const response = await request(app.getHttpServer())
    .post(`/api/v1/posts/drafts/${draftId}/publish`)
    .set('Authorization', `Bearer ${token}`)
    .send({});

  return response.body;
}
