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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppUser } from '../auth/better-auth.service';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(BetterAuthGuard)
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
  @ApiOperation({ summary: 'Vytvoření úkolu' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 201, description: 'Úkol vytvořen' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.tasksService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Úprava úkolu (Author / Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.tasksService.update(id, dto, user.id, user.role === 'admin');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Přepnutí stavu úkolu (toggle)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 200, description: 'Stav přepnut' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.tasksService.toggleStatus(id, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání úkolu (Author / Admin)' })
  @ApiHeader({ name: 'Cookie', description: 'Better Auth session cookie', required: true })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.tasksService.remove(id, user.id, user.role === 'admin');
  }
}
