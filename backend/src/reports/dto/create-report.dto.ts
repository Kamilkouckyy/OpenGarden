import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'Zlomené kolo na kolečku', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Kolo se odlomilo při převozu kompostu.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', description: 'URL fotodůkazu' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID vybavení, pokud jde o problém s equipment' })
  @IsOptional()
  @IsInt()
  equipmentId?: number;

  @ApiPropertyOptional({ example: 'Equipment: Wheelbarrow', description: 'Textový kontext hlášení' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  context?: string;
}
