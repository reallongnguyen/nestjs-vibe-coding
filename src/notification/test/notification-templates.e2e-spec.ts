import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { TemplateLanguage } from '../entities/notification-template.domain';
import { AuthGuard, Role } from '../../common';

// Mock authentication guard to bypass authentication for testing
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

describe('Notification Templates (e2e)', () => {
  let app: INestApplication;
  let createdTemplateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/notifications/templates (GET)', () => {
    it('should return a list of notification templates', () => {
      return request(app.getHttpServer())
        .get('/notifications/templates')
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/notifications/templates (POST)', () => {
    it('should create a new notification template', () => {
      const newTemplate = {
        name: 'Test Template',
        type: 'test-template-e2e',
        content: {
          [TemplateLanguage.EN]: 'Hello {{name}}!',
          [TemplateLanguage.VI]: 'Xin chào {{name}}!',
        },
        version: '1.0.0',
        description: 'Template for e2e testing',
      };

      return request(app.getHttpServer())
        .post('/notifications/templates')
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send(newTemplate)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', newTemplate.name);
          expect(res.body).toHaveProperty('type', newTemplate.type);
          expect(res.body).toHaveProperty('content');
          expect(res.body.content).toHaveProperty(TemplateLanguage.EN);
          expect(res.body.content).toHaveProperty(TemplateLanguage.VI);
          expect(res.body).toHaveProperty('version', newTemplate.version);
          expect(res.body).toHaveProperty('isActive', true);

          // Save the ID for later tests
          createdTemplateId = res.body.id;
        });
    });

    it('should validate template syntax', () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        type: 'invalid-template-e2e',
        content: {
          [TemplateLanguage.EN]: 'Hello {{name!', // Invalid Handlebars syntax
          [TemplateLanguage.VI]: 'Xin chào {{name}}!',
        },
        version: '1.0.0',
      };

      return request(app.getHttpServer())
        .post('/notifications/templates')
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send(invalidTemplate)
        .expect(400);
    });
  });

  describe('/notifications/templates/:id (GET)', () => {
    it('should return a specific template by ID', () => {
      return request(app.getHttpServer())
        .get(`/notifications/templates/${createdTemplateId}`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdTemplateId);
          expect(res.body).toHaveProperty('type', 'test-template-e2e');
        });
    });

    it('should return 404 for non-existent template', () => {
      return request(app.getHttpServer())
        .get('/notifications/templates/non-existent-id')
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(404);
    });
  });

  describe('/notifications/templates/:id (PUT)', () => {
    it('should update an existing template', () => {
      const updateData = {
        content: {
          [TemplateLanguage.EN]: 'Updated: Hello {{name}}!',
          [TemplateLanguage.VI]: 'Đã cập nhật: Xin chào {{name}}!',
        },
        version: '1.0.1',
      };

      return request(app.getHttpServer())
        .put(`/notifications/templates/${createdTemplateId}`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type', 'test-template-e2e');
          expect(res.body.content[TemplateLanguage.EN]).toContain('Updated');
          expect(res.body).toHaveProperty('version', updateData.version);
        });
    });
  });

  describe('/notifications/templates/:id/validate (POST)', () => {
    it('should validate template variables', () => {
      return request(app.getHttpServer())
        .post(`/notifications/templates/${createdTemplateId}/validate`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send({ requiredVariables: ['name'] })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', true);
        });
    });

    it('should report missing variables', () => {
      return request(app.getHttpServer())
        .post(`/notifications/templates/${createdTemplateId}/validate`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send({ requiredVariables: ['name', 'age', 'nonExistentVar'] })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', false);
          expect(res.body).toHaveProperty('missingVariables');
        });
    });
  });

  describe('/notifications/templates/:id/test-render (POST)', () => {
    it('should render a template with provided data', () => {
      return request(app.getHttpServer())
        .post(`/notifications/templates/${createdTemplateId}/test-render`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send({ data: { name: 'John Doe' } })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rendered');
          expect(res.body.rendered).toHaveProperty(TemplateLanguage.EN);
          expect(res.body.rendered[TemplateLanguage.EN]).toContain('John Doe');
        });
    });

    it('should render a template for a specific language', () => {
      return request(app.getHttpServer())
        .post(`/notifications/templates/${createdTemplateId}/test-render`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .send({
          data: { name: 'John Doe' },
          language: TemplateLanguage.VI,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rendered');
          expect(res.body.rendered).toHaveProperty(TemplateLanguage.VI);
          expect(res.body.rendered[TemplateLanguage.VI]).toContain('John Doe');
        });
    });
  });

  describe('/notifications/templates/:id/hot-reload (POST)', () => {
    it('should hot reload a template', () => {
      return request(app.getHttpServer())
        .post(`/notifications/templates/${createdTemplateId}/hot-reload`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(200);
    });
  });

  describe('/notifications/templates/:id (DELETE)', () => {
    it('should delete a template', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/templates/${createdTemplateId}`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(200);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/notifications/templates/${createdTemplateId}`)
        .set('x-user-id', 'admin-user-id')
        .set('x-user-roles', Role.ADMIN)
        .expect(404);
    });
  });
});
