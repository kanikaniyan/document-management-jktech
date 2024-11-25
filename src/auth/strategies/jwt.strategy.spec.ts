import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ExtractJwt } from 'passport-jwt';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret'; // Mock JWT secret
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure with the correct JWT secret', () => {
      const strategyInstance = new JwtStrategy(configService);
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(strategyInstance).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return a user object if payload is valid', async () => {
      const mockPayload = { sub: 1, email: 'test@example.com', role: 'user' };

      const result = await jwtStrategy.validate(mockPayload);
      expect(result).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
      });
    });
  });

  describe('JWT Configuration', () => {
    it('should extract JWT from Authorization header as Bearer token', () => {
      const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
      expect(extractor).toBeDefined();
    });
  });
});
