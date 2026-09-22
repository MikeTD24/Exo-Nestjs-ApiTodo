import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { Todo } from './entities/todo.entity.js';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo) private readonly todoRepository: Repository<Todo>,
  ) {}

  create(dto: CreateTodoDto, userId: number): Promise<Todo> {
    // Le propriétaire vient du JWT, jamais du body envoyé par le client.
    return this.todoRepository.save(
      this.todoRepository.create({
        title: dto.title,
        description: dto.description,
        userId,
        done: false,
      }),
    );
  }

  findAll(userId: number): Promise<Todo[]> {
    return this.todoRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id, userId } });
    // Même 404 pour une tâche absente ou appartenant à un autre compte.
    if (!todo) throw new NotFoundException(`Aucune tâche avec l'id ${id}`);
    return todo;
  }

  async update(id: number, dto: UpdateTodoDto, userId: number): Promise<Todo> {
    await this.findOne(id, userId);
    const changes: Partial<Todo> = {};
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.description !== undefined) changes.description = dto.description;
    if (dto.done !== undefined) changes.done = dto.done;
    // Le filtre propriétaire est conservé jusque dans la requête d'écriture.
    if (Object.keys(changes).length) {
      const result = await this.todoRepository.update({ id, userId }, changes);
      if (!result.affected)
        throw new NotFoundException(`Aucune tâche avec l'id ${id}`);
    }
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.todoRepository.delete({ id, userId });
    if (!result.affected)
      throw new NotFoundException(`Aucune tâche avec l'id ${id}`);
  }
}
