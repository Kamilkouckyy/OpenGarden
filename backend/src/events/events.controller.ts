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
  Put,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';

@ApiTags('events')
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
  @ApiOperation({ summary: 'Vytvoření komunitní akce' })
  @ApiHeader({ name: 'X-User-Id', description: 'ID přihlášeného uživatele', required: true })
  @ApiResponse({ status: 201, description: 'Akce vytvořena' })
  @ApiResponse({ status: 400, description: 'Datum v minulosti' })
  create(
    @Body() dto: CreateEventDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.eventsService.create(dto, parseInt(userId, 10));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Úprava akce (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.eventsService.update(id, dto, parseInt(userId, 10), role === 'admin');
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Zrušení akce (Author / Admin)',
    description: 'Nastaví status na "cancelled". Linked úkoly jsou ovlivněny.',
  })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Akce zrušena' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.eventsService.cancel(id, parseInt(userId, 10), role === 'admin');
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Obnovení zrušené akce (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Akce obnovena' })
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.eventsService.restore(id, parseInt(userId, 10), role === 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazání akce (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Smazáno' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.eventsService.remove(id, parseInt(userId, 10), role === 'admin');
  }

  @Get(':id/participations')
  @ApiOperation({ summary: 'Přehled účastníků akce' })
  @ApiResponse({ status: 200, description: 'OK' })
  getParticipations(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getParticipations(id);
  }

  @Put(':id/participation')
  @ApiOperation({
    summary: 'Nastavení RSVP statusu (UC5)',
    description: 'Upsert – vytvoří nebo aktualizuje účast uživatele na akci.',
  })
  @ApiHeader({ name: 'X-User-Id', description: 'ID přihlášeného uživatele', required: true })
  @ApiResponse({ status: 200, description: 'Účast aktualizována' })
  @ApiResponse({ status: 400, description: 'Akce je zrušena' })
  updateParticipation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParticipationDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.eventsService.updateParticipation(id, parseInt(userId, 10), dto);
  }
}
