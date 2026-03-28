import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Jan Novák', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'jan.novak@example.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'securePassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiPropertyOptional({ enum: ['member', 'admin'], default: 'member' })
  @IsOptional()
  @IsEnum(['member', 'admin'])
  role?: 'member' | 'admin';
}
