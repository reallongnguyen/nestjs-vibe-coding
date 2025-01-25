import { IsArray, IsEnum, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Role } from '../../../domain/entities/role.enum';

export enum BulkOperationType {
  UPDATE_ROLE = 'UPDATE_ROLE',
  DEACTIVATE = 'DEACTIVATE',
  ACTIVATE = 'ACTIVATE',
  DELETE = 'DELETE',
}

export class BulkUserOperationDto {
  @ApiProperty({ enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    items: { type: 'string' },
    required: false,
    example: Object.values(Role),
  })
  @ValidateIf((o) => o.operation === BulkOperationType.UPDATE_ROLE)
  @IsArray()
  @IsEnum(Role, { each: true })
  newRoles?: Role[];
}
