import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function createPublishedPost(
  app: INestApplication,
  token: string,
) {
  // Create a draft post
  const draftResponse = await request(app.getHttpServer())
    .post('/api/v1/posts/drafts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Published Post',
      content: { text: 'Test content' },
      topics: [],
    })
    .expect(201);

  const draftId = draftResponse.body.id;

  // Publish the draft
  const publishResponse = await request(app.getHttpServer())
    .post(`/api/v1/posts/drafts/${draftId}/publish`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  return publishResponse.body;
}
