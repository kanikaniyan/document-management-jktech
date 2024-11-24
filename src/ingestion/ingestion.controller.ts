import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IngestionService } from './ingestion.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { CreateIngestionDto } from './dto/create-ingestion.dto';

@ApiTags('ingestion')
@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngestionController {
    constructor(private readonly ingestionService: IngestionService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Trigger document ingestion' })
    @ApiResponse({ status: 201, description: 'Ingestion process started' })
    create(@Body() createIngestionDto: CreateIngestionDto, @Request() req) {
        return this.ingestionService.create(createIngestionDto, req.user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all ingestion processes' })
    findALL(@Query('page') page: number, @Query('limit') limit: number) {
        return this.ingestionService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get ingestion process by id' })
    findOne(@Param('id') id: string) {
        return this.ingestionService.findOne(id);
    }

    @Post('reprocess-failed')
    @Roles(UserRole.ADMIN)
    async reprocessFailedIngestion(@Request() req) {
        return this.ingestionService.reprocessFailedIngestion(req.user);
    }
}
