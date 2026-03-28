import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGardenBedDto {
  @ApiProperty({ example: 'A1', description: 'Označení záhonu', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  label: string;

  @ApiPropertyOptional({ example: 'Slunný záhon u plotu' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['available', 'reserved', 'inactive'], default: 'available' })
  @IsOptional()
  @IsEnum(['available', 'reserved', 'inactive'])
  status?: 'available' | 'reserved' | 'inactive';
}
