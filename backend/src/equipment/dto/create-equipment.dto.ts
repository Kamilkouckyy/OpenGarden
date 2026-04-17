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

  @ApiPropertyOptional({ enum: ['functional', 'non_functional'], default: 'functional' })
  @IsOptional()
  @IsEnum(['functional', 'non_functional'])
  status?: 'functional' | 'non_functional';
}
