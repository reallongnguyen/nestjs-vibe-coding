import { Collection } from 'src/common/models';

import { UserSearchFiltersDto } from '../../presentation/rest/input/user-search-filters.dto';
import { User } from '../../domain/entities/user.entity';

export interface FindManyUserParams {
  skip?: number;
  take?: number;
  where?: {
    name?: string;
  };
  orderBy?: {
    [key in keyof User]?: 'asc' | 'desc';
  };
}

export interface FindUniqueUserParams {
  where: {
    id?: string;
    authId?: string;
  };
}

export interface UpdateUserParams {
  where: {
    id?: string;
    authId?: string;
  };
  data: Partial<Pick<User, 'name' | 'avatar' | 'roles'>>;
}

export interface UpsertUserParams {
  where: {
    authId: string;
  };
  create: Pick<User, 'authId' | 'name' | 'roles'> & { avatar?: string };
  update: Partial<Pick<User, 'name' | 'avatar'>>;
}

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findUnique(params: { where: any }): Promise<User | null>;
  findMany(params: any): Promise<User[]>;
  count(): Promise<number>;
  upsert(params: any): Promise<User>;
  update(params: any): Promise<User>;
  search(filters: UserSearchFiltersDto): Promise<Collection<User>>;
  updateRole(userId: string, role: string): Promise<User>;
  deactivate(userId: string): Promise<User>;
  delete(userId: string): Promise<void>;
  createPasswordReset(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }>;
}
