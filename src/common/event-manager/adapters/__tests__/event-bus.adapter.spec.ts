import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsString, Length } from 'class-validator';
import { EventBusAdapter } from '../event-bus.adapter';
import { BaseEvent } from '../../core/domain/events/base.event';
import { EventSchema } from '../../core/domain/events/event.interface';

class TestEventMessage {
  @IsString()
  @Length(1, 100)
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

class TestEvent extends BaseEvent<TestEventMessage> {
  private readonly eventPayload: TestEventMessage;

  constructor(message: string) {
    const payload = new TestEventMessage(message);
    const schema: EventSchema<TestEventMessage> = {
      eventName: 'test.event',
      schema: payload,
      version: '1.0.0',
      module: 'test',
      description: 'Test event',
    };
    super(schema);
    this.eventPayload = payload;
  }

  get payload(): TestEventMessage {
    return this.eventPayload;
  }

  toJSON(): TestEventMessage {
    return this.eventPayload;
  }
}

describe('EventBusAdapter', () => {
  let eventBus: EventBusAdapter;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    eventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    eventBus = new EventBusAdapter(eventEmitter, logger);
  });

  it('should publish event successfully', async () => {
    const event = new TestEvent('test message');
    eventEmitter.emitAsync.mockResolvedValue([]);

    await eventBus.publish(event);
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith('test.event', {
      eventId: event.eventId,
      eventName: event.eventName,
      payload: event.payload,
      metadata: event.metadata,
    });
  });

  it('should handle validation errors', async () => {
    const event = new TestEvent('');

    await expect(eventBus.publish(event)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Event validation failed'),
      expect.any(Array),
    );
  });

  it('should handle subscriber errors', async () => {
    const event = new TestEvent('test');
    const error = new Error('Handler error');
    eventEmitter.emitAsync.mockRejectedValue(error);

    await expect(eventBus.publish(event)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to emit event'),
      error,
    );
  });

  it('should warn when using deprecated subscribe method', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);

    expect(logger.warn).toHaveBeenCalledWith(
      'Using deprecated subscribe() method. Please use @OnEvent() decorator instead.',
    );
    expect(eventEmitter.on).toHaveBeenCalledWith('test.event', handler);
  });

  it('should warn when using deprecated unsubscribe method', () => {
    const handler = jest.fn();
    eventBus.unsubscribe('test.event', handler);

    expect(logger.warn).toHaveBeenCalledWith(
      'Using deprecated unsubscribe() method. Please use @OnEvent() decorator instead.',
    );
    expect(eventEmitter.off).toHaveBeenCalledWith('test.event', handler);
  });
});
