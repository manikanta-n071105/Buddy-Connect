import { Request } from 'express';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'SENIOR' | 'JUNIOR' | 'FACULTY';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  permissions?: string[];
  directorId?: string;
  seniorId?: string;
  juniorId?: string;
  facultyId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}
