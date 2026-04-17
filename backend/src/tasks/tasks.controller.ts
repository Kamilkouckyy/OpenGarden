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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všech úkolů' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail úkolu' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Úkol nenalezen' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Vytvoření úkolu',
    description:
      'Context se generuje automaticky z linked entity. ' +
      'linkedType a linkedId musí být vyplněny oba nebo ani jeden.',
  })
  @ApiResponse({ status: 201, description: 'Úkol vytvořen' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  create(
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.tasksService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Úprava úkolu (Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.tasksService.update(id, dto, user.id, user.role === 'admin');
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Přepnutí stavu úkolu (toggle open ↔ done)',
    description: 'Přepne status: open/in_progress → done, done → in_progress.',
  })
  @ApiResponse({ status: 200, description: 'Stav přepnut' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.tasksService.toggleStatus(id, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Smazání úkolu (Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Smazáno' })
  @ApiResponse({ status: 401, description: 'Nepřihlášen' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; role: string };
    return this.tasksService.remove(id, user.id, user.role === 'admin');
  }
}
