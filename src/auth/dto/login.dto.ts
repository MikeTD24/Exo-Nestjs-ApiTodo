import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  // La connexion vérifie le secret existant, pas la politique d'inscription.
  @ApiProperty({
    example: 'MonMotDePasse123!',
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
