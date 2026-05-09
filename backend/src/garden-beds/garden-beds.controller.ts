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
import { GardenBedsService } from './garden-beds.service';
import { CreateGardenBedDto } from './dto/create-garden-bed.dto';
import { UpdateGardenBedDto } from './dto/update-garden-bed.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppUser } from '../auth/better-auth.service';

@ApiTags('garden-beds')
@Controller('garden-beds')
@UseGuards(BetterAuthGuard)
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
  @ApiOperation({ summary: 'Vytvoření záhonu (Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 201, description: 'Záhon vytvořen' })
  create(
    @Body() dto: CreateGardenBedDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.gardenBedsService.create(dto, user.role === 'admin');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Úprava záhonu (Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGardenBedDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.gardenBedsService.update(id, dto, user.role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání záhonu (Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.gardenBedsService.remove(id, user.role === 'admin');
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Rezervace záhonu' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 201, description: 'Záhon rezervován' })
  @ApiResponse({ status: 400, description: 'Záhon není volný nebo uživatel již záhon má' })
  claim(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.gardenBedsService.claim(id, user.id);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Uvolnění záhonu' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Záhon uvolněn' })
  release(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.gardenBedsService.release(id, user.id, user.role === 'admin');
  }
}
