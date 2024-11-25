import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let localStrategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(localStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return a user if validation is successful', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await localStrategy.validate('test@example.com', 'password');
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(localStrategy.validate('wrong@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith('wrong@example.com', 'wrong-password');
    });

    it('should throw UnauthorizedException with the correct message if validation fails', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(localStrategy.validate('wrong@example.com', 'wrong-password')).rejects.toThrow(
        new UnauthorizedException('Email is not registered!'),
      );
    });
  });
});
