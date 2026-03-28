import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEquipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['ok', 'damaged', 'under_repair', 'retired'] })
  @IsOptional()
  @IsEnum(['ok', 'damaged', 'under_repair', 'retired'])
  status?: 'ok' | 'damaged' | 'under_repair' | 'retired';
}
