import 'reflect-metadata';
import { IsString, Length } from 'class-validator';
import { EventValidator } from '../event.validator';
import { LikeCreatedEvent } from '../../events/social.events';
import { EventValidationError } from '../../errors/event.errors';
import { EventSchema } from '../../events/event.interface';
import {
  ContentType,
  LikeCreatedPayload,
} from '../../events/schemas/social.events';

class TestEventPayload {
  @IsString()
  @Length(1, 100)
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

describe('EventValidator', () => {
  describe('validate', () => {
    it('should validate a valid like event', async () => {
      const payload = new LikeCreatedPayload();
      payload.actorId = '123e4567-e89b-12d3-a456-426614174000';
      payload.contentType = ContentType.POST;
      payload.contentId = '123e4567-e89b-12d3-a456-426614174001';
      payload.targetUserId = '123e4567-e89b-12d3-a456-426614174002';

      const event = new LikeCreatedEvent(payload);

      await expect(
        EventValidator.validate(event.getSchema(), event.payload),
      ).resolves.toBeUndefined();
    });

    it('should throw validation error for invalid like event', async () => {
      const payload = new LikeCreatedPayload();
      payload.actorId = 'invalid-uuid';
      payload.contentType = 'INVALID_TYPE' as any;
      payload.contentId = '123e4567-e89b-12d3-a456-426614174001';
      payload.targetUserId = '123e4567-e89b-12d3-a456-426614174002';

      const event = new LikeCreatedEvent(payload);

      await expect(
        EventValidator.validate(event.getSchema(), event.payload),
      ).rejects.toThrow(EventValidationError);
    });

    it('should validate all required fields', async () => {
      const payload = new LikeCreatedPayload();
      payload.actorId = '123e4567-e89b-12d3-a456-426614174000';
      payload.contentType = ContentType.POST;
      // Missing contentId and targetUserId

      const event = new LikeCreatedEvent(payload);

      await expect(
        EventValidator.validate(event.getSchema(), event.payload),
      ).rejects.toThrow(EventValidationError);
    });

    it('should validate valid event payload', async () => {
      const payload = new TestEventPayload('Hello World');

      const testSchema: EventSchema<TestEventPayload> = {
        eventName: 'test.event',
        schema: new TestEventPayload(''),
        version: '1.0.0',
        module: 'test',
        description: 'Test event',
      };

      await expect(
        EventValidator.validate(testSchema, payload),
      ).resolves.toBeUndefined();
    });

    it('should throw validation error for invalid payload', async () => {
      const payload = new TestEventPayload('');

      const testSchema: EventSchema<TestEventPayload> = {
        eventName: 'test.event',
        schema: new TestEventPayload(''),
        version: '1.0.0',
        module: 'test',
        description: 'Test event',
      };

      await expect(
        EventValidator.validate(testSchema, payload),
      ).rejects.toThrow(EventValidationError);
    });

    it('should throw validation error with correct message', async () => {
      const payload = new TestEventPayload('');

      const testSchema: EventSchema<TestEventPayload> = {
        eventName: 'test.event',
        schema: new TestEventPayload(''),
        version: '1.0.0',
        module: 'test',
        description: 'Test event',
      };

      try {
        await EventValidator.validate(testSchema, payload);
        fail('Expected validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(EventValidationError);
        expect(error.message).toContain('Invalid event payload for test.event');
        expect(error.validationErrors).toHaveLength(1);
        expect(error.getValidationMessages()).toHaveLength(1);
      }
    });
  });
});
