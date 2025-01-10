import { User } from '../models/user.entity';

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
  create: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
  update: Partial<Pick<User, 'name' | 'avatar'>>;
}

export interface UserRepositoryPort {
  findMany(params: FindManyUserParams): Promise<User[]>;

  findUnique(params: FindUniqueUserParams): Promise<User | null>;

  count(): Promise<number>;

  update(params: UpdateUserParams): Promise<User>;

  upsert(params: UpsertUserParams): Promise<User>;
}
