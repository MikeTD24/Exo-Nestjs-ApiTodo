import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service.js';
import {
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOkResponse({ description: 'Utilisateur trouvé, sans mot de passe.' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable.' })
  @ApiBadRequestResponse({ description: 'Identifiant invalide.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
