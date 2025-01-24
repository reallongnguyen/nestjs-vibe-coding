import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationResultDto {
  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failureCount: number;

  @ApiProperty()
  errors: Array<{
    userId: string;
    error: string;
  }>;
}
