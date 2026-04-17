import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Spring Bonfire', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Společné opékání a úklid zahrady' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-05-10T17:00:00.000Z', description: 'ISO 8601 datetime' })
  @IsDateString()
  date: string;
}
