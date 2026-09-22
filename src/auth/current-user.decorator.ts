import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthRequest, AuthenticatedUser } from './auth-request.js';

// Centralise la lecture de l'identité vérifiée par le middleware.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (!user) throw new UnauthorizedException('Authentification requise');
    return user;
  },
);
