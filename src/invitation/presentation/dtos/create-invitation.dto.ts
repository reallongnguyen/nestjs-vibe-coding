import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateInvitationOptions } from '../../services/interfaces/invitation-service.interface';

export class CreateInvitationDto implements CreateInvitationOptions {
  @ApiPropertyOptional({
    description: 'Optional personal message to include with the invitation',
    example: 'Hey, join our platform!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({
    description: 'Optional email address to send the invitation to',
    example: 'friend@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Optional expiration date for the invitation',
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  expiresAt?: Date;
}
