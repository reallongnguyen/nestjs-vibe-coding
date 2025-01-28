import { Controller, Get, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestExceptionFilter, OkResponse } from 'src/common/presentation/rest';

@Controller()
@UseFilters(new RestExceptionFilter({}))
@ApiTags('app')
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({
    description: 'Get app information',
    summary: 'App information',
  })
  @OkResponse(Object)
  get(): Record<string, string> {
    return {
      ...this.configService.get<Record<string, string>>('app'),
      port: undefined,
    };
  }
}
