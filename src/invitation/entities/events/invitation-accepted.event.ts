import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import {
  InvitationEventSchemas,
  InvitationAcceptedPayload,
} from 'src/common/event-manager/entities/events/schemas/invitation.events';

export class InvitationAcceptedEvent extends BaseEvent<InvitationAcceptedPayload> {
  constructor(
    public readonly invitationId: string,
    public readonly inviterId: string,
    public readonly acceptedBy: string,
    public readonly code: string,
    params?: { correlationId?: string; metadata?: Record<string, unknown> },
  ) {
    super(InvitationEventSchemas.INVITATION_ACCEPTED, params);
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
