import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, ValidateIf } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto.js';

export class UpdateTodoDto extends PartialType(CreateTodoDto, {
  skipNullProperties: false,
}) {
  @ApiPropertyOptional({ example: true })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  done?: boolean;
}
