import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../users/password.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      // Même message pour ne pas révéler si l'email existe.
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    // sub identifie le propriétaire du token ; aucun mot de passe dans le JWT.
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
    return { access_token: accessToken };
  }

  register(dto: CreateUserDto) {
    // UsersService centralise le hachage et exclut le mot de passe de la réponse.
    return this.usersService.create(dto);
  }
}
