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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppUser } from '../auth/better-auth.service';

@ApiTags('equipment')
@Controller('equipment')
@UseGuards(BetterAuthGuard)
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
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 201, description: 'Vybavení zaregistrováno' })
  create(
    @Body() dto: CreateEquipmentDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.equipmentService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Úprava vybavení (Author / Admin)',
    description: 'Status "ok" se nastavuje automaticky při vyřešení repair reportu.',
  })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.equipmentService.update(id, dto, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání vybavení (Author / Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.equipmentService.remove(id, user.id, user.role === 'admin');
  }
}
