import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { UserRole } from '../user/enums/user-role.enum';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { BadRequestException } from '@nestjs/common';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocument = {
    id: '1',
    title: 'Test Document',
    fileName: 'test.pdf',
    filePath: '/path/to/test.pdf',
    mimeType: 'application/pdf',
    fileSize: 12345,
    uploadedBy: { id: 'user-id', email: 'user@example.com', role: UserRole.EDITOR },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-id',
    email: 'user@example.com',
    role: UserRole.ADMIN,
  };

  const mockDocumentsService = {
    createDoc: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService, useValue: mockDocumentsService
        }
      ]
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDocument', () => {
    it('should create a document', async () => {
      const createDto: CreateDocumentDto = { title: 'Test Document' };
      const file = {
        originalname: 'test.pdf',
        path: '/path/to/test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
      } as Express.Multer.File;

      mockDocumentsService.createDoc.mockResolvedValue(mockDocument);

      const result = await controller.createDocument(createDto, file, { user: mockUser });
      expect(service.createDoc).toHaveBeenCalledWith(createDto, file, mockUser);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('findAll', () => {
    it('should retrieve all documents with pagination', async () => {
      const mockResponse = { items: [mockDocument], total: 1 };
      mockDocumentsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should retrieve a document by id', async () => {
      mockDocumentsService.findOne.mockResolvedValue(mockDocument);

      const result = await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDocument);
    });

    it('should throw an exception if the document is not found', async () => {
      mockDocumentsService.findOne.mockRejectedValue(new BadRequestException('Document not found'));

      await expect(controller.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDocument', () => {
    it('should update a document', async () => {
      const updateDto: Partial<CreateDocumentDto> = { title: 'Updated Document' };
      const file = {
        originalname: 'updated.pdf',
        path: '/path/to/updated.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      mockDocumentsService.update.mockResolvedValue(mockDocument);

      const result = await controller.updateDocument('1', updateDto, file, { user: mockUser });
      expect(service.update).toHaveBeenCalledWith('1', updateDto, file, mockUser);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('remove', () => {
    it('should delete a document', async () => {
      mockDocumentsService.remove.mockResolvedValue(true);

      const result = await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });

    it('should throw an exception if the document is not found', async () => {
      mockDocumentsService.remove.mockRejectedValue(new BadRequestException('Document not found'));

      await expect(controller.remove('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });
  
});
