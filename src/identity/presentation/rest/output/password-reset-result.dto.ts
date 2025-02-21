import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  resetToken?: string;

  @ApiProperty()
  expiresAt: Date;
}
