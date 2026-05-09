import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BetterAuthService } from './better-auth.service';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    request.user = await this.betterAuthService.getAppUserFromHeaders(request.headers);
    return true;
  }
}
