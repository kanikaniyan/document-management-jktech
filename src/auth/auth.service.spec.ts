import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../user/enums/user-role.enum';
import { User } from '../user/entites/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          }
        }
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user data without password if email and password are correct', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: UserRole.EDITOR,
        createAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'password');

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toMatchObject({
        id: '1',
        email: 'test@example.com',
        role: UserRole.EDITOR,
      });
    });

    it('should return null if email is not found', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password');

      expect(userService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: UserRole.EDITOR,
        createAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'wrongpassword');

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeNull();
    });

    describe('login', () => {
      it('should return an access token and user details', async () => {
        const mockUser: any = {
          id: '1',
          email: 'test@example.com',
          password: 'hashedpassword',
          role: UserRole.EDITOR,
          // createAt: new Date(),
          // updatedAt: new Date(),
        };

        const mockToken = 'mocked-jwt-token';
        jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

        const result = await authService.login(mockUser);

        expect(jwtService.sign).toHaveBeenCalledWith({
          email: mockUser.email,
          sub: mockUser.id,
          role: mockUser.role,
        });
  
        expect(result).toEqual({
          access_token: mockToken,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
          },
        });

      })
    });

  })
  
});
