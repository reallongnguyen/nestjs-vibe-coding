import { Request } from 'express';
import { AuthCtx } from '../models/auth-ctx.model';

export interface AuthCtxRepo {
  getAuthCtxId(request: Request): string;
  getAuthCtx(request: Request): Promise<AuthCtx>;
}
