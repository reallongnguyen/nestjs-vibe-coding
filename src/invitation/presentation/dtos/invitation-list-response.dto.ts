import { ApiProperty } from '@nestjs/swagger';
import { PagedResult } from 'src/common';
import { InvitationResponseDto } from './invitation-response.dto';

export class InvitationListResponseDto {
  @ApiProperty({
    description: 'List of invitations',
    type: [InvitationResponseDto],
  })
  readonly data: InvitationResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  readonly meta: {
    pageSize: number;
    pageNumber: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(pagedResult: PagedResult<any>) {
    this.data = pagedResult.data.map(
      (invitation) => new InvitationResponseDto(invitation),
    );
    this.meta = pagedResult.meta;
  }
}
