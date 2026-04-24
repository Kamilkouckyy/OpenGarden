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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všeho vybavení' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.equipmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail vybavení' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Nenalezeno' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrace nového vybavení' })
  @ApiHeader({ name: 'X-User-Id', description: 'ID přihlášeného uživatele', required: true })
  @ApiResponse({ status: 201, description: 'Vybavení zaregistrováno' })
  create(
    @Body() dto: CreateEquipmentDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.equipmentService.create(dto, parseInt(userId, 10));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Úprava vybavení (Author / Admin)',
    description: 'Status "ok" se nastavuje automaticky při vyřešení repair reportu.',
  })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.equipmentService.update(id, dto, parseInt(userId, 10), role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání vybavení (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.equipmentService.remove(id, parseInt(userId, 10), role === 'admin');
  }
}
