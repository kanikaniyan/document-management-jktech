import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngestionProcess, IngestionStatus } from './entities/ingestion-process.entity';
import { Repository } from 'typeorm';
import { DocumentsService } from '../documents/documents.service';
import { ConfigService } from '@nestjs/config';
import { CreateIngestionDto } from './dto/create-ingestion.dto';
import { User } from '../user/entites/user.entity';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class IngestionService {

    constructor(
        @InjectRepository(IngestionProcess)
        private ingestionRepository: Repository<IngestionProcess>,
        private httpService: HttpService,
        private configService: ConfigService,
        private documentService: DocumentsService,
    ) {}

    async create(createIngestionDto: CreateIngestionDto, user: User): Promise<IngestionProcess> {
        const document = await this.documentService.findOne(createIngestionDto.documentId);

        const ingestionProcess = this.ingestionRepository.create({
            document,
            triggeredBy: {id: user.id},
            status: IngestionStatus.PENDING,
        });

        const savedProcess = await this.ingestionRepository.save(ingestionProcess);

        // Trigger Python backend ingestion
        this.triggerPythonIngestion(savedProcess);

        return savedProcess;
    }

    private async triggerPythonIngestion(process: IngestionProcess) {
        try {
            const pythonServiceUrl = this.configService.get('PYTHON_SERVICE_URL');
            await firstValueFrom(
                this.httpService.post(`${pythonServiceUrl}/ingest`, {
                    processId: process.id,
                    documentPath: process.document.filePath,
                })
            );

            await this.updateStatus(process.id, IngestionStatus.COMPLETED);

        } catch(error) {
            await this.updateStatus(process.id, IngestionStatus.FAILED, error.message);
        }
    }

    async updateStatus(id: string, status: IngestionStatus, errorMessage?: string): Promise<IngestionProcess> {
        const process = await this.findOne(id);
        process.status = status;
        if (errorMessage) {
            process.errorMessage = errorMessage;
        }

        return this.ingestionRepository.save(process);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ items: IngestionProcess[]; total: number }> {
        const [items, total] = await this.ingestionRepository.findAndCount({
            relations: ['document', 'triggeredBy'],
            select: {
                triggeredBy: {
                    id: true,
                    email: true,
                    role: true,
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { items, total };
    } 

    async findOne(id: string): Promise<IngestionProcess> {
        const process = await this.ingestionRepository.findOne({
            where: { id },
            relations: ['document', 'triggeredBy'],
        });

        if (!process) {
            throw new BadRequestException('Ingestion process not found');
        }

        return process;
    }

    async reprocessFailedIngestion(user: User): Promise<IngestionProcess[]> {
        const failedProcesses = await this.ingestionRepository.find({
            where: { status: IngestionStatus.FAILED },
            relations: ['document', 'triggeredBy'],
        });

        if (!failedProcesses.length) {
            throw new BadRequestException('No failed ingestion processes found')
        }

        const reprocessed = [];

        for (const process of failedProcesses) {
            try {
                process.status = IngestionStatus.PENDING;
                process.triggeredBy = { id: user.id, email: user.email, role: user.role };

                await this.updateStatus(process.id, IngestionStatus.PENDING);
                
                await this.triggerPythonIngestion(process);

                reprocessed.push(process);
            } catch (error) {
                await this.updateStatus(process.id, IngestionStatus.FAILED, error.message);
            }
        }

        return reprocessed;
    }

}
