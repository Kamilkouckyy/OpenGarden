import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Weed the herbs', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Focus on the mint bed', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ example: '2025-06-15', description: 'Formát YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID uživatele přiřazeného k úkolu' })
  @IsOptional()
  @IsInt()
  assignedTo?: number;

  @ApiPropertyOptional({
    enum: ['plot', 'report', 'event'],
    description: 'Typ entity, ke které je úkol přiřazen',
  })
  @IsOptional()
  @IsEnum(['plot', 'report', 'event'])
  linkedType?: 'plot' | 'report' | 'event';

  @ApiPropertyOptional({ example: 3, description: 'ID entity (musí být vyplněno spolu s linkedType)' })
  @ValidateIf((o) => o.linkedType !== undefined)
  @IsInt()
  linkedId?: number;
}
