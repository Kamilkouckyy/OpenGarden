import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všech komunitních akcí' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail akce' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Akce nenalezena' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Vytvoření komunitní akce' })
  @ApiResponse({ status: 201, description: 'Akce vytvořena' })
  @ApiResponse({ status: 400, description: 'Datum v minulosti' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  create(
    @Body() dto: CreateEventDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.eventsService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Úprava akce (Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.eventsService.update(id, dto, user.id, user.role === 'admin');
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Zrušení akce (Author / Admin)',
    description: 'Nastaví status na "cancelled". Linked úkoly jsou ovlivněny.',
  })
  @ApiResponse({ status: 200, description: 'Akce zrušena' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.eventsService.cancel(id, user.id, user.role === 'admin');
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obnovení zrušené akce (Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Akce obnovena' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.eventsService.restore(id, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Smazání akce (Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Smazáno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.eventsService.remove(id, user.id, user.role === 'admin');
  }

  @Get(':id/participations')
  @ApiOperation({ summary: 'Přehled účastníků akce' })
  @ApiResponse({ status: 200, description: 'OK' })
  getParticipations(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getParticipations(id);
  }

  @Put(':id/participation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Nastavení RSVP statusu (UC5)',
    description: 'Upsert – vytvoří nebo aktualizuje účast uživatele na akci.',
  })
  @ApiResponse({ status: 200, description: 'Účast aktualizována' })
  @ApiResponse({ status: 400, description: 'Akce je zrušena' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  updateParticipation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParticipationDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.eventsService.updateParticipation(id, user.id, dto);
  }
}
