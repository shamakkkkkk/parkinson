import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from '../passport/jwt.strategy';

/** Rejects requests from a user whose account has been blocked. Must run after JwtAuthGuard. */
@Injectable()
export class BlockedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: JwtPayload & { isBlocked?: boolean } }>();

    if (request.user?.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    return true;
  }
}
