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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
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
  @ApiOperation({ summary: 'Vytvoření úkolu' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiResponse({ status: 201, description: 'Úkol vytvořen' })
  create(
    @Body() dto: CreateTaskDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.tasksService.create(dto, parseInt(userId, 10));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Úprava úkolu (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.tasksService.update(id, dto, parseInt(userId, 10), role === 'admin');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Přepnutí stavu úkolu (toggle)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 200, description: 'Stav přepnut' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.tasksService.toggleStatus(id, parseInt(userId, 10), role === 'admin');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání úkolu (Author / Admin)' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiHeader({ name: 'X-User-Role', required: false })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  @ApiResponse({ status: 403, description: 'Pouze autor nebo admin' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    return this.tasksService.remove(id, parseInt(userId, 10), role === 'admin');
  }
}
