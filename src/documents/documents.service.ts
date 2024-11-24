import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { User } from '../user/entites/user.entity';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {

    constructor(
        @InjectRepository(Document)
        private documentRepository: Repository<Document>,
    ) {}

    async createDoc (createDocumentDto: CreateDocumentDto, file: Express.Multer.File, user: User): Promise<Document> {
        const document = this.documentRepository.create({
            ...createDocumentDto,
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedBy: { id: user.id },
        });

        return this.documentRepository.save(document);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ items: Document[]; total: number }> {
        const [items, total] = await this.documentRepository.findAndCount({
            relations: ['uploadedBy'],
            select: {
                uploadedBy: {
                    id: true,
                    role: true,
                    email: true,
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });

        return { items, total };
    }

    async findOne(id: string): Promise<Document> {
        const document = await this.documentRepository.findOne({
            where: { id },
            relations: ['uploadedBy'],
            select: {
                uploadedBy: {
                    id: true,
                    role: true,
                    email: true,
                }
            }
        });

        if (!document) {
            throw new BadRequestException('Document not found');
        }

        return document;
    }

    async update(id: string, updateDocumentDto: UpdateDocumentDto, file: Express.Multer.File | null, user: User): Promise<Document> {
        const document = await this.findOne(id);

        if (!document) {
            throw new BadRequestException('Document not found');
        }

        if (!file) {
            throw new BadRequestException('Attach the document');
        }

        if (file) {
            document.fileName = file.originalname;
            document.filePath = file.path;
            document.fileSize = file.size;
            document.mimeType = file.mimetype;
        }

        document.uploadedBy = {...document.uploadedBy, id: user.id };

        Object.assign(document, updateDocumentDto);
        return this.documentRepository.save(document);
    }

    async remove(id: string): Promise<boolean> {
        const document = await this.findOne(id);

        if (!document) {
            throw new BadRequestException('User not found');
        }
        let isdeleted = await this.documentRepository.remove(document);

        return isdeleted ? true : false;
    }
}
