import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { UserRole } from '../user/enums/user-role.enum';
import { CreateIngestionDto } from './dto/create-ingestion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('IngestionController', () => {
  let controller: IngestionController;
  let ingestionService: IngestionService;

  const mockUser = {
    id: 'user-1',
    role: UserRole.ADMIN,
  };

  const mockCreateIngestionDto: CreateIngestionDto = {
    documentId: 'doc-1',
  };

  const mockIngestionProcess = {
    id: 'process-1',
    documentId: 'doc-1',
    status: 'PENDING',
  };

  const mockIngestionService = {
    create: jest.fn().mockResolvedValue(mockIngestionProcess),
    findAll: jest.fn().mockResolvedValue([mockIngestionProcess]),
    findOne: jest.fn().mockResolvedValue(mockIngestionProcess),
    reprocessFailedIngestion: jest.fn().mockResolvedValue([mockIngestionProcess]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService
        }
      ]
    })
    .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<IngestionController>(IngestionController);
    ingestionService = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should trigger document ingestion process', async () => {
      const result = await controller.create(mockCreateIngestionDto, {
        user: mockUser,
      });
      expect(result).toEqual(mockIngestionProcess);
      expect(ingestionService.create).toHaveBeenCalledWith(mockCreateIngestionDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all ingestion processes', async () => {
      const result = await controller.findALL(1, 10);
      expect(result).toEqual([mockIngestionProcess]);
      expect(ingestionService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return an ingestion process by id', async () => {
      const result = await controller.findOne('process-1');
      expect(result).toEqual(mockIngestionProcess);
      expect(ingestionService.findOne).toHaveBeenCalledWith('process-1');
    });
  });

  describe('reprocessFailedIngestion', () => {
    it('should reprocess failed ingestion processes', async () => {
      const result = await controller.reprocessFailedIngestion({ user: mockUser });
      expect(result).toEqual([mockIngestionProcess]);
      expect(ingestionService.reprocessFailedIngestion).toHaveBeenCalledWith(mockUser);
    });
  });
  
});
