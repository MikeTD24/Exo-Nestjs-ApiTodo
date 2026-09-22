# Exercice NestJS : API Todo avec authentification

## Objectif

Implémenter une API REST simple permettant à des utilisateurs de s'inscrire, de se connecter et de gérer leurs propres tâches (todos).

**Modèles :** `User` et `Todo`

---

## 1. Feature `User`

### Modèle

```ts
export class User {
  id: number;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}
```

### À implémenter

Créer un module `UsersModule` (module, service, controller) avec les méthodes suivantes dans le `UsersService` :

| Méthode         | Utilisation                        |
| --------------- | ---------------------------------- |
| `create()`      | Utilisée par l'inscription (register) |
| `findByEmail()` | Utilisée par la connexion (login)  |
| `findOne()`     | Utilisée par le `UsersController`  |



---

## 2. Feature `Auth`

Créer un module `AuthModule` qui s'appuie sur le `UsersService`.

> Attention aux imports/exports entre modules : le `UsersService` doit être **exporté** par `UsersModule`, et `UsersModule` doit être **importé** dans `AuthModule`.

### Routes à implémenter

| Méthode | Route            | Description                          |
| ------- | ---------------- | ------------------------------------ |
| `POST`  | `/auth/register` | Crée un nouvel utilisateur           |
| `POST`  | `/auth/login`    | Vérifie les identifiants et renvoie un token JWT |

---

## 3. Feature `Todo`

### Modèle

```ts
export class Todo {
  id: number;
  userId: number;
  title: string;
  description: string;
  done: boolean;
  createdAt: Date;
}
```

### À implémenter

Un CRUD complet sur les todos. Chaque tâche est liée à l'utilisateur connecté : le `userId` doit être récupéré depuis l'utilisateur authentifié, et non envoyé dans le body.

| Méthode  | Route        | Action      |
| -------- | ------------ | ----------- |
| `POST`   | `/todos`     | Create      |
| `GET`    | `/todos`     | FindAll     |
| `GET`    | `/todos/:id` | FindOne     |
| `PATCH`  | `/todos/:id` | Update      |
| `DELETE` | `/todos/:id` | Delete      |

---

## 4. Implémentations supplémentaires

1. **JWT** : générer le token dans l'`AuthService` lors du login (`@nestjs/jwt`).
2. **Middleware** : extraire les informations de l'utilisateur depuis le token et les attacher à la requête (`req.user`). Il peut être enregistré dans `main.ts` ou via la méthode `configure()` de `AppModule`.
3. **Guard** : restreindre l'accès aux routes `/todos` aux seuls utilisateurs connectés.

---

## Bonus

- Un utilisateur ne peut consulter, modifier ou supprimer **que ses propres** todos.
- Valider les données entrantes avec des DTO 
- Ne jamais renvoyer le champ `password` dans les réponses.