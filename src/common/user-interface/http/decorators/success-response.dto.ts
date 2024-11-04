import { OmitType } from '@nestjs/swagger';

import AppResponse from 'src/common/user-interface/http/HttpResponse';

export default class SuccessResponseDto extends OmitType(AppResponse, [
  'error',
] as const) {}
