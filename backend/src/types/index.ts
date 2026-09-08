import { Request } from 'express';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'SENIOR' | 'JUNIOR' | 'FACULTY' | 'WARDEN';

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
  assigned_juniors_count?: number;
  residence_status?: 'DAY_SCHOLAR' | 'HOSTELLER';
  gender?: 'MALE' | 'FEMALE';
  year?: string;
  department?: string;
  is_cr?: boolean;
  is_counselor?: boolean;
  is_disciplinary_committee?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}
