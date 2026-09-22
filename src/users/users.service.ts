import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { hashPassword } from './password.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // On sélectionne les champs acceptés : le client ne choisit pas son rôle.
    const user = this.userRepository.create({
      email,
      password: await hashPassword(dto.password),
      role: 'user',
    });

    try {
      const saved = await this.userRepository.save(user);
      return {
        id: saved.id,
        email: saved.email,
        role: saved.role,
        createdAt: saved.createdAt,
      };
    } catch (error) {
      // La contrainte unique protège aussi deux inscriptions simultanées.
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Aucun utilisateur avec l'id ${id}`);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
