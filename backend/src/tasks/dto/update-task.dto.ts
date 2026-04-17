import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'done'] })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'done'])
  status?: 'open' | 'in_progress' | 'done';

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  resolverId?: number;

  @ApiPropertyOptional({ enum: ['plot', 'report', 'event'] })
  @IsOptional()
  @IsEnum(['plot', 'report', 'event'])
  linkedType?: 'plot' | 'report' | 'event';

  @ApiPropertyOptional()
  @ValidateIf((o) => o.linkedType !== undefined)
  @IsInt()
  linkedId?: number;
}
