import { Controller, UseGuards, UseFilters, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  AuthContextUser,
  RolesGuard,
  RequireAnyRoles,
  OkResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';

import { GetStreakService } from '../services/get-streak.service';
import { StreakResponseDto } from './dtos/streak.dto';

@ApiTags('streaks')
@ApiBearerAuth()
@Controller({
  path: 'streaks',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ErrorResponse(COMMON_ERRORS)
export class StreakController {
  constructor(private readonly getStreakService: GetStreakService) {}

  @Get('')
  @RequireAnyRoles('USER')
  @ApiOperation({ summary: 'Get user streak' })
  @OkResponse(StreakResponseDto)
  @ErrorResponse({})
  async getStreak(
    @AuthContextUser() user: { id: string },
  ): Promise<StreakResponseDto> {
    const streak = await this.getStreakService.execute(user.id);
    return StreakResponseDto.fromDomain(streak);
  }
}
