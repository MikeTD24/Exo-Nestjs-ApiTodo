import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiNoContentResponse, ApiBadRequestResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth-request.js';
import { TodoService } from './todo.service.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';

@Controller('todos')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Authentification requise ou token invalide.',
})
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Tâche créée.' })
  @ApiBadRequestResponse({
    description: 'Données invalides ou champ non autorisé.',
  })
  create(
    @Body() createTodoDto: CreateTodoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.todoService.create(createTodoDto, user.id);
  }

  @Get()
  @ApiOkResponse({ description: 'Liste des tâches de l’utilisateur connecté.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.todoService.findAll(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Tâche trouvée.' })
  @ApiNotFoundResponse({
    description: 'Tâche absente ou appartenant à un autre utilisateur.',
  })
  @ApiBadRequestResponse({ description: 'Identifiant invalide.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.todoService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Tâche mise à jour.' })
  @ApiNotFoundResponse({
    description: 'Tâche absente ou appartenant à un autre utilisateur.',
  })
  @ApiBadRequestResponse({ description: 'Identifiant ou données invalides.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.todoService.update(id, updateTodoDto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Tâche supprimée. Aucun contenu renvoyé.',
  })
  @ApiNotFoundResponse({
    description: 'Tâche absente ou appartenant à un autre utilisateur.',
  })
  @ApiBadRequestResponse({ description: 'Identifiant invalide.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.todoService.remove(id, user.id);
  }
}
