import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);
    const validApiKey = this.configService.get<string>('monitoring.apiKey');

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // Try to get from header first
    const headerKey = request.header('X-API-Key');
    if (headerKey) return headerKey;

    // Then try query parameter
    const queryKey = request.query.apiKey;
    if (queryKey && typeof queryKey === 'string') return queryKey;

    return undefined;
  }
}
