import { IsString, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';

/**
 * Payload for invitation accepted events
 */
export class InvitationAcceptedPayload {
  @IsUUID()
  invitationId: string;

  @IsUUID()
  inviterId: string;

  @IsUUID()
  acceptedBy: string;

  @IsString()
  code: string;
}

/**
 * All invitation related event schemas
 */
export const InvitationEventSchemas = {
  INVITATION_ACCEPTED: {
    eventName: 'invitation.accepted',
    schema: new InvitationAcceptedPayload(),
    version: '1.0.0',
    module: 'invitation',
    description: 'Emitted when an invitation is accepted',
  } as EventSchema<InvitationAcceptedPayload>,
} as const;
