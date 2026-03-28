import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGardenBedDto {
  @ApiPropertyOptional({ example: 'B2' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['available', 'reserved', 'inactive'] })
  @IsOptional()
  @IsEnum(['available', 'reserved', 'inactive'])
  status?: 'available' | 'reserved' | 'inactive';
}
