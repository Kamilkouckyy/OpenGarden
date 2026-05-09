import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppUser } from '../auth/better-auth.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(BetterAuthGuard)
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
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 201, description: 'Hlášení vytvořeno' })
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.reportsService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Úprava hlášení (Author / Admin)',
    description:
      'Změna statusu na "resolved" automaticky:\n' +
      '- dokončí všechny linked úkoly\n' +
      '- označí linked equipment jako functional (ok)',
  })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.reportsService.update(id, dto, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání hlášení (Author / Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.reportsService.remove(id, user.id, user.role === 'admin');
  }
}
