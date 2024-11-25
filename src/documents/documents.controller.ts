import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {

    constructor(private readonly documentsService: DocumentsService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload document' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    createDocument(@Body() createDocumentDto: CreateDocumentDto, @UploadedFile() file: Express.Multer.File, @Request() req,) {
        if (!file || file.size === 0) {
            throw new BadRequestException('Please upload a document');
        }
        return this.documentsService.createDoc(createDocumentDto, file, req.user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all documents' })
    findAll(@Query('page') page: number, @Query('limit') limit: number) {
        return this.documentsService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get document by id' })
    findOne(@Param('id') id: string) {
      return this.documentsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Update document' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    updateDocument(
        @Param('id') id: string,
        @Body() updateDocumentDto: Partial<CreateDocumentDto>,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.documentsService.update(id, updateDocumentDto, file, req.user);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete document' })
    remove(@Param('id') id: string) {
      return this.documentsService.remove(id);
    }
}
