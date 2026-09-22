import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
