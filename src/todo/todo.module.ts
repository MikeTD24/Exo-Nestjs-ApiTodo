import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuthMiddleware } from '../auth/auth.middleware.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TodoService } from './todo.service.js';
import { TodoController } from './todo.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Todo]), AuthModule],
  controllers: [TodoController],
  providers: [TodoService, AuthGuard],
})
export class TodoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // L'inscription et la connexion restent accessibles sans token.
    consumer.apply(AuthMiddleware).forRoutes(TodoController);
  }
}
