import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    createUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateUser: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'admin',
    password: 'hashedpassword',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { email: 'newuser@example.com', password: 'password', role: UserRole.ADMIN };
      const newUser = { ...mockUser, email: createUserDto.email };
  
      mockUserService.createUser.mockResolvedValue(newUser);
  
      const result = await controller.createUser(createUserDto);
  
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(newUser);
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      mockUserService.findAll.mockResolvedValue([mockUser]);
  
      const result = await controller.findAllUsers();
  
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findUserById', () => {
    it('should return a user by ID', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);
  
      const result = await controller.findUserById('1');
  
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateUserDto };
  
      mockUserService.updateUser.mockResolvedValue(updatedUser);
  
      const result = await controller.updateUser('1', updateUserDto);
  
      expect(service.updateUser).toHaveBeenCalledWith('1', updateUserDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and return true', async () => {
      mockUserService.remove.mockResolvedValue(true);
  
      const result = await controller.deleteUser('1');
  
      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });
  
    it('should throw NotFoundException if the user does not exist', async () => {
      mockUserService.remove.mockRejectedValue(new NotFoundException('User not found'));
  
      await expect(controller.deleteUser('999')).rejects.toThrow(NotFoundException);
  
      expect(service.remove).toHaveBeenCalledWith('999');
    });
  });

});
