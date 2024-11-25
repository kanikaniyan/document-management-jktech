import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const mockExecutionContext = (): ExecutionContext =>
    ({
      switchToHttp: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext);

  it('should allow access to public routes', () => {
    jest.spyOn(reflector, 'get').mockReturnValueOnce(true); // `isPublic` is true

    const context = mockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should call the super.canActivate method for protected routes', async () => {
    jest.spyOn(reflector, 'get').mockReturnValueOnce(false); // `isPublic` is false

    const context = mockExecutionContext();
    const superCanActivateSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementationOnce(() => true);

    const result = guard.canActivate(context);

    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });
});
