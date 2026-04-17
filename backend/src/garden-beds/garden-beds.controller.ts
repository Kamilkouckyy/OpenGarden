import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GardenBedsService } from './garden-beds.service';
import { CreateGardenBedDto } from './dto/create-garden-bed.dto';
import { UpdateGardenBedDto } from './dto/update-garden-bed.dto';

const AUTH_HEADERS = [
  { name: 'X-User-Id', description: 'ID přihlášeného uživatele', required: true },
  { name: 'X-User-Role', description: '"admin" nebo "member"', required: false },
];

@ApiTags('garden-beds')
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
  @ApiOperation({ summary: 'Vytvoření záhonu (Admin)' })
  @ApiHeader(AUTH_HEADERS[0])
  @ApiResponse({ status: 201, description: 'Záhon vytvořen' })
  create(@Body() dto: CreateGardenBedDto) {
    return this.gardenBedsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Úprava záhonu (Admin)' })
  @ApiHeader(AUTH_HEADERS[0])
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGardenBedDto) {
    return this.gardenBedsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazání záhonu (Admin)' })
  @ApiHeader(AUTH_HEADERS[0])
  @ApiResponse({ status: 200, description: 'Smazáno' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gardenBedsService.remove(id);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Rezervace záhonu' })
  @ApiHeader(AUTH_HEADERS[0])
  @ApiResponse({ status: 201, description: 'Záhon rezervován' })
  @ApiResponse({ status: 400, description: 'Záhon není volný nebo uživatel již záhon má' })
  claim(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
  ) {
    return this.gardenBedsService.claim(id, parseInt(userId, 10));
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Uvolnění záhonu' })
  @ApiHeader(AUTH_HEADERS[0])
  @ApiHeader(AUTH_HEADERS[1])
  @ApiResponse({ status: 200, description: 'Záhon uvolněn' })
  release(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.gardenBedsService.release(id, parseInt(userId, 10), role === 'admin');
  }
}
