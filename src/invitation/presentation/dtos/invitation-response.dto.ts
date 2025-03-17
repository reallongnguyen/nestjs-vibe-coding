import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { Invitation } from '../../entities/invitation.entity';

export class InvitationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the invitation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique invitation code',
    example: 'abc123xyz',
  })
  code: string;

  @ApiProperty({
    description: 'ID of the user who created the invitation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  inviterId: string;

  @ApiProperty({
    description: 'Name of the user who created the invitation',
    example: 'John',
  })
  inviterName: string;

  @ApiPropertyOptional({
    description: 'Optional personal message included with the invitation',
    example: 'Hey, join our platform!',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Optional email address the invitation was sent to',
    example: 'friend@example.com',
  })
  email?: string;

  @ApiProperty({
    description: 'Current status of the invitation',
    enum: InvitationStatus,
    example: 'PENDING',
  })
  status: InvitationStatus;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'When the invitation was accepted, if applicable',
    example: '2023-01-01T12:00:00Z',
  })
  acceptedAt?: Date;

  @ApiPropertyOptional()
  acceptedBy?: string;

  @ApiProperty({
    description: 'When the invitation was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(invitation: Invitation) {
    this.id = invitation.id;
    this.code = invitation.code;
    this.inviterId = invitation.inviterId;
    this.inviterName = invitation.inviter?.firstName || 'Unknown';
    this.message = invitation.message || undefined;
    this.email = invitation.email || undefined;
    this.status = invitation.status;
    this.expiresAt = invitation.expiresAt || undefined;
    this.acceptedAt = invitation.acceptedAt || undefined;
    this.acceptedBy = invitation.acceptedBy || undefined;
    this.createdAt = invitation.createdAt;
    this.updatedAt = invitation.updatedAt;
  }
}
