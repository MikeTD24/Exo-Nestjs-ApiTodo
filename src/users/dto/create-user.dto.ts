import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'alice@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'MonMotDePasse123!',
    format: 'password',
    writeOnly: true,
    minLength: 12,
    maxLength: 128,
  })
  // Le mot de passe est validé tel quel : aucun trim ni changement de casse.
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
