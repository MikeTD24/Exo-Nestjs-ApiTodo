import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth-request.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: AuthRequest, _res: Response, next: NextFunction) {
    // Seul un token vérifié peut alimenter l'identité de la requête.
    delete req.user;
    const authorization = req.headers.authorization;
    if (!authorization) return next(); // Le guard traite l'absence de token.

    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) throw new UnauthorizedException('En-tête Bearer invalide');

    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(match[1], { algorithms: ['HS256'] });
      // verifyAsync contrôle la signature et l'expiration ; on vérifie aussi
      // les champs attendus avant de les utiliser dans les requêtes SQL.
      if (
        !Number.isSafeInteger(payload.sub) ||
        (payload.sub as number) <= 0 ||
        typeof payload.role !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('Contenu du token invalide');
      }
      req.user = { id: payload.sub as number, role: payload.role };
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    next();
  }
}
