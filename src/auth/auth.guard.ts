import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthRequest } from './auth-request.js';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    // L'identité a été préparée par le middleware avant l'appel du guard.
    if (!req.user) throw new UnauthorizedException('Authentification requise');
    return true;
  }
}
