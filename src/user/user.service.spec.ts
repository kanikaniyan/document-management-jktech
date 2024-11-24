import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entites/user.entity';
import { UserRole } from './enums/user-role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let repository = jest.mocked<Repository<User>>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'Hashedpassword@123',
    role: UserRole.ADMIN,
    createAt: new Date(),
    updatedAt: new Date()
  }

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    })
  })

  describe('createUser', () => {
    it('should create and return new user', async () => {
      const createUserDto = { email: "new@example.com", password: 'Password@123', role: UserRole.ADMIN};
      const hashedPassword = 'Abc@1234';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ ...createUserDto, password: hashedPassword } as User);
      mockRepository.save.mockResolvedValue({ id: '2', ...createUserDto, password: hashedPassword } as User);

      const result = await service.createUser(createUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ id: '2', ...createUserDto, password: hashedPassword });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser({ email: 'test@example.com', password: "Abc@1234", role: UserRole.EDITOR }))
        .rejects.toThrow(ConflictException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    })

  })
 
  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('2');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '2' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    })
  });

  describe('updateUser', () => {
    it('should update a user and return the user', async () => {
      const updateUserDto = { password: 'newpassword' };
      // const hashedPassword = 'newhashedpassword';

      mockRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(updateUserDto.password);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const updatedUser = { ...mockUser, password: updateUserDto.password };
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 10);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException if new password is the same as the old one', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await expect(service.updateUser('1', { password: 'samepassword' }))
        .rejects.toThrow(ConflictException);

      expect(bcrypt.compare).toHaveBeenCalledWith('samepassword', mockUser.password);
    });
  });

  describe('remove', () => {
    it('should delete the user and return true', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      const result = await service.remove('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '999' } });
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  it('should handle unexpected behavior and return false if remove fails', async () => {
    
    mockRepository.findOne.mockResolvedValue(mockUser);
    mockRepository.remove.mockResolvedValue(null);

    const result = await service.remove('1');

    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    expect(result).toBe(false);
  });

});
