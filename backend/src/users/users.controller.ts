import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppUser } from '../auth/better-auth.service';

@ApiTags('users')
@Controller('users')
@UseGuards(BetterAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Seznam všech uživatelů' })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll(@CurrentUser() user: AppUser) {
    this.ensureAdmin(user);
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Aktuální přihlášený uživatel' })
  getMe(@CurrentUser() user: AppUser) {
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail uživatele' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Uživatel nenalezen' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AppUser) {
    this.ensureAdmin(user);
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrace nového uživatele' })
  @ApiResponse({ status: 201, description: 'Uživatel vytvořen' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AppUser) {
    this.ensureAdmin(user);
    return this.usersService.create({ ...dto, role: dto.role ?? 'member' });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizace uživatele' })
  @ApiResponse({ status: 200, description: 'Aktualizováno' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() user: AppUser) {
    this.ensureAdmin(user);
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Smazání uživatele' })
  @ApiResponse({ status: 204, description: 'Smazáno' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AppUser) {
    this.ensureAdmin(user);
    return this.usersService.remove(id);
  }

  private ensureAdmin(user: AppUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Pouze admin může spravovat uživatele');
    }
  }
}
