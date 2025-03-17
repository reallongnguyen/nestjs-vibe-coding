import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'The invitation code to accept',
    example: 'abc123xyz',
  })
  @IsString()
  @Length(10, 10)
  code: string;
}
