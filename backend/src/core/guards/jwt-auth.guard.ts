import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Staff JWTs may only call /staff/work/* APIs (work portal). */
const STAFF_API_PREFIX = '/staff/work';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user?.role === 'staff') {
      const path: string = request.path ?? request.url ?? '';
      if (!path.includes(STAFF_API_PREFIX)) {
        throw new ForbiddenException('Staff accounts must use the work portal API');
      }
    }
    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
