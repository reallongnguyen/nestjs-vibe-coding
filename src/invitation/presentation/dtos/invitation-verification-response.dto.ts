import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationVerificationResult } from '../../services/interfaces/invitation-service.interface';

export class InvitationVerificationResponseDto {
  @ApiProperty({
    description: 'Whether the invitation is valid',
    example: true,
  })
  isValid: boolean;

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

  constructor(result: InvitationVerificationResult) {
    this.isValid = result.isValid;
    this.inviterId = result.inviterId;
    this.inviterName = result.inviterName;
    this.message = result.message;
  }
}
