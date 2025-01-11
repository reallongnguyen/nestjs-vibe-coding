import { Request } from 'express';
import { AuthCtx } from '../domain/entities/auth-ctx.model';

export interface AuthCtxRepoPort {
  getAuthCtxId(request: Request): string;
  getAuthCtx(request: Request): Promise<AuthCtx>;
}
