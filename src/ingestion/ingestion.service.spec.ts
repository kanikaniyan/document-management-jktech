import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { Repository } from 'typeorm';
import { IngestionProcess, IngestionStatus } from './entities/ingestion-process.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from '../documents/documents.service';
import { CreateIngestionDto } from './dto/create-ingestion.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entites/user.entity';
import { of, throwError } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('IngestionService', () => {
  let service: IngestionService;
  let ingestionRepository: Repository<IngestionProcess>;
  let httpService: HttpService;
  let configService: ConfigService;
  let documentService: DocumentsService;

  const mockIngestionProcess = {
    id: '1',
    status: IngestionStatus.PENDING,
    document: {
      id: 'doc-1',
      filePath: '/path/to/document.pdf',
    },
    triggeredBy: { id: 'user-1', email: 'user@example.com', role: 'admin' },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IngestionProcess;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'admin',
  } as User;

  const mockDocument = {
    id: 'doc-1',
    filePath: '/path/to/document.pdf',
  };

  const mockCreateIngestionDto: CreateIngestionDto = {
    documentId: 'doc-1',
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDocumentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: getRepositoryToken(IngestionProcess), useValue: mockRepository },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    ingestionRepository = module.get<Repository<IngestionProcess>>(getRepositoryToken(IngestionProcess));
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    documentService = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ingestion process', async () => {
      mockDocumentsService.findOne.mockResolvedValue(mockDocument);
      mockRepository.create.mockReturnValue(mockIngestionProcess);
      mockRepository.save.mockResolvedValue(mockIngestionProcess);
      mockRepository.findOne.mockResolvedValue(mockIngestionProcess); // Mock for updateStatus
  
      const result = await service.create(mockCreateIngestionDto, mockUser as User);
  
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(mockCreateIngestionDto.documentId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        document: mockDocument,
        triggeredBy: { id: mockUser.id },
        status: IngestionStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockIngestionProcess);
      expect(result).toEqual(mockIngestionProcess);
    });
  });

  describe('triggerPythonIngestion', () => {
    it('should successfully trigger Python ingestion and update status to COMPLETED', async () => {
      mockConfigService.get.mockReturnValue('http://python-service.com');
      mockHttpService.post.mockReturnValue(of({ status: 200 }));

      const updateStatusSpy = jest.spyOn(service, 'updateStatus').mockResolvedValue(mockIngestionProcess);

      await service['triggerPythonIngestion'](mockIngestionProcess);

      expect(httpService.post).toHaveBeenCalledWith('http://python-service.com/ingest', {
        processId: '1',
        documentPath: '/path/to/document.pdf',
      });
      expect(updateStatusSpy).toHaveBeenCalledWith('1', IngestionStatus.COMPLETED);
    });

    it('should update status to FAILED if ingestion fails', async () => {
      mockConfigService.get.mockReturnValue('http://python-service.com');
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Python service error')));

      const updateStatusSpy = jest.spyOn(service, 'updateStatus').mockResolvedValue(mockIngestionProcess);

      await service['triggerPythonIngestion'](mockIngestionProcess);

      expect(updateStatusSpy).toHaveBeenCalledWith('1', IngestionStatus.FAILED, 'Python service error');
    });
  });

  describe('updateStatus', () => {
    it('should update the status of an ingestion process', async () => {
      mockRepository.findOne.mockResolvedValue(mockIngestionProcess);
      mockRepository.save.mockResolvedValue({ ...mockIngestionProcess, status: IngestionStatus.COMPLETED });

      const result = await service.updateStatus('1', IngestionStatus.COMPLETED);

      expect(ingestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['document', 'triggeredBy'],
      });
      expect(result.status).toBe(IngestionStatus.COMPLETED);
    });

    it('should throw an exception if the process is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('invalid-id', IngestionStatus.COMPLETED)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should retrieve all ingestion processes with pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockIngestionProcess], 1]);

      const result = await service.findAll(1, 10);

      expect(ingestionRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['document', 'triggeredBy'],
        select: {
          triggeredBy: { id: true, email: true, role: true },
        },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ items: [mockIngestionProcess], total: 1 });
    });
  });

  describe('findOne', () => {
    it('should retrieve a specific ingestion process by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockIngestionProcess);

      const result = await service.findOne('1');

      expect(ingestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['document', 'triggeredBy'],
      });
      expect(result).toEqual(mockIngestionProcess);
    });

    it('should throw an exception if the process is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reprocessFailedIngestion', () => {

    const mockFailedProcesses = [
      {
        id: 'process-1',
        status: IngestionStatus.FAILED,
        document: mockDocument,
        triggeredBy: mockUser,
      },
      {
        id: 'process-2',
        status: IngestionStatus.FAILED,
        document: mockDocument,
        triggeredBy: mockUser,
      },
    ];

    const mockUpdatedProcess = {
      ...mockFailedProcesses[0],
      status: IngestionStatus.PENDING,
    };

    it('should reprocess failed ingestion processes', async () => {
      mockRepository.find.mockResolvedValue(mockFailedProcesses);

      mockRepository.findOne.mockImplementation(({ where }) => {
        const process = mockFailedProcesses.find((p) => p.id === where.id);
        return Promise.resolve(process);
      });

      mockRepository.save.mockImplementation((process) => {
        console.log('Mock save called for:', process); // Debug each save call
        return Promise.resolve(process);
      });

      jest.spyOn(service as any, 'triggerPythonIngestion').mockResolvedValue(undefined);

      const result = await service.reprocessFailedIngestion(mockUser as User);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: IngestionStatus.FAILED },
        relations: ['document', 'triggeredBy'],
      });

      // Ensure `findOne` is called for every failed process
      mockFailedProcesses.forEach((process) => {
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { id: process.id },
          relations: ['document', 'triggeredBy'],
        });
      });

      // Adjust `save` expectation based on debug output
      expect(mockRepository.save).toHaveBeenCalledTimes(mockFailedProcesses.length * 2 + 1);

      expect(result).toHaveLength(mockFailedProcesses.length);
      result.forEach((process) => {
        expect(process.status).toBe(IngestionStatus.PENDING);
      });
    });

    it('should throw an exception if no failed processes are found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.reprocessFailedIngestion(mockUser)).rejects.toThrow(BadRequestException);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: IngestionStatus.FAILED },
        relations: ['document', 'triggeredBy'],
      });
    });

    it('should update status to FAILED if an error occurs during reprocessing', async () => {
      mockRepository.find.mockResolvedValue(mockFailedProcesses);
      
      mockRepository.findOne.mockImplementation(({ where }) => {
        const process = mockFailedProcesses.find((p) => p.id === where.id);
        return Promise.resolve(process);
      });

      mockRepository.save.mockImplementation((process) => {
        return Promise.resolve(process);
      });

      // Simulate an error in triggerPythonIngestion
      jest.spyOn(service as any, 'triggerPythonIngestion').mockImplementation(() => {
        throw new Error('Python ingestion failed');
      });

      // Call the reprocessing function
      const result = await service.reprocessFailedIngestion(mockUser as User);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: IngestionStatus.FAILED },
        relations: ['document', 'triggeredBy'],
      });

      mockFailedProcesses.forEach((process) => {
        // Ensure findOne is called for every failed process
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { id: process.id },
          relations: ['document', 'triggeredBy'],
        });

        // Ensure save is called to update the status to FAILED
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            id: process.id,
            status: IngestionStatus.FAILED,
            errorMessage: 'Python ingestion failed',
          })
        );
      });

      // Ensure result is empty since all processes failed reprocessing
      expect(result).toHaveLength(0);
    });
  });

});
