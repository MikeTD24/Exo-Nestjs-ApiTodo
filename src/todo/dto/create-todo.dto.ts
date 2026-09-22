import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, Matches } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ example: 'Réviser NestJS' })
  @IsString()
  @Matches(/\S/, { message: 'Le titre ne peut pas être vide.' })
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Revoir les modules et les services' })
  @IsString()
  @MaxLength(10000)
  description: string;
}
