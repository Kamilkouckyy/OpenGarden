import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateParticipationDto {
  @ApiProperty({
    enum: ['going', 'not_going', 'maybe'],
    description: 'RSVP status uživatele na danou akci',
  })
  @IsEnum(['going', 'not_going', 'maybe'])
  status: 'going' | 'not_going' | 'maybe';
}
