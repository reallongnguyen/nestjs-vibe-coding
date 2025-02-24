import { BaseEvent } from '../../..';

export class DeleteImageCommand extends BaseEvent {
  constructor(public readonly imageUrl: string) {
    super();
  }

  eventName(): string {
    return 'delete-image';
  }

  static getEventName(): string {
    return 'delete-image';
  }

  toJSON(): Record<string, unknown> {
    return {
      imageUrl: this.imageUrl,
    };
  }
}
