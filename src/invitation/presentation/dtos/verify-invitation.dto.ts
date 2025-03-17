import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyInvitationDto {
  @ApiProperty({
    description: 'The invitation code to verify',
    example: 'abc123xyz',
  })
  @IsString()
  @Length(10, 10)
  code: string;
}
