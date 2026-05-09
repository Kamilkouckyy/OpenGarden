import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from './better-auth.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppUser => {
    const request = context.switchToHttp().getRequest<{ user: AppUser }>();
    return request.user;
  },
);
