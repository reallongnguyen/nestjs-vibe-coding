export abstract class BaseEvent {
  constructor(public readonly occurredOn: Date = new Date()) {}

  abstract eventName(): string;
}
