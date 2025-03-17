import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

interface InvitationAcceptedPayload {
  invitationId: string;
  inviterId: string;
  acceptedBy: string;
  code: string;
}

const INVITATION_ACCEPTED_SCHEMA: EventSchema<InvitationAcceptedPayload> = {
  eventName: 'invitation.accepted',
  schema: {
    invitationId: '',
    inviterId: '',
    acceptedBy: '',
    code: '',
  },
  version: '1.0',
  module: 'invitation',
  description: 'Emitted when an invitation is accepted',
};

export class InvitationAcceptedEvent extends BaseEvent<InvitationAcceptedPayload> {
  constructor(
    public readonly invitationId: string,
    public readonly inviterId: string,
    public readonly acceptedBy: string,
    public readonly code: string,
    params?: { correlationId?: string; metadata?: Record<string, unknown> },
  ) {
    super(INVITATION_ACCEPTED_SCHEMA, params);
  }

  toJSON(): InvitationAcceptedPayload {
    return {
      invitationId: this.invitationId,
      inviterId: this.inviterId,
      acceptedBy: this.acceptedBy,
      code: this.code,
    };
  }
}
