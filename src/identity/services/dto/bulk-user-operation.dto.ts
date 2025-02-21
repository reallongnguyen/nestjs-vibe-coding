import { Role } from '../../entities/role.enum';

export enum BulkOperationType {
  UPDATE_ROLE = 'UPDATE_ROLE',
  DEACTIVATE = 'DEACTIVATE',
  DELETE = 'DELETE',
}

export class BulkUserOperationDto {
  operation: BulkOperationType;
  userIds: string[];
  newRole?: Role;
}
