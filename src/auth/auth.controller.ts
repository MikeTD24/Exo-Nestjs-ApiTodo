import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et obtenir un JWT valable une heure' })
  @ApiOkResponse({
    description: 'Token JWT',
    schema: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
      required: ['access_token'],
    },
  })
  @ApiBadRequestResponse({ description: 'Données invalides.' })
  @ApiUnauthorizedResponse({ description: 'Email ou mot de passe incorrect.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiCreatedResponse({ description: 'Compte créé, sans le champ password.' })
  @ApiBadRequestResponse({
    description: 'Données invalides ou champ non autorisé.',
  })
  @ApiConflictResponse({ description: 'Email déjà utilisé.' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }
}
