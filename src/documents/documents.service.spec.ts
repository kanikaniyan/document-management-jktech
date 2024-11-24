import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { User } from '../user/entites/user.entity';
import { UserRole } from '../user/enums/user-role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { BadRequestException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: Repository<Document>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    password: 'hashedpassword',
    createAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocument: Document = {
    id: 'doc-123',
    title: 'Test Document',
    fileName: 'file.pdf',
    filePath: '/uploads/file.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    uploadedBy: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository
        }
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    repository = module.get<Repository<Document>>(getRepositoryToken(Document));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDoc', () => {
    it('should create a new document', async () => {
      const createDocumentDto: CreateDocumentDto = {
        title: 'Test Document',
      };

      const mockFile: Express.Multer.File = {
        originalname: 'file.pdf',
        path: '/uploads/file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        fieldname: '',
        buffer: Buffer.from(''),
        encoding: '',
        destination: '',
        filename: '',
        stream: null,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockDocument);
      jest.spyOn(repository, 'save').mockResolvedValue(mockDocument);

      const result = await service.createDoc(createDocumentDto, mockFile, mockUser);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDocumentDto,
        fileName: mockFile.originalname,
        filePath: mockFile.path,
        mimeType: mockFile.mimetype,
        fileSize: mockFile.size,
        uploadedBy: { id: mockUser.id },
      });

      expect(repository.save).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('findAll', () => {
    it('should return paginated documents', async () => {
      const documents = [mockDocument];
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([documents, 1]);

      const result = await service.findAll(1, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['uploadedBy'],
        select: {
          uploadedBy: { id: true, role: true, email: true },
        },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual({ items: documents, total: 1 });

    })
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDocument);

      const result = await service.findOne('doc-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        relations: ['uploadedBy'],
        select: {
          uploadedBy: { id: true, role: true, email: true },
        },
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw an exception if document not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateDocumentDto: UpdateDocumentDto = { title: 'Updated Title' };
      const mockFile: Express.Multer.File = {
        originalname: 'updated.pdf',
        path: '/uploads/updated.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        fieldname: '',
        buffer: Buffer.from(''),
        encoding: '',
        destination: '',
        filename: '',
        stream: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      jest.spyOn(repository, 'save').mockResolvedValue(mockDocument);

      const result = await service.update('doc-123', updateDocumentDto, mockFile, mockUser);

      expect(service.findOne).toHaveBeenCalledWith('doc-123');

      expect(result).toEqual(mockDocument);
    });

    it('should throw an exception if document is not provided', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.update('doc-123', {}, null, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw an exception if file is not provided', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);

      await expect(service.update('doc-123', {}, null, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a document and return true', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockDocument);

      const result = await service.remove('doc-123');

      expect(service.findOne).toHaveBeenCalledWith('doc-123');
      expect(repository.remove).toHaveBeenCalledWith(mockDocument);
      expect(result).toBe(true);
    });

    it('should throw an exception if document not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should return false if it fails to delete', async () => {
      const mockDocument = {
        id: 'valid-id',
        fileName: 'example.txt',
        filePath: '/path/to/example.txt',
        uploadedBy: { id: 'user-id' },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument as any);
      jest.spyOn(repository, 'remove').mockResolvedValue(null);

      let result = await service.remove('invalid-id');

      expect(repository.remove).toHaveBeenCalledWith(mockDocument);
      expect(result).toBe(false);
    });
  });

});
