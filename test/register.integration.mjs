import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
const { AuthModule } = await import('../.test-dist/auth/auth.module.js');
const { User } = await import('../.test-dist/users/entities/user.entity.js');
const { TodoModule } = await import('../.test-dist/todo/todo.module.js');
const { Todo } = await import('../.test-dist/todo/entities/todo.entity.js');

// Test HTTP avec les vrais controller/service/DTO et un repository en mémoire :
// aucun compte de test n'est écrit dans la base PostgreSQL de l'exercice.
test('inscription : validation, hachage, réponse publique et doublon', async () => {
  const users = [];
  const tasks = [];
  const matches = (task, where) =>
    Object.entries(where).every(([key, value]) => task[key] === value);
  const taskRepository = {
    create: (data) => ({ ...data }),
    save: async (data) => {
      const task = { ...data, id: tasks.length + 1, createdAt: new Date() };
      tasks.push(task);
      return task;
    },
    find: async ({ where }) => tasks.filter((task) => matches(task, where)),
    findOne: async ({ where }) =>
      tasks.find((task) => matches(task, where)) ?? null,
    update: async (where, changes) => {
      const task = tasks.find((task) => matches(task, where));
      if (task) Object.assign(task, changes);
      return { affected: task ? 1 : 0 };
    },
    delete: async (where) => {
      const index = tasks.findIndex((task) => matches(task, where));
      if (index !== -1) tasks.splice(index, 1);
      return { affected: index !== -1 ? 1 : 0 };
    },
  };
  const repository = {
    findOne: async ({ where }) =>
      users.find((user) => user.email === where.email) ?? null,
    create: (data) => ({ ...data }),
    save: async (data) => {
      const user = { ...data, id: users.length + 1, createdAt: new Date() };
      users.push(user);
      return user;
    },
  };
  const module = await Test.createTestingModule({
    imports: [AuthModule, TodoModule],
  })
    .overrideProvider(ConfigService)
    .useValue({
      getOrThrow: () => 'integration-only-secret-not-for-application',
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue(repository)
    .overrideProvider(getRepositoryToken(Todo))
    .useValue(taskRepository)
    .compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  try {
    const http = request(app.getHttpServer());
    const valid = {
      email: ' Alice@Example.com ',
      password: 'MonMotDePasse123!',
    };
    for (const body of [
      {},
      { ...valid, email: 'invalide' },
      { ...valid, password: 'court' },
      { ...valid, password: 123456789012 },
      { ...valid, password: 'a'.repeat(129) },
      { ...valid, role: 'admin' },
    ]) {
      await http.post('/auth/register').send(body).expect(400);
    }
    assert.equal(users.length, 0);
    const { body } = await http.post('/auth/register').send(valid).expect(201);
    assert.equal(body.email, 'alice@example.com');
    assert.equal(body.role, 'user');
    assert.equal(body.id, 1);
    assert.ok(body.createdAt);
    assert.equal('password' in body, false);
    assert.match(users[0].password, /^scrypt\$/);
    assert.notEqual(users[0].password, valid.password);
    await http
      .post('/auth/register')
      .send({ ...valid, email: 'ALICE@example.com' })
      .expect(409);
    assert.equal(users.length, 1);
    const login = await http.post('/auth/login').send(valid).expect(200);
    const payload = new JwtService({
      secret: 'integration-only-secret-not-for-application',
    }).verify(login.body.access_token, { algorithms: ['HS256'] });
    assert.equal(payload.sub, 1);
    assert.equal(payload.role, 'user');
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal('password' in payload, false);
    await http
      .post('/auth/login')
      .send({ ...valid, password: 'incorrect' })
      .expect(401);
    await http
      .post('/auth/login')
      .send({ ...valid, email: 'absent@example.com' })
      .expect(401);
    await http.post('/auth/login').send({ email: valid.email }).expect(400);

    // Chaque route Todo est protégée, même celles dont le CRUD reste à compléter.
    for (const [method, path] of [
      ['get', '/todos'],
      ['post', '/todos'],
      ['get', '/todos/1'],
      ['patch', '/todos/1'],
      ['delete', '/todos/1'],
    ]) {
      await http[method](path).expect(401);
    }
    const jwt = new JwtService({
      secret: 'integration-only-secret-not-for-application',
    });
    for (const authorization of [
      'Bearer invalide',
      'Basic abc',
      `Bearer ${jwt.sign({ sub: 1, role: 'user' }, { expiresIn: -1 })}`,
      `Bearer ${jwt.sign({ sub: 'incorrect', role: 'user' }, { expiresIn: '1h' })}`,
      `Bearer ${new JwtService({ secret: 'wrong-key' }).sign({ sub: 1, role: 'user' }, { expiresIn: '1h' })}`,
    ]) {
      await http.get('/todos').set('Authorization', authorization).expect(401);
    }
    const todos = await http
      .get('/todos')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200);
    assert.deepEqual(todos.body, []);
    const alice = `Bearer ${login.body.access_token}`;
    const bob = `Bearer ${jwt.sign({ sub: 2, role: 'user' }, { expiresIn: '1h' })}`;
    const input = { title: 'Réviser NestJS', description: 'Exercice' };
    await http
      .post('/todos')
      .set('Authorization', alice)
      .send({ ...input, userId: 2 })
      .expect(400);
    const created = await http
      .post('/todos')
      .set('Authorization', alice)
      .send(input)
      .expect(201);
    assert.equal(created.body.userId, 1);
    assert.equal(created.body.done, false);
    const path = `/todos/${created.body.id}`;
    const ownList = await http
      .get('/todos')
      .set('Authorization', alice)
      .expect(200);
    assert.equal(ownList.body.length, 1);
    const otherList = await http
      .get('/todos')
      .set('Authorization', bob)
      .expect(200);
    assert.deepEqual(otherList.body, []);
    await http.get(path).set('Authorization', bob).expect(404);
    await http
      .patch(path)
      .set('Authorization', bob)
      .send({ done: true })
      .expect(404);
    await http.delete(path).set('Authorization', bob).expect(404);
    for (const patch of [
      { done: null },
      { title: null },
      { done: 'true' },
      { title: '  ' },
      { userId: 2 },
    ]) {
      await http
        .patch(path)
        .set('Authorization', alice)
        .send(patch)
        .expect(400);
    }
    const updated = await http
      .patch(path)
      .set('Authorization', alice)
      .send({ done: true })
      .expect(200);
    assert.equal(updated.body.done, true);
    assert.equal(updated.body.title, input.title);
    await http.get('/todos/abc').set('Authorization', alice).expect(400);
    await http.delete(path).set('Authorization', alice).expect(204);
    await http.get(path).set('Authorization', alice).expect(404);
    await http.delete(path).set('Authorization', alice).expect(404);
  } finally {
    await app.close();
  }
});
