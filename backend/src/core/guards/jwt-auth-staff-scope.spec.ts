import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard staff API scope', () => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector;

  const guard = new JwtAuthGuard(reflector);

  const mockContext = (path: string, user: { role: string }) => {
    const request = { path, url: path, user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  it('allows staff on /staff/work routes', async () => {
    const parentActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
    parentActivate.mockResolvedValue(true);

    const result = await guard.canActivate(
      mockContext('/staff/work/orders', { role: 'staff' }),
    );
    expect(result).toBe(true);
    parentActivate.mockRestore();
  });

  it('blocks staff from seller subscription endpoints', async () => {
    const parentActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
    parentActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(mockContext('/seller/subscription/subscribe', { role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      guard.canActivate(mockContext('/commission/pay/bill-id', { role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      guard.canActivate(mockContext('/seller/staff', { role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);

    parentActivate.mockRestore();
  });
});
