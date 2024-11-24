import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../user/enums/user-role.enum';
import { User } from '../user/entites/user.entity';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          }
        }
      ]
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should return a valid JWT and user details on successful login', async () => {
      const mockLoginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        password: 'password',
        role: UserRole.ADMIN,
        createAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLoginResponse: any = {
        access_token: 'mocked-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: UserRole.ADMIN,
        }
      };

      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      const req = { user: mockUser };

      const result = await authController.login(mockLoginDto, req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockLoginResponse);
    })
  });

  describe('getProfile', () => {
    it('should return the user profile from the request object', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'user',
      };

      const req = { user: mockUser };

      const result = authController.getProfile(req);

      expect(result).toEqual(mockUser);
    });
  });

});
