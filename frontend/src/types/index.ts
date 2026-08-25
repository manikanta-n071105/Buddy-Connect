export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'SENIOR' | 'JUNIOR' | 'FACULTY';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  permissions?: string[];
  directorId?: string;
  seniorId?: string;
  juniorId?: string;
  facultyId?: string;
  faculty_code?: string;
  max_juniors?: number;
  assigned_juniors_count?: number;
  faculty_name?: string;
  department?: string;
  mustChangePassword?: boolean;
}

export interface Issue {
  id: string;
  issue_number: string;
  reported_by_id: string;
  junior_id: string;
  senior_id: string;
  director_id: string;
  category_id: string;
  category_name?: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'VOTING' | 'CLOSED' | 'REOPENED' | 'ESCALATED' | 'CANCELLED';
  assigned_to_id?: string;
  assigned_to_name?: string;
  junior_name?: string;
  junior_email?: string;
  senior_name?: string;
  director_name?: string;
  resolution?: string;
  resolution_notes?: string;
  resolved_at?: string;
  closed_at?: string;
  escalated_at?: string;
  reopened_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  comment: string;
  created_at: string;
}

export interface IssueVote {
  id: string;
  issue_id: string;
  voter_id: string;
  voter_name?: string;
  vote_type: 'SATISFIED' | 'PARTIALLY_SATISFIED' | 'NOT_SATISFIED';
  comment?: string;
  created_at: string;
}

export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  sequence_order: number;
  is_required: boolean;
  is_completed?: boolean;
  completed_at?: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'YES_NO' | 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT';
  options?: any;
  is_required: boolean;
}

export interface Suggestion {
  id: string;
  junior_id: string;
  title: string;
  description: string;
  category: string;
  is_anonymous: boolean;
  vote_count: number;
  user_voted: boolean;
  author_name: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}
