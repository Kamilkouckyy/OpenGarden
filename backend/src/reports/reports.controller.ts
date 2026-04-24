import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všech hlášení' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail hlášení' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Hlášení nenalezeno' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Vytvoření hlášení problému',
    description:
      'Pokud je vyplněno equipmentId, kontext se generuje automaticky.',
  })
  @ApiHeader({ name: 'X-User-Id', description: 'ID přihlášeného uživatele', required: true })
  @ApiResponse({ status: 201, description: 'Hlášení vytvořeno' })
  create(
    @Body() dto: CreateReportDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.reportsService.create(dto, parseInt(userId, 10));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Úprava hlášení (Author / Admin)',
    description:
      'Změna statusu na "resolved" automaticky:\n' +
      '- dokončí všechny linked úkoly\n' +
      '- označí linked equipment jako functional (ok)',
  })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.reportsService.update(id, dto, parseInt(userId, 10), role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání hlášení (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.reportsService.remove(id, parseInt(userId, 10), role === 'admin');
  }
}
