import { OmitType } from '@nestjs/swagger';

import AppResponse from '../RestResponse';

export default class SuccessResponseDto extends OmitType(AppResponse, [
  'error',
] as const) {}
