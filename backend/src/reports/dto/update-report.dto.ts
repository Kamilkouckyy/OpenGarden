import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReportDto {
  @ApiPropertyOptional({ example: 'Zlomené kolo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['new', 'in_progress', 'resolved'],
    description:
      'Změna na "resolved" automaticky dokončí linked úkoly a označí equipment jako functional',
  })
  @IsOptional()
  @IsEnum(['new', 'in_progress', 'resolved'])
  status?: 'new' | 'in_progress' | 'resolved';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  context?: string;
}
