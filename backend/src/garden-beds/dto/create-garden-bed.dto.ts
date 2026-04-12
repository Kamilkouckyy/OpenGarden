import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGardenBedDto {
  @ApiProperty({ example: 'Záhon A1', description: 'Název záhonu', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Slunný záhon u plotu' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['free', 'occupied'], default: 'free' })
  @IsOptional()
  @IsEnum({ free: 'free', occupied: 'occupied' })
  status?: 'free' | 'occupied';
}
