import { Controller, Get, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OkResponse } from 'src/common';
import { GlobalErrorFilter } from 'src/common/errors/error.filter';
// import { ErrorResponse, COMMON_ERRORS } from 'src/common/errors'; // Removed
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';

@Controller()
@UseFilters(GlobalErrorFilter)
// @ErrorResponse(COMMON_ERRORS) // Removed
@ApiTags('app')
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({
    description: 'Get app information',
    summary: 'App information',
  })
  @OkResponse(Object)
  @ApiAppErrors([CommonErrorCode.SERVER_ERROR])
  get(): Record<string, string> {
    return {
      ...this.configService.get<Record<string, string>>('app'),
      port: undefined,
    };
  }
}
