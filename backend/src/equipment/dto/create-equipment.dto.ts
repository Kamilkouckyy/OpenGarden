import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Wheelbarrow', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Velké červené kolečko v kůlně' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['ok', 'damaged', 'under_repair', 'retired'], default: 'ok' })
  @IsOptional()
  @IsEnum(['ok', 'damaged', 'under_repair', 'retired'])
  status?: 'ok' | 'damaged' | 'under_repair' | 'retired';
}
