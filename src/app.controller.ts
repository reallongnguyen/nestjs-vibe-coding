import { Controller, Get, UseFilters, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  FormatHttpResponseInterceptor,
  HttpExceptionFilter,
  OkResponse,
} from 'src/common/user-interface/http';
import { version } from '../package.json';

@Controller()
@UseInterceptors(new FormatHttpResponseInterceptor())
@UseFilters(new HttpExceptionFilter({}))
@ApiTags('app')
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({
    description: 'Get app information',
    summary: 'App information',
  })
  @OkResponse(Object)
  get(): Record<string, string> {
    return {
      ...this.configService.get<Record<string, string>>('app'),
      version,
      port: undefined,
    };
  }
}
