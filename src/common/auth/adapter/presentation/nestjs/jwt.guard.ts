import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AuthService } from '../../../core/application/services/auth.service';

@Injectable()
export class JWTGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authService.canActivate(request);
  }
}
