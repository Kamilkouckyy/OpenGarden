import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGardenBedDto {
  @ApiPropertyOptional({ example: 'Záhon B2' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['free', 'occupied'] })
  @IsOptional()
  @IsEnum({ free: 'free', occupied: 'occupied' })
  status?: 'free' | 'occupied';
}
