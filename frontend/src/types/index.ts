export const DEPARTMENT_OPTIONS = [
  { value: 'CSE-A', label: 'CSE - Section A (CSE-A)' },
  { value: 'CSE-B', label: 'CSE - Section B (CSE-B)' },
  { value: 'CSE-C', label: 'CSE - Section C (CSE-C)' },
  { value: 'ECE', label: 'ECE (Electronics & Communication)' },
  { value: 'EEE', label: 'EEE (Electrical & Electronics)' },
  { value: 'MECH', label: 'MECH (Mechanical Engineering)' },
  { value: 'CIVIL', label: 'CIVIL (Civil Engineering)' },
];

export const getBranchShortCode = (dept?: string) => {
  if (!dept) return '';
  const d = dept.trim().toUpperCase();
  if (d.startsWith('CSE') || d.includes('COMPUTER')) return d;
  if (d.includes('ELECTRONICS') || d.includes('COMMUNICATION') || d === 'ECE') return 'ECE';
  if (d.includes('ELECTRICAL') || d === 'EEE') return 'EEE';
  if (d.includes('MECHANICAL') || d === 'MECH') return 'MECH';
  if (d.includes('CIVIL')) return 'CIVIL';
  return dept;
};

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'SENIOR' | 'JUNIOR' | 'FACULTY' | 'WARDEN';

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
  year?: string;
  batch?: string;
  residence_status?: 'DAY_SCHOLAR' | 'HOSTELLER';
  gender?: 'MALE' | 'FEMALE';
  is_cr?: boolean;
  is_counselor?: boolean;
  is_faculty?: boolean;
  is_disciplinary_committee?: boolean;
  blood_group?: string;
  mustChangePassword?: boolean;
}

export interface CrClassFeedback {
  id: string;
  cr_user_id: string;
  cr_name?: string;
  cr_username?: string;
  department: string;
  year_batch?: string;
  subject_name: string;
  faculty_name: string;
  feedback_category: string;
  rating: number;
  feedback_text: string;
  created_at: string;
}

export interface CounselingAppointment {
  id: string;
  student_user_id: string;
  counselor_user_id: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  student_role?: string;
  student_gender?: string;
  student_department?: string;
  counselor_name?: string;
  counselor_email?: string;
  counselor_phone?: string;
  counselor_department?: string;
  appointment_date: string;
  appointment_time: string;
  mode: 'IN_PERSON' | 'ONLINE';
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  counselor_notes?: string;
  created_at: string;
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
  status: 'OPEN' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'ESCALATED' | 'CANCELLED';
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

export interface BloodDonor {
  id: string;
  request_id: string;
  donor_id: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  donor_blood_group?: string;
  donor_role?: string;
  status: 'PLEDGED' | 'CONFIRMED' | 'CANCELLED';
  created_at: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requester_role?: string;
  patient_name: string;
  contact_number: string;
  blood_group: string;
  units_needed: number;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  hospital_name?: string;
  additional_notes?: string;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  volunteer_count: number;
  has_pledged?: boolean;
  can_view_contact?: boolean;
  is_owner?: boolean;
  donors?: BloodDonor[];
  created_at: string;
  updated_at: string;
}

