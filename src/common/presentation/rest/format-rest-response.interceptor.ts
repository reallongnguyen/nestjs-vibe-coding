import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import RestResponse from './RestResponse';

/**
 * @deprecated
 * */
@Injectable()
export class FormatRestResponseInterceptor<T>
  implements NestInterceptor<T, RestResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RestResponse<T>> {
    return next.handle().pipe(map((data) => RestResponse.ok(data)));
  }
}
