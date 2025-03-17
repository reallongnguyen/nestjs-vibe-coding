import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatsDto } from '../../services/interfaces/invitation-service.interface';

export class InvitationStatsResponseDto {
  @ApiProperty({
    description: 'Total number of invitations sent by the user',
    example: 10,
  })
  sent: number;

  @ApiProperty({
    description: 'Number of invitations that have been accepted',
    example: 5,
  })
  accepted: number;

  @ApiProperty({
    description: 'Conversion rate as a percentage',
    example: 50,
  })
  conversionRate: number;

  constructor(stats: InvitationStatsDto) {
    this.sent = stats.sent;
    this.accepted = stats.accepted;
    this.conversionRate = stats.conversionRate;
  }
}
