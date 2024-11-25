import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../user/enums/user-role.enum';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  const mockExecutionContext = (role: UserRole | null, isPublic?: boolean, roles?: UserRole[]): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(role ? { user: { role } } : {}),
      }),
      getHandler: jest.fn(), // Mocked getHandler
      getClass: jest.fn(), // Mocked getClass
    } as unknown as ExecutionContext;
  };

  it('should allow access if isPublic is set to true', () => {
    jest.spyOn(reflector, 'get').mockImplementation((key, target) => {
      if (key === 'isPublic') return true;
      return null;
    });

    const context = mockExecutionContext(UserRole.VIEWER);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValueOnce(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = mockExecutionContext(UserRole.VIEWER);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role matches required roles', () => {
    jest.spyOn(reflector, 'get').mockReturnValueOnce(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = mockExecutionContext(UserRole.ADMIN);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should deny access if user role does not match required roles', () => {
    jest.spyOn(reflector, 'get').mockReturnValueOnce(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = mockExecutionContext(UserRole.EDITOR);
    expect(rolesGuard.canActivate(context)).toBe(false);
  });

});
