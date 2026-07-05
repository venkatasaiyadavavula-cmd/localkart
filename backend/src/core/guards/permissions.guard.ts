import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.role !== 'staff') {
      throw new ForbiddenException('Staff access required');
    }

    const perms: string[] = user.permissions ?? [];
    const hasAll = required.every((p) => perms.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('You do not have permission for this action');
    }

    return true;
  }
}
