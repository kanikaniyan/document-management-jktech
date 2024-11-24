import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionProcess } from './entities/ingestion-process.entity';
import { DocumentsModule } from '../documents/documents.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TypeOrmModule.forFeature([IngestionProcess]),
    HttpModule,    
    DocumentsModule,
    ],
    controllers: [IngestionController],
    providers: [IngestionService],
    exports: [IngestionService],
})
export class IngestionModule {}
