import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AppError } from '../../../../models';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authGuard: AuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.authGuard.canActivate(context).catch((e) => {
      if (e instanceof AppError && e.name === 'common.invalidToken') {
        return true;
      }

      throw e;
    });
  }
}
