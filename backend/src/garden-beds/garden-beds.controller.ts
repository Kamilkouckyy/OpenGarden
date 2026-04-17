import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GardenBedsService } from './garden-beds.service';
import { CreateGardenBedDto } from './dto/create-garden-bed.dto';
import { UpdateGardenBedDto } from './dto/update-garden-bed.dto';

@ApiTags('garden-beds')
@ApiBearerAuth()
@Controller('garden-beds')
export class GardenBedsController {
  constructor(private readonly gardenBedsService: GardenBedsService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všech záhonů' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.gardenBedsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail záhonu' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Záhon nenalezen' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gardenBedsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Vytvoření záhonu (Admin)' })
  @ApiResponse({ status: 201, description: 'Záhon vytvořen' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  @ApiResponse({ status: 403, description: 'Pouze admin' })
  create(@Body() dto: CreateGardenBedDto) {
    return this.gardenBedsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Úprava záhonu (Admin)' })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  @ApiResponse({ status: 403, description: 'Pouze admin' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGardenBedDto) {
    return this.gardenBedsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Smazání záhonu (Admin)',
    description: 'Kaskádně smaže všechny linked tasky a reporty.',
  })
  @ApiResponse({ status: 200, description: 'Smazáno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  @ApiResponse({ status: 403, description: 'Pouze admin' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gardenBedsService.remove(id);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Rezervace záhonu',
    description: 'Gardener si nárokuje volný záhon. Max 1 záhon na uživatele.',
  })
  @ApiResponse({ status: 201, description: 'Záhon rezervován' })
  @ApiResponse({ status: 400, description: 'Záhon není volný nebo uživatel již záhon má' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  claim(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.gardenBedsService.claim(id, user.id);
  }

  @Post(':id/release')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Uvolnění záhonu',
    description: 'Vlastník nebo Admin uvolní záhon.',
  })
  @ApiResponse({ status: 200, description: 'Záhon uvolněn' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  release(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.gardenBedsService.release(id, user.id, user.role === 'admin');
  }
}
