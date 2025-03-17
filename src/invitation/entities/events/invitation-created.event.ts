import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

interface InvitationCreatedPayload {
  invitationId: string;
  inviterId: string;
  code: string;
  email?: string;
}

const INVITATION_CREATED_SCHEMA: EventSchema<InvitationCreatedPayload> = {
  eventName: 'invitation.created',
  schema: {
    invitationId: '',
    inviterId: '',
    code: '',
    email: undefined,
  },
  version: '1.0',
  module: 'invitation',
  description: 'Emitted when a new invitation is created',
};

export class InvitationCreatedEvent extends BaseEvent<InvitationCreatedPayload> {
  constructor(
    public readonly invitationId: string,
    public readonly inviterId: string,
    public readonly code: string,
    public readonly email?: string,
    params?: { correlationId?: string; metadata?: Record<string, unknown> },
  ) {
    super(INVITATION_CREATED_SCHEMA, params);
  }

  toJSON(): InvitationCreatedPayload {
    return {
      invitationId: this.invitationId,
      inviterId: this.inviterId,
      code: this.code,
      email: this.email,
    };
  }

  static fromJSON(data: {
    invitationId: string;
    inviterId: string;
    code: string;
    email?: string;
  }): InvitationCreatedEvent {
    return new InvitationCreatedEvent(
      data.invitationId,
      data.inviterId,
      data.code,
      data.email,
    );
  }
}
