import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppError } from 'src/common/errors';
import { AuthGuard } from './auth.guard';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authGuard: AuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.authGuard.canActivate(context).catch((e) => {
      if (e instanceof AppError && e.code === 'auth.invalid-token') {
        return true;
      }

      throw e;
    });
  }
}
