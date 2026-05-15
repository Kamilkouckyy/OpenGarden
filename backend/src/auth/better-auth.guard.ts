import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { BetterAuthService } from './better-auth.service';
import { AuthService } from './auth.service';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    private readonly betterAuthService: BetterAuthService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();

    try {
      request.user = await this.betterAuthService.getAppUserFromHeaders(request.headers);
      return true;
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }

      const authorization = request.headers.authorization;
      if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
        const token = authorization.slice('Bearer '.length).trim();
        request.user = await this.authService.getUserFromAccessToken(token);
        return true;
      }
    }

    throw new UnauthorizedException('Authentication required');
  }
}
