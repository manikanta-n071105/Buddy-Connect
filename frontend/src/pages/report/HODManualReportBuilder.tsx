import React, { useState, useEffect } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  Plus,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  FileText,
  FileDown,
  Printer,
  Eye,
  Edit3,
  Database,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { HODProfessionalPDFView } from './HODProfessionalPDFView';

export interface MomAttendee {
  name: string;
  designation: string;
}

export interface MomReviewRow {
  review: string;
  date: string;
}

export interface MomTargetRow {
  department: string;
  researchPapers: string;
  patents: string;
}

export interface MomDiscussionItem {
  heading: string;
  details: string;
  tableType?: 'none' | 'project_reviews' | 'publication_targets' | 'custom';
  customTableHeaders?: string[];
  customTableRows?: string[][];
  reviewSchedule?: MomReviewRow[];
  publicationTargets?: MomTargetRow[];
  postTableDetails?: string;
}

export interface DeptMeetingItem {
  date: string;
  time?: string;
  venue?: string;
  title?: string;
  meetingNo?: string;
  attendees?: MomAttendee[];
  agenda?: string;
  discussions?: MomDiscussionItem[];
  decisions?: string;
  policyChanges?: string;
  link?: string;
}

export const DEFAULT_SSE_MOM_ATTENDEES: MomAttendee[] = [
  { name: 'Dr. Hemachandra', designation: 'Principal - SSE' },
  { name: 'Dr. S Hari Krishnan', designation: 'Vice - Principal - SSE' },
  { name: 'Prof. Nagaraju', designation: 'HOD ECE & Dean Academics' },
  { name: 'Dr. Srinivas Rao', designation: 'HOD - EEE' },
  { name: 'Dr. Anil Kumar Reddy', designation: 'HOD - MECH' },
  { name: 'Dr. Vinod Kumar', designation: 'HOD - CSE' },
  { name: 'Dr. Sambhasivaiah', designation: 'HOD HAS' },
  { name: 'Mr. Sivaprasad', designation: 'HOD CIVIL' },
];

export const DEFAULT_MOM_24_TEMPLATE: DeptMeetingItem = {
  title: "HoD's Meeting with Principal",
  meetingNo: 'MOM 24',
  date: '16 September 2026',
  time: '10.15 AM – 12.10 PM',
  venue: 'Principal Chamber, SSE',
  attendees: DEFAULT_SSE_MOM_ATTENDEES,
  agenda: `• ERP Portal – Leave & Class Substitution
• Assignments – Moodle Portal
• IV Year Project Review Schedule
• Research Paper & Patent Publication Targets
• Teaching & Learning Practices
• ATAL Faculty Development Programme (FDP)
• Proper Utilization of Laboratory Facilities
• Working Day – 19 September 2026`,
  discussions: [
    {
      heading: '1. ERP Portal – Leave & Class Substitution',
      details: `• All faculty members are instructed to use the ERP Portal properly for applying leave.
• Whenever a class is substituted by another faculty member, the concerned substitute faculty must accept the substitution request online through the ERP Portal.
• Leave will be considered only after the substitute faculty has accepted the substitution online.
• Faculty members applying for leave should ensure that there is no pending substitution acceptance before proceeding on leave.`,
      tableType: 'none'
    },
    {
      heading: '2. Assignment – Moodle Portal',
      details: `• All faculty members are instructed to assign assignments in the Moodle Portal.
• Faculty members should discuss the assignment questions in the respective classes before the Mid-Term Examinations.
• All three assignment questions must be discussed with the students.
• Out of the three questions discussed, one question will be given in the question paper as Assignment.`,
      tableType: 'none'
    },
    {
      heading: '3. IV Year Project Review Schedule',
      details: 'The IV Year project reviews are scheduled as follows:',
      tableType: 'project_reviews',
      reviewSchedule: [
        { review: '1st Review', date: '21 September 2026' },
        { review: '2nd Review', date: '09 October 2026' },
        { review: '3rd / Final Review', date: '23 October 2026' },
        { review: 'Final Project Report Submission', date: '24 December 2026' }
      ],
      postTableDetails: 'All concerned faculty members and students are instructed to adhere strictly to the above schedule.'
    },
    {
      heading: '4. Paper & Patent Publication Targets',
      details: 'As discussed in the HODs meeting, all HODs have agreed to and committed to achieving the following targets for research paper and patent publications:',
      tableType: 'publication_targets',
      publicationTargets: [
        { department: 'Mechanical Engineering', researchPapers: '4', patents: '0' },
        { department: 'EEE', researchPapers: '8', patents: '3' },
        { department: 'CSE', researchPapers: '20', patents: '16' },
        { department: 'Civil Engineering', researchPapers: '4', patents: '2' },
        { department: 'ECE', researchPapers: '7', patents: '4' }
      ],
      postTableDetails: 'All HODs are requested to monitor the progress regularly and ensure that the committed targets are achieved.'
    },
    {
      heading: '5. Teaching & Learning',
      details: `• All faculty members are instructed to ensure effective and proper Teaching & Learning practices.
• Faculty members should maintain quality in classroom teaching, ensure syllabus progress as per schedule, and actively engage students in the learning process.`,
      tableType: 'none'
    },
    {
      heading: '6. ATAL FDP – November 30 to December 5, 2026',
      details: `• It is happy to share that the institution has received approval for an ATAL Faculty Development Programme (FDP).
• The FDP is scheduled from 30 November to 05 December 2026 in offline mode.
• Each department is required to bring 4 participants from other institutions.
• Participation from each department is mandatory, and HODs are requested to coordinate accordingly.`,
      tableType: 'none'
    },
    {
      heading: '7. Proper Utilization of Laboratory Facilities',
      details: `• All laboratory stools and available seating facilities should be properly utilized.
• No student should be allowed to sit on the laboratory floor during practical sessions.
• Faculty members and laboratory staff are instructed to ensure proper seating arrangements and maintain discipline in the laboratories.`,
      tableType: 'none'
    },
    {
      heading: '8. Working Day – 19 September 2026',
      details: `• Saturday, 19 September 2026, will be a regular working day for all B.Tech students in view of syllabus completion.
• The Monday timetable will be followed on Saturday.
• All HODs and faculty members are requested to ensure the regular conduct of classes and maximum student attendance.`,
      tableType: 'none'
    }
  ],
  decisions: 'HoD review meeting held with Principal covering ERP leaves, Moodle assignments, IV year project reviews, paper and patent targets, ATAL FDP, lab facilities, and Saturday working day.',
  policyChanges: 'Mandatory online ERP substitution acceptance before leave approval; strict adherence to 4-stage project review timelines.',
  link: ''
};

export const DEFAULT_MOM_21_SEP_TEMPLATE: DeptMeetingItem = {
  title: "HoD's Meeting with Principal",
  meetingNo: 'MOM 25',
  date: '21 September 2026',
  time: '3.45 PM – 05.30 PM',
  venue: 'Principal Chamber, SSE',
  attendees: [
    { name: 'Dr. Hemachandra', designation: 'Principal - SSE' },
    { name: 'Dr. S Hari Krishnan', designation: 'Vice - Principal - SSE' },
    { name: 'Prof. Nagaraju', designation: 'HOD ECE & Dean Academics' },
    { name: 'Dr. Srinivas Rao', designation: 'HOD - EEE' },
    { name: 'Dr. Anil Kumar Reddy', designation: 'HOD - MECH' },
    { name: 'Dr. Vinod Kumar', designation: 'HOD - CSE' },
    { name: 'Dr. Sambhasivaiah', designation: 'HOD HAS' },
    { name: 'Mr. Sivaprasad', designation: 'HOD CIVIL' }
  ],
  agenda: `(i) New Roles and Responsibilities
(ii) Monthly Report Submission
(iii) Laboratory Preparation and YouTube Videos
(iv) Social Media Updates and Event Promotion
(v) Environmental Science Activities
(vi) Fee Due Follow-up
(vii) Student Attendance and Parent Communication
(viii) Faculty Attendance, Leave and LOP
(ix) FRS Attendance Compliance
(x) Event Planning and Execution`,
  discussions: [
    {
      heading: '1. Introduction of New Roles and Responsibilities',
      details: `The Principal introduced the faculty members who have been assigned new roles and responsibilities:
• Dr. P. Shabana – Head, Teaching & Learning
• Mr. B. Venkatesu – Coordinator, Centre for Skill Development
• Mr. Adisheshu – NSS Programme Officer and Centre for Sustainability & Community Engagement
• Mr. P. Dhanunjaya – Head, Innovation & Entrepreneurship
• Ms. G. Ramya Krishna – Head, Student Life & Clubs

The Principal instructed all concerned faculty members to submit their monthly activity reports on or before the 25th of every month without fail.`,
      tableType: 'none'
    },
    {
      heading: '2. Laboratory Preparation and YouTube Videos',
      details: `• As instructed earlier, the concerned laboratory handling faculty members should share the YouTube video links related to the experiments with students before the laboratory session.
• Students should watch the videos and come prepared before performing the experiments.`,
      tableType: 'none'
    },
    {
      heading: '3. Social Media Updates',
      details: `• All HODs are instructed to ensure that photographs and updates of department events and activities are posted on social media platforms and that the official college social media accounts are tagged appropriately.`,
      tableType: 'none'
    },
    {
      heading: '4. Environmental Science subject -Activities',
      details: `• For the Environmental Science course, suitable activities should be planned and conducted during class hours.
• The concerned faculty members should ensure that the assigned activities are completed by the students.`,
      tableType: 'none'
    },
    {
      heading: '5. Fee Due Follow-up',
      details: `• The fee due list has been shared with all HODs.
• HODs are instructed to follow up with the concerned students and ensure timely fee payment.`,
      tableType: 'none'
    },
    {
      heading: '6. Attendance Monitoring and Letters to Parents',
      details: `• HODs should closely monitor student attendance.
• For students having less than 65% attendance, letters to parents should be prepared and submitted every month without fail.
• The concerned Class Advisors should submit the required details/letters to the Examination Cell.`,
      tableType: 'none'
    },
    {
      heading: '7. Classes Without Faculty / Leave Adjustment',
      details: `• If a scheduled class is left unattended despite the faculty member being present on campus, or if a faculty member proceeds on leave without making the required class adjustment, LOP will be imposed as per the applicable rules.
• If a faculty member has already exhausted their CL (Casual Leave), the applicable leave/LOP rules will be followed, including double leave-day LOP and an additional one-day LOP, as applicable.`,
      tableType: 'none'
    },
    {
      heading: '8. FRS Attendance',
      details: `• All HODs should instruct their respective department faculty members to mark FRS attendance without fail and ensure regular compliance.`,
      tableType: 'none'
    },
    {
      heading: '9. Event Planning and Execution',
      details: `• All HODs are instructed to submit the list of planned events and initiate the activities immediately.
• Departments should plan and conduct relevant events and activities, including programmes in collaboration with organizations such as APSSDC, Edunet, and other appropriate agencies.`,
      tableType: 'none'
    }
  ],
  decisions: 'Principal introduced new heads for functional units (Teaching & Learning, Skill Development, CSCE/NSS, I&E, Student Life & Clubs) with mandatory monthly reporting by the 25th; mandated YouTube lab preparation; parent letters for <65% attendance; strict class adjustment / LOP enforcement; mandatory FRS marking; collaboration with APSSDC/Edunet.',
  policyChanges: 'Mandatory monthly activity report submission on or before the 25th of every month; Letters to parents every month for students with <65% attendance; Strict LOP imposition for unattended classes or leave without approved class adjustment; Mandatory daily FRS attendance compliance.',
  link: ''
};

export interface ReportSectionsData {
  journals: Array<{
    title: string;
    authors: string;
    journalName: string;
    issnIsbn: string;
    volIssueYear: string;
    pageNos: string;
    indexedIn: string;
    link: string;
  }>;
  conferences: Array<{
    title: string;
    authors: string;
    conferenceName: string;
    date: string;
    locationMode: string;
    volIssueYear?: string;
    pageNos?: string;
    issnIsbn?: string;
    indexedIn: string;
    link: string;
  }>;
  patents: Array<{
    title: string;
    inventors: string;
    applicants: string;
    patentNumber: string;
    status: string;
    awardedDate: string;
    link: string;
  }>;
  entrepreneurship: Array<{
    title: string;
    date: string;
    type: string;
    participants: string;
    organizedBy: string;
    mode: string;
    keyOutcomes: string;
    participantsCount: string;
    mentorCoordinator: string;
    status: string;
    link: string;
  }>;
  nss: Array<{
    event: string;
    date: string;
    venue: string;
    type: string;
    participantsCount: string;
    typeOfParticipants: string;
    outcomes: string;
    coordinator: string;
    link: string;
  }>;
  fdpAttended: Array<{
    title: string;
    type: string;
    dates: string;
    organizingBody: string;
    mode: string;
    facultyAttended: string;
    link: string;
  }>;
  fdpOrganized: Array<{
    title: string;
    type: string;
    dates: string;
    deptOrganized: string;
    mode: string;
    resourcePersonDetails: string;
    facultyCoordinators: string;
    link: string;
  }>;
  fdp?: Array<{
    title: string;
    type: string;
    dates: string;
    organizingBody: string;
    mode: string;
    role: string;
    keyOutcomes: string;
    link: string;
  }>;
  sdp: Array<{
    title: string;
    date: string;
    type: string;
    resourcePerson: string;
    mode: string;
    keyOutcomes: string;
    participantsCount: string;
    coordinator: string;
    link: string;
  }>;
  facultyAchievements: Array<{
    name: string;
    award: string;
    organization: string;
    date: string;
    link: string;
  }>;
  studentAchievements: Array<{
    nameRoll: string;
    award: string;
    event: string;
    organization: string;
    durationDate: string;
    link: string;
  }>;
  certifications: Array<{
    title: string;
    type: string;
    duration: string;
    platform: string;
    enrolled: string;
    certified: string;
    keyOutcomes: string;
    link: string;
  }>;
  deptMeetings: Array<DeptMeetingItem>;
  mous: Array<{
    name: string;
    purpose: string;
    datePeriod: string;
    facultySpoc: string;
    link: string;
  }>;
  additionalInitiatives: Array<{
    initiative: string;
    date: string;
    description: string;
    outcomes: string;
    coordinator: string;
    link: string;
  }>;
  techAssociation: Array<{
    event: string;
    date: string;
    type: string;
    resourcePersonCoordinator: string;
    participants: string;
    outcomes: string;
    link: string;
  }>;
  iicCell: Array<{
    activity: string;
    date: string;
    description: string;
    partner: string;
    beneficiaries: string;
    outcomes: string;
    link: string;
  }>;
  syllabus: Array<{
    subject: string;
    yearSem: string;
    faculty: string;
    completed: string;
    pending: string;
    remarks: string;
  }>;
  studentEngagement?: Array<{
    title: string;
    type: string;
    otherType?: string;
    noOfDays: string;
    dates: string;
    startDate?: string;
    endDate?: string;
    participantsCount: string;
    coordinator: string;
    remarks: string;
    link?: string;
  }>;
}

export const STUDENT_ENGAGEMENT_ACTIVITY_TYPES = [
  'FDP',
  'Seminar',
  'Guest lecture',
  'Expert lecture',
  'Industrial visit',
  'Internship',
  'Mentoring session',
  'Conference',
  'Workshop',
  'Value Added Course',
  'NSS / Extension Activity',
  'Technical Association Activity',
  'Hackathon / Project Expo',
  'Certification Course',
  'Club Event / Cultural Activity',
  'Other'
];

export const INDEXED_IN_OPTIONS = [
  'Scopus',
  'WoS',
  'UGC',
  'Google Scholar',
  'Other'
];

export const PATENT_STATUS_OPTIONS = [
  'Filed',
  'Published',
  'Granted',
  'Commercialized'
];


export const SDP_ACTIVITY_TYPES = [
  'Workshop',
  'Hands-on Technical SDP',
  'Software Training SDP',
  'Guest Lecture',
  'Expert Lecture',
  'Seminar',
  'Industry Crash Course',
  'Industrial Visit',
  'Internship',
  'Symposium / Hackathon',
  'Community Project',
  'Value Added Course',
  'Certification Training',
  'Other'
];

export interface SyllabusUnitOption {
  value: string;
  label: string;
  units: number;
  pending: string;
  pct: number;
}

export const SYLLABUS_THEORY_OPTIONS: SyllabusUnitOption[] = [
  { value: '5 Units (100%)', label: '5 Units (100% - Completed)', units: 5, pending: 'Nil', pct: 100 },
  { value: '4.5 Units (90%)', label: '4.5 Units (90%)', units: 4.5, pending: '0.5 Units (10%)', pct: 90 },
  { value: '4 Units (80%)', label: '4 Units (80%)', units: 4, pending: '1 Unit (20%)', pct: 80 },
  { value: '3.5 Units (70%)', label: '3.5 Units (70%)', units: 3.5, pending: '1.5 Units (30%)', pct: 70 },
  { value: '3 Units (60%)', label: '3 Units (60%)', units: 3, pending: '2 Units (40%)', pct: 60 },
  { value: '2.5 Units (50%)', label: '2.5 Units (50%)', units: 2.5, pending: '2.5 Units (50%)', pct: 50 },
  { value: '2 Units (40%)', label: '2 Units (40%)', units: 2, pending: '3 Units (60%)', pct: 40 },
  { value: '1.5 Units (30%)', label: '1.5 Units (30%)', units: 1.5, pending: '3.5 Units (70%)', pct: 30 },
  { value: '1 Unit (20%)', label: '1 Unit (20%)', units: 1, pending: '4 Units (80%)', pct: 20 },
  { value: '0.5 Units (10%)', label: '0.5 Units (10%)', units: 0.5, pending: '4.5 Units (90%)', pct: 10 },
  { value: '0 Units (0%)', label: '0 Units (0% - Not Started)', units: 0, pending: '5 Units (100%)', pct: 0 },
];

export interface SyllabusLabOption {
  value: string;
  label: string;
  done: number;
  total: number;
  pending: string;
  pct: number;
}

export const SYLLABUS_LAB_OPTIONS: SyllabusLabOption[] = [
  { value: '10 Experiments (100%)', label: '10 / 10 Experiments (100% - Completed)', done: 10, total: 10, pending: 'Nil', pct: 100 },
  { value: '9 Experiments (90%)', label: '9 / 10 Experiments (90%)', done: 9, total: 10, pending: '1 Exp Pending (10%)', pct: 90 },
  { value: '8 Experiments (80%)', label: '8 / 10 Experiments (80%)', done: 8, total: 10, pending: '2 Exp Pending (20%)', pct: 80 },
  { value: '7 Experiments (70%)', label: '7 / 10 Experiments (70%)', done: 7, total: 10, pending: '3 Exp Pending (30%)', pct: 70 },
  { value: '6 Experiments (60%)', label: '6 / 10 Experiments (60%)', done: 6, total: 10, pending: '4 Exp Pending (40%)', pct: 60 },
  { value: '5 Experiments (50%)', label: '5 / 10 Experiments (50%)', done: 5, total: 10, pending: '5 Exp Pending (50%)', pct: 50 },
  { value: '4 Experiments (40%)', label: '4 / 10 Experiments (40%)', done: 4, total: 10, pending: '6 Exp Pending (60%)', pct: 40 },
  { value: '3 Experiments (30%)', label: '3 / 10 Experiments (30%)', done: 3, total: 10, pending: '7 Exp Pending (70%)', pct: 30 },
  { value: '2 Experiments (20%)', label: '2 / 10 Experiments (20%)', done: 2, total: 10, pending: '8 Exp Pending (80%)', pct: 20 },
  { value: '1 Experiment (10%)', label: '1 / 10 Experiments (10%)', done: 1, total: 10, pending: '9 Exp Pending (90%)', pct: 10 },
  { value: '0 Experiments (0%)', label: '0 Experiments (0% - Not Started)', done: 0, total: 10, pending: '10 Experiments (100%)', pct: 0 },
];

export const calculatePendingFromCompleted = (completedStr: string, isLab: boolean): string => {
  if (!completedStr) return '';
  if (isLab) {
    const matched = SYLLABUS_LAB_OPTIONS.find(o => o.value === completedStr);
    if (matched) return matched.pending;
    const numMatch = completedStr.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const done = parseFloat(numMatch[1]);
      const total = 10;
      const rem = Math.max(0, total - done);
      if (rem === 0) return 'Nil';
      const pct = Math.round((rem / total) * 100);
      return `${rem} Exp Pending (${pct}%)`;
    }
    return '';
  }

  const matched = SYLLABUS_THEORY_OPTIONS.find(o => o.value === completedStr);
  if (matched) return matched.pending;

  const numMatch = completedStr.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const doneUnits = parseFloat(numMatch[1]);
    if (!isNaN(doneUnits) && doneUnits >= 0 && doneUnits <= 5) {
      const pendingUnits = Math.round((5 - doneUnits) * 10) / 10;
      if (pendingUnits === 0) return 'Nil';
      const pct = Math.round((pendingUnits / 5) * 100);
      return `${pendingUnits} ${pendingUnits === 1 ? 'Unit' : 'Units'} (${pct}%)`;
    }
  }
  return '';
};

export const formatDateToDDMMYYYY = (val: string): string => {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  return val;
};

export const getIsoDateFromDDMMYYYY = (val: string): string => {
  if (!val) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export const handleDateInputAutoFormat = (input: string): string => {
  if (!input) return '';
  // Automatically change hyphens (-), dots (.), and spaces to slashes (/)
  let formatted = input.replace(/[-.\s]/g, '/');

  // Remove any remaining invalid characters
  formatted = formatted.replace(/[^\d/]/g, '');

  // Prevent multiple consecutive slashes
  formatted = formatted.replace(/\/+/g, '/');

  // If user pasted or entered YYYY/MM/DD, convert to DD/MM/YYYY
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(formatted)) {
    const [y, m, d] = formatted.split('/');
    return `${d}/${m}/${y}`;
  }

  // If pure 8 digits (e.g. 25042026), auto-insert slashes
  if (/^\d{8}$/.test(formatted)) {
    return `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
  }

  return formatted;
};

export const INITIAL_SECTIONS: ReportSectionsData = {
  journals: [],
  conferences: [],
  patents: [],
  entrepreneurship: [],
  nss: [],
  fdpAttended: [],
  fdpOrganized: [],
  fdp: [],
  sdp: [],
  facultyAchievements: [],
  studentAchievements: [],
  certifications: [],
  deptMeetings: [],
  mous: [],
  additionalInitiatives: [],
  techAssociation: [],
  iicCell: [],
  syllabus: [],
  studentEngagement: []
};

export const normalizeSections = (raw: any): ReportSectionsData => {
  if (!raw || typeof raw !== 'object') {
    return { ...INITIAL_SECTIONS };
  }
  return {
    journals: Array.isArray(raw.journals) ? raw.journals : [],
    conferences: Array.isArray(raw.conferences) ? raw.conferences : [],
    patents: Array.isArray(raw.patents) ? raw.patents : [],
    entrepreneurship: Array.isArray(raw.entrepreneurship) ? raw.entrepreneurship : [],
    nss: Array.isArray(raw.nss) ? raw.nss : [],
    fdpAttended: Array.isArray(raw.fdpAttended)
      ? raw.fdpAttended
      : (Array.isArray(raw.fdp)
        ? raw.fdp.map((f: any) => ({
          title: f.title || '',
          type: f.type || '',
          dates: f.dates || '',
          organizingBody: f.organizingBody || '',
          mode: f.mode || '',
          facultyAttended: f.facultyAttended || f.role || '',
          link: f.link || ''
        }))
        : []),
    fdpOrganized: Array.isArray(raw.fdpOrganized) ? raw.fdpOrganized : [],
    fdp: Array.isArray(raw.fdp) ? raw.fdp : [],
    sdp: Array.isArray(raw.sdp) ? raw.sdp : [],
    facultyAchievements: Array.isArray(raw.facultyAchievements) ? raw.facultyAchievements : [],
    studentAchievements: Array.isArray(raw.studentAchievements) ? raw.studentAchievements : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    deptMeetings: Array.isArray(raw.deptMeetings)
      ? raw.deptMeetings.map((m: any) => ({
        date: m.date || '',
        time: m.time || '',
        venue: m.venue || '',
        title: m.title || '',
        meetingNo: m.meetingNo || '',
        attendees: Array.isArray(m.attendees) ? m.attendees : [],
        agenda: m.agenda || '',
        discussions: Array.isArray(m.discussions)
          ? m.discussions.map((d: any) => ({
            heading: d.heading || '',
            details: d.details || '',
            tableType: d.tableType || 'none',
            reviewSchedule: Array.isArray(d.reviewSchedule) ? d.reviewSchedule : [],
            publicationTargets: Array.isArray(d.publicationTargets) ? d.publicationTargets : [],
            postTableDetails: d.postTableDetails || ''
          }))
          : [],
        decisions: m.decisions || '',
        policyChanges: m.policyChanges || '',
        link: m.link || ''
      }))
      : [],
    mous: Array.isArray(raw.mous) ? raw.mous : [],
    additionalInitiatives: Array.isArray(raw.additionalInitiatives) ? raw.additionalInitiatives : [],
    techAssociation: Array.isArray(raw.techAssociation) ? raw.techAssociation : [],
    iicCell: Array.isArray(raw.iicCell) ? raw.iicCell : [],
    syllabus: Array.isArray(raw.syllabus) ? raw.syllabus : [],
    studentEngagement: Array.isArray(raw.studentEngagement) ? raw.studentEngagement : [],
  };
};

interface HODManualReportBuilderProps {
  currentPeriod: string;
  onReportGenerated?: () => void;
}

export const HODManualReportBuilder: React.FC<HODManualReportBuilderProps> = ({
  currentPeriod,
  onReportGenerated
}) => {
  // Only the 4 metadata fields present in the template header:
  const [department, setDepartment] = useState('Civil Engineering');
  const [hodName, setHodName] = useState('K Siva Prasad');
  const [period, setPeriod] = useState(currentPeriod || 'September 2026');
  const [submissionDate, setSubmissionDate] = useState('30/09/2026');

  const [sections, setSections] = useState<ReportSectionsData>(() => normalizeSections(INITIAL_SECTIONS));

  useEffect(() => {
    if (currentPeriod && currentPeriod !== period) {
      setPeriod(currentPeriod);
    }
  }, [currentPeriod]);

  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<string>('1a_journals');
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const [dbStatus, setDbStatus] = useState<{
    saved: boolean;
    lastSavedAt?: string;
    status?: string;
  }>({ saved: false });

  // Refs for tracking state inside the 30-second auto-save interval and race-free fetches
  const sectionsRef = React.useRef(sections);
  sectionsRef.current = sections;
  const deptRef = React.useRef(department);
  deptRef.current = department;
  const periodRef = React.useRef(period);
  periodRef.current = period;
  const hodNameRef = React.useRef(hodName);
  hodNameRef.current = hodName;
  const submissionDateRef = React.useRef(submissionDate);
  submissionDateRef.current = submissionDate;
  const loadingDraftRef = React.useRef(loadingDraft);
  loadingDraftRef.current = loadingDraft;
  const activeFetchIdRef = React.useRef(0);

  const parseDaysFromOption = (opt: string): number => {
    if (!opt) return 1;
    const o = opt.toLowerCase();
    if (o.includes('2 week')) return 14;
    if (o.includes('1 week')) return 7;
    const match = o.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  const calculateDiffDays = (startStr: string, endStr: string): number | null => {
    if (!startStr || !endStr) return null;
    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive count
    return diffDays;
  };

  const getDefaultHod = (dept: string) => {
    if (dept.includes('Civil')) return 'K Siva Prasad';
    if (dept.includes('Computer')) return 'Dr. Kethineni Vinod Kumar';
    if (dept.includes('Communication')) return 'Dr. V. Annapurna';
    if (dept.includes('Electrical')) return 'Mr. K. Gangadhar';
    if (dept.includes('Mechanical')) return 'C Anil Kumar Reddy';
    if (dept.includes('Humanities')) return 'Dr. Samba Sivaiah B';
    if (dept.includes('Innovation')) return 'Dean / Convener - IIC & EDC';
    if (dept.includes('Student Engagement')) return 'Convener - Student Engagement & Clubs';
    if (dept.includes('NSS')) return 'NSS Programme Officer';
    if (dept.includes('Minutes')) return 'Member Secretary - Academic Committee';
    return 'HOD';
  };

  // Fetch saved report from dedicated reports database
  // Automatically loads blank fields if no data has been entered before for this period!
  const loadSavedReportFromDb = async (dept = department, per = period) => {
    const fetchId = ++activeFetchIdRef.current;
    try {
      setLoadingDraft(true);
      const res = await api.get(`/reports/department-report-data?department=${encodeURIComponent(dept)}&period=${encodeURIComponent(per)}`);

      // If another fetch happened while this was in-flight, disregard
      if (fetchId !== activeFetchIdRef.current) return;

      if (res.data?.success && res.data.exists && res.data.data) {
        const d = res.data.data;
        if (d.sections && typeof d.sections === 'object') {
          setSections(normalizeSections(d.sections));
        } else {
          setSections(normalizeSections(INITIAL_SECTIONS));
        }
        if (d.hodName) setHodName(d.hodName);
        else setHodName(getDefaultHod(dept));
        if (d.submissionDate) setSubmissionDate(d.submissionDate);
        setDbStatus({
          saved: true,
          lastSavedAt: d.updatedAt,
          status: d.status
        });
        toast.success(`Loaded saved report for ${dept} (${per})`, { id: 'db-load' });
      } else {
        // If no data entered before for this period: load blank fields!
        setSections(normalizeSections(INITIAL_SECTIONS));
        setHodName(getDefaultHod(dept));
        setDbStatus({ saved: false });
      }
    } catch (e) {
      if (fetchId !== activeFetchIdRef.current) return;
      console.warn('Could not fetch saved draft from report db:', e);
      setSections(normalizeSections(INITIAL_SECTIONS));
      setDbStatus({ saved: false });
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setLoadingDraft(false);
      }
    }
  };

  useEffect(() => {
    if (department && period) {
      loadSavedReportFromDb(department, period);
    }
  }, [department, period]);

  // 30-Second Automatic Silent Background Save
  useEffect(() => {
    const timer = setInterval(async () => {
      // Do not auto-save while fetching or loading draft
      if (loadingDraftRef.current) return;

      const currentSections = sectionsRef.current;
      const currentDept = deptRef.current;
      const currentPeriod = periodRef.current;
      const currentHod = hodNameRef.current;
      const currentSubDate = submissionDateRef.current;

      // Only save if user has entered data in at least one section
      const hasAnyData = Object.values(currentSections).some(
        arr => Array.isArray(arr) && arr.length > 0
      );
      if (!hasAnyData) return;

      try {
        setAutoSaving(true);
        const payload = {
          department: currentDept,
          period: currentPeriod,
          hodName: currentHod,
          submissionDate: currentSubDate,
          sections: currentSections,
          status: 'DRAFT'
        };
        const res = await api.post('/reports/save-department-draft', payload);
        if (res.data?.success) {
          setDbStatus({
            saved: true,
            lastSavedAt: res.data.data?.updatedAt || new Date().toISOString(),
            status: res.data.data?.status || 'DRAFT'
          });
          setLastAutoSavedAt(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn('30s auto-save silent attempt failed:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 30000); // exactly every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const toastId = toast.loading(`Saving ${department} report to dedicated Neon database...`);
      const payload = {
        department,
        period,
        hodName,
        submissionDate,
        sections,
        status: 'DRAFT'
      };
      const res = await api.post('/reports/save-department-draft', payload);
      if (res.data.success) {
        toast.dismiss(toastId);
        toast.success(`Progress saved to dedicated reports database!`, { id: 'save-draft' });
        setDbStatus({
          saved: true,
          lastSavedAt: res.data.data?.updatedAt || new Date().toISOString(),
          status: res.data.data?.status || 'DRAFT'
        });
        setLastAutoSavedAt(new Date().toLocaleTimeString());
        if (onReportGenerated) onReportGenerated();
      } else {
        toast.dismiss(toastId);
        toast.error(res.data.message || 'Save failed');
      }
    } catch (err: any) {
      toast.error('Save error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setHodName(getDefaultHod(dept));
    // loadSavedReportFromDb runs automatically via useEffect, loading existing draft or fresh blank fields
  };

  // Exact tables matching the template format:
  const safeSections = normalizeSections(sections);

  // Full statutory master list of sections:
  const ALL_SECTION_TABS = [
    { key: '1a_journals', label: '1a. Journal Publications', count: (safeSections.journals || []).length },
    { key: '1b_conferences', label: '1b. Conference Presentations', count: (safeSections.conferences || []).length },
    { key: '1c_patents', label: '2a. Patents', count: (safeSections.patents || []).length },
    { key: '1d_entrepreneurship', label: '2b. Activities and Initiatives', count: (safeSections.entrepreneurship || []).length },
    { key: '3a_fdp_attended', label: '3a. FDPs Attended', count: (safeSections.fdpAttended || []).length },
    { key: '3b_fdp_organized', label: '3b. FDPs Organized', count: (safeSections.fdpOrganized || []).length },
    { key: '4_sdp', label: '4. Student Development Programs (SDPs)', count: (safeSections.sdp || []).length },
    { key: '5a_faculty_achievements', label: '5a. Faculty Achievements', count: (safeSections.facultyAchievements || []).length },
    { key: '5b_student_achievements', label: '5b. Student Achievements', count: (safeSections.studentAchievements || []).length },
    { key: '5c_certifications', label: '5c. Certifications', count: (safeSections.certifications || []).length },
    { key: '6a_dept_meetings', label: 'Meetings', count: (safeSections.deptMeetings || []).length },
    { key: '6b_mous', label: '6. Collaborations & MoUs', count: (safeSections.mous || []).length },
    { key: '8_tech_association', label: '7. Technical Association Activities', count: (safeSections.techAssociation || []).length },
    { key: '10_syllabus', label: '8. Syllabus coverage Report', count: (safeSections.syllabus || []).length },
    { key: 'student_engagement', label: '9. Clubs & Student Engagement Activity', count: (safeSections.studentEngagement || []).length },
    { key: '2_nss', label: '10. NSS and Other Extension Activities', count: (safeSections.nss || []).length },
    { key: '7_additional', label: '11. Additional/Other Relevant Initiatives', count: (safeSections.additionalInitiatives || []).length },
  ];

  // Specific department filtering as requested:
  // - Innovation & Entrepreneurship: only 1c and 1d
  // - Student Engagement & Clubs: only Student Engagement Activity
  // - NSS & Community Engagement: only NSS & Extension Activities
  // - Minutes of the Meeting: only Department Meetings
  // - Academic Departments: All categories EXCEPT Meetings (6a_dept_meetings)
  const SECTION_TABS = React.useMemo(() => {
    if (department === 'Innovation & Entrepreneurship') {
      return ALL_SECTION_TABS.filter(t => t.key === '1c_patents' || t.key === '1d_entrepreneurship');
    }
    if (department === 'Student Engagement & Clubs') {
      return ALL_SECTION_TABS.filter(t => t.key === 'student_engagement');
    }
    if (department === 'NSS & Community Engagement') {
      return ALL_SECTION_TABS.filter(t => t.key === '2_nss');
    }
    if (department === 'Minutes of the Meeting') {
      return ALL_SECTION_TABS.filter(t => t.key === '6a_dept_meetings');
    }
    return ALL_SECTION_TABS.filter(t => t.key !== '6a_dept_meetings');
  }, [department, safeSections]);

  // Keep activeSectionKey focused on an allowed tab when department changes
  useEffect(() => {
    const isCurrentValid = SECTION_TABS.some(t => t.key === activeSectionKey);
    if (!isCurrentValid && SECTION_TABS.length > 0) {
      setActiveSectionKey(SECTION_TABS[0].key);
    }
  }, [SECTION_TABS, activeSectionKey]);

  const totalActivities = Object.values(safeSections).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);



  const handleClearForm = async () => {
    if (window.confirm(`Clear all fields for ${department} (${period})? This will also clear the saved draft from the database.`)) {
      const cleared = { ...INITIAL_SECTIONS };
      setSections(cleared);
      try {
        const payload = {
          department,
          period,
          hodName,
          submissionDate,
          sections: cleared,
          status: 'DRAFT'
        };
        await api.post('/reports/save-department-draft', payload);
        setDbStatus({ saved: false });
        if (onReportGenerated) onReportGenerated();
        toast.success(`Cleared all fields and updated database for ${department}.`);
      } catch (err) {
        toast.info('All fields cleared locally.');
      }
    }
  };

  const handleAddRow = (sectionKey: keyof ReportSectionsData) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      switch (sectionKey) {
        case 'journals':
          copy.journals = [...(copy.journals || []), { title: '', authors: '', journalName: '', issnIsbn: '', volIssueYear: '', pageNos: '', indexedIn: '', link: '' }];
          break;
        case 'conferences':
          copy.conferences = [...(copy.conferences || []), { title: '', authors: '', conferenceName: '', date: '', locationMode: '', volIssueYear: '', pageNos: '', issnIsbn: '', indexedIn: 'Scopus', link: '' }];
          break;
        case 'patents':
          copy.patents = [...(copy.patents || []), { title: '', inventors: '', applicants: '', patentNumber: '', status: '', awardedDate: '', link: '' }];
          break;
        case 'entrepreneurship':
          copy.entrepreneurship = [...(copy.entrepreneurship || []), { title: '', date: '', type: '', participants: '', organizedBy: '', mode: '', keyOutcomes: '', participantsCount: '', mentorCoordinator: '', status: '', link: '' }];
          break;
        case 'nss':
          copy.nss = [...(copy.nss || []), { event: '', date: '', venue: '', type: '', participantsCount: '', typeOfParticipants: '', outcomes: '', coordinator: '', link: '' }];
          break;
        case 'fdpAttended':
          copy.fdpAttended = [...(copy.fdpAttended || []), { title: '', type: '', dates: '', organizingBody: '', mode: '', facultyAttended: '', link: '' }];
          break;
        case 'fdpOrganized':
          copy.fdpOrganized = [...(copy.fdpOrganized || []), { title: '', type: '', dates: '', deptOrganized: department, mode: '', resourcePersonDetails: '', facultyCoordinators: '', link: '' }];
          break;
        case 'fdp':
          copy.fdp = [...(copy.fdp || []), { title: '', type: '', dates: '', organizingBody: '', mode: '', role: '', keyOutcomes: '', link: '' }];
          break;
        case 'sdp':
          copy.sdp = [...(copy.sdp || []), { title: '', date: '', type: '', resourcePerson: '', mode: '', keyOutcomes: '', participantsCount: '', coordinator: '', link: '' }];
          break;
        case 'facultyAchievements':
          copy.facultyAchievements = [...(copy.facultyAchievements || []), { name: '', award: '', organization: '', date: '', link: '' }];
          break;
        case 'studentAchievements':
          copy.studentAchievements = [...(copy.studentAchievements || []), { nameRoll: '', award: '', event: '', organization: '', durationDate: '', link: '' }];
          break;
        case 'certifications':
          copy.certifications = [...(copy.certifications || []), { title: '', type: '', duration: '', platform: '', enrolled: '', certified: '', keyOutcomes: '', link: '' }];
          break;
        case 'deptMeetings':
          copy.deptMeetings = [
            ...(copy.deptMeetings || []),
            {
              title: "HoD's Meeting with Principal",
              meetingNo: `MOM ${(copy.deptMeetings || []).length + 24}`,
              date: '',
              time: '10.15 AM – 12.10 PM',
              venue: 'Principal Chamber, SSE',
              attendees: DEFAULT_SSE_MOM_ATTENDEES.map(a => ({ ...a })),
              agenda: '',
              discussions: [],
              decisions: '',
              policyChanges: '',
              link: ''
            }
          ];
          break;
        case 'mous':
          copy.mous = [...(copy.mous || []), { name: '', purpose: '', datePeriod: '', facultySpoc: '', link: '' }];
          break;
        case 'additionalInitiatives':
          copy.additionalInitiatives = [...(copy.additionalInitiatives || []), { initiative: '', date: '', description: '', outcomes: '', coordinator: '', link: '' }];
          break;
        case 'techAssociation':
          copy.techAssociation = [...(copy.techAssociation || []), { event: '', date: '', type: '', resourcePersonCoordinator: '', participants: '', outcomes: '', link: '' }];
          break;
        case 'iicCell':
          copy.iicCell = [...(copy.iicCell || []), { activity: '', date: '', description: '', partner: '', beneficiaries: '', outcomes: '', link: '' }];
          break;
        case 'syllabus':
          copy.syllabus = [...(copy.syllabus || []), { subject: '', yearSem: '', faculty: '', completed: '', pending: '', remarks: '' }];
          break;
        case 'studentEngagement':
          copy.studentEngagement = [
            ...(copy.studentEngagement || []),
            {
              title: '',
              type: 'Workshop',
              otherType: '',
              noOfDays: '1 day',
              dates: '',
              startDate: '',
              endDate: '',
              participantsCount: '',
              coordinator: '',
              remarks: '',
              link: ''
            }
          ];
          break;
      }
      return copy;
    });
  };

  const handleRemoveRow = (sectionKey: keyof ReportSectionsData, index: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      (copy[sectionKey] as any[]) = (copy[sectionKey] as any[] || []).filter((_, i) => i !== index);
      return copy;
    });
  };

  const handleUpdateField = (sectionKey: keyof ReportSectionsData, index: number, field: string, value: string) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const arr = [...(copy[sectionKey] as any[] || [])];
      arr[index] = { ...arr[index], [field]: value };
      (copy[sectionKey] as any) = arr;
      return copy;
    });
  };

  // Specialized MOM Helpers
  const handleLoadMomTemplate = (meetingIdx: number, version: '21sep' | '16sep' = '21sep') => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      meetings[meetingIdx] = JSON.parse(JSON.stringify(
        version === '21sep' ? DEFAULT_MOM_21_SEP_TEMPLATE : DEFAULT_MOM_24_TEMPLATE
      ));
      copy.deptMeetings = meetings;
      return copy;
    });
    toast.success(version === '21sep' ? 'Loaded 21 Sep MOM (Roles, Reports & Policies)!' : 'Loaded 16 Sep MOM 24 Template!');
  };

  const handleAddMomAttendee = (meetingIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const attendees = [...(meetings[meetingIdx].attendees || []), { name: '', designation: '' }];
      meetings[meetingIdx] = { ...meetings[meetingIdx], attendees };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleFillLeadershipAttendees = (meetingIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      meetings[meetingIdx] = {
        ...meetings[meetingIdx],
        attendees: DEFAULT_SSE_MOM_ATTENDEES.map(a => ({ ...a }))
      };
      copy.deptMeetings = meetings;
      return copy;
    });
    toast.success('Filled SSE Leadership Attendees');
  };

  const handleUpdateMomAttendee = (meetingIdx: number, attIdx: number, field: keyof MomAttendee, value: string) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const attendees = [...(meetings[meetingIdx].attendees || [])];
      attendees[attIdx] = { ...attendees[attIdx], [field]: value };
      meetings[meetingIdx] = { ...meetings[meetingIdx], attendees };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleRemoveMomAttendee = (meetingIdx: number, attIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const attendees = (meetings[meetingIdx].attendees || []).filter((_, i) => i !== attIdx);
      meetings[meetingIdx] = { ...meetings[meetingIdx], attendees };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleAddMomDiscussion = (meetingIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const count = (meetings[meetingIdx].discussions || []).length;
      const discussions = [
        ...(meetings[meetingIdx].discussions || []),
        {
          heading: `${count + 1}. Discussion Topic`,
          details: '',
          tableType: 'none' as const,
          reviewSchedule: [],
          publicationTargets: [],
          postTableDetails: ''
        }
      ];
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleUpdateMomDiscussion = (meetingIdx: number, discIdx: number, updates: Partial<MomDiscussionItem>) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      discussions[discIdx] = { ...discussions[discIdx], ...updates };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleRemoveMomDiscussion = (meetingIdx: number, discIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = (meetings[meetingIdx].discussions || []).filter((_, i) => i !== discIdx);
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleAddReviewRow = (meetingIdx: number, discIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const reviewSchedule = [...(target.reviewSchedule || []), { review: '', date: '' }];
      discussions[discIdx] = { ...target, reviewSchedule };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleUpdateReviewRow = (meetingIdx: number, discIdx: number, rowIdx: number, field: keyof MomReviewRow, val: string) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const reviewSchedule = [...(target.reviewSchedule || [])];
      reviewSchedule[rowIdx] = { ...reviewSchedule[rowIdx], [field]: val };
      discussions[discIdx] = { ...target, reviewSchedule };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleRemoveReviewRow = (meetingIdx: number, discIdx: number, rowIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const reviewSchedule = (target.reviewSchedule || []).filter((_, i) => i !== rowIdx);
      discussions[discIdx] = { ...target, reviewSchedule };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleAddTargetRow = (meetingIdx: number, discIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const publicationTargets = [...(target.publicationTargets || []), { department: '', researchPapers: '', patents: '' }];
      discussions[discIdx] = { ...target, publicationTargets };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleUpdateTargetRow = (meetingIdx: number, discIdx: number, rowIdx: number, field: keyof MomTargetRow, val: string) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const publicationTargets = [...(target.publicationTargets || [])];
      publicationTargets[rowIdx] = { ...publicationTargets[rowIdx], [field]: val };
      discussions[discIdx] = { ...target, publicationTargets };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleRemoveTargetRow = (meetingIdx: number, discIdx: number, rowIdx: number) => {
    setSections(prev => {
      const copy = normalizeSections(prev);
      const meetings = [...(copy.deptMeetings || [])];
      const discussions = [...(meetings[meetingIdx].discussions || [])];
      const target = discussions[discIdx];
      const publicationTargets = (target.publicationTargets || []).filter((_, i) => i !== rowIdx);
      discussions[discIdx] = { ...target, publicationTargets };
      meetings[meetingIdx] = { ...meetings[meetingIdx], discussions };
      copy.deptMeetings = meetings;
      return copy;
    });
  };

  const handleGenerateAndDownload = async () => {
    try {
      setSubmitting(true);
      const toastId = toast.loading(`Generating Word report for ${department}...`);

      const payload = {
        department,
        period,
        hodName,
        submissionDate,
        sections,
        autoSubmit: true
      };

      const res = await api.post('/reports/generate-manual-report', payload);

      if (res.data.success) {
        toast.dismiss(toastId);
        toast.success(`Report generated successfully (${res.data.data.totalActivities} activities)!`);

        if (res.data.data.fileBase64) {
          const byteCharacters = atob(res.data.data.fileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

          const downloadLink = document.createElement('a');
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = res.data.data.fileName || `${department.replace(/\s+/g, '_')}_Monthly_Report.docx`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }

        if (onReportGenerated) {
          onReportGenerated();
        }
      } else {
        toast.dismiss(toastId);
        toast.error(res.data.message || 'Generation failed');
      }
    } catch (err: any) {
      toast.error('Error generating report: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPdf(true);
      const toastId = toast.loading('Crafting professional executive PDF...');

      const element = document.getElementById('hod-pdf-document');
      if (!element) {
        toast.dismiss(toastId);
        toast.error('PDF element could not be found');
        return;
      }

      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `${department.replace(/\s+/g, '_')}_Monthly_Report_${period.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        enableLinks: true,
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: 750,
          windowWidth: 1024,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.break-inside-avoid', 'tr', 'table'] }
      };

      const reportPayload = {
        department,
        hodName,
        period,
        submissionDate,
        sections
      };

      // 1. Asynchronously cache structured JSON on the server
      try {
        await api.post('/reports/save-department-json', reportPayload);
      } catch (_) {
        // Non-blocking
      }

      // 2. Generate PDF with embedded metadata & trigger download
      await (html2pdf as any)()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          pdf.setProperties({
            title: `${department} Monthly Report`,
            subject: JSON.stringify(reportPayload),
            author: hodName,
            creator: 'SSE Buddy Connect'
          });
          pdf.save(opt.filename);
        });

      toast.dismiss(toastId);
      toast.success('Professional PDF generated and downloaded successfully!');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Exact Header Metadata Block */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Monthly Department Report Entry
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter details strictly into the official report format fields. Sections with no entries will generate a single NIL row.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'form' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Form Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Crafted PDF View</span>
              </button>
            </div>



            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Save changes directly to dedicated reports database so you can resume or edit anytime"
            >
              <Database className={`w-3.5 h-3.5 ${savingDraft ? 'animate-spin' : ''}`} />
              <span>{savingDraft ? 'Saving to DB...' : 'Save to Database'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAndDownload}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Official Word format matching template for monthly consolidation"
            >
              <Download className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Download Word (.docx)...' : 'Download Word (.docx)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Crafted professional executive PDF document"
            >
              <FileDown className={`w-3.5 h-3.5 ${generatingPdf ? 'animate-spin' : ''}`} />
              <span>{generatingPdf ? 'Crafting PDF...' : 'Download PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Print document directly"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Dedicated Database Status Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-700">Reports DB:</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              Neon PostgreSQL Connected
            </span>
            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              {autoSaving ? (
                <span className="animate-pulse font-bold text-blue-600">Auto-saving...</span>
              ) : lastAutoSavedAt ? (
                <span>Auto-saved {lastAutoSavedAt} (every 30s)</span>
              ) : (
                <span>Auto-save active (every 30s)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            {loadingDraft ? (
              <span className="text-blue-600 font-bold">Checking saved database entries...</span>
            ) : dbStatus.saved ? (
              <span className="text-slate-600">
                Last saved in DB: <strong className="text-slate-900">{dbStatus.lastSavedAt ? new Date(dbStatus.lastSavedAt).toLocaleTimeString() : 'Recently'}</strong>
                <span className={`ml-2 px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${dbStatus.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                  {dbStatus.status || 'DRAFT'}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 italic">No saved data for {period} (Blank fields ready). Auto-saves every 30s.</span>
            )}
          </div>
        </div>

        {/* The 4 Exact Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Department:
            </label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <optgroup label="Academic Departments">
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Humanities & Sciences">Humanities & Sciences</option>
              </optgroup>
              <optgroup label="Specialized Portals & Committees">
                <option value="Innovation & Entrepreneurship">Innovation & Entrepreneurship</option>
                <option value="Student Engagement & Clubs">Student Engagement & Clubs</option>
                <option value="NSS & Community Engagement">NSS & Community Engagement</option>
                <option value="Minutes of the Meeting">Minutes of the Meeting</option>
              </optgroup>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Reporting Period:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >

              <optgroup label="Academic Year 2026–27">
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
                <option value="January 2027">January 2027</option>
                <option value="February 2027">February 2027</option>
                <option value="March 2027">March 2027</option>
                <option value="April 2027">April 2027</option>
                <option value="May 2027">May 2027</option>
              </optgroup>
              {!['June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027', 'April 2027', 'May 2027'].includes(period) && (
                <option value={period}>{period}</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> HOD Name:
            </label>
            <input
              type="text"
              value={hodName}
              onChange={(e) => setHodName(e.target.value)}
              placeholder="e.g. C Anil Kumar Reddy"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Date of Submission:
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  DD/MM/YYYY
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = String(now.getDate()).padStart(2, '0');
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const y = now.getFullYear();
                    setSubmissionDate(`${d}/${m}/${y}`);
                  }}
                  className="text-[10px] font-extrabold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                  title="Insert Today's Date in DD/MM/YYYY"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(handleDateInputAutoFormat(e.target.value))}
                placeholder="DD/MM/YYYY (e.g. 25/04/2026)"
                maxLength={10}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-600 font-mono tracking-wide"
              />
              <input
                type="date"
                value={getIsoDateFromDDMMYYYY(submissionDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    setSubmissionDate(formatDateToDDMMYYYY(e.target.value));
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0"
                title="Select date from calendar"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <span><strong>{totalActivities}</strong> Total Activities Recorded</span>
          <span>16 Standard Tables</span>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="space-y-6">
          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-950 uppercase tracking-wider">
                  Executive PDF Document Preview
                </h4>
                <p className="text-xs text-blue-700">
                  Clean, publication-grade document layout crafted with executive cards, status pills, and visual hierarchy.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-100/60 text-blue-900 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Return to Form</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FileDown className={`w-3.5 h-3.5 ${generatingPdf ? 'animate-spin' : ''}`} />
                <span>{generatingPdf ? 'Crafting PDF...' : 'Download PDF (.pdf)'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-slate-200/60 p-4 sm:p-8 rounded-3xl overflow-x-auto border border-slate-300/80 shadow-inner">
            <div className="w-full max-w-[840px]">
              <HODProfessionalPDFView
                department={department}
                hodName={hodName}
                period={period}
                submissionDate={submissionDate}
                sections={sections}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs for the 16 Standard Tables */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex gap-2 min-w-max p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              {SECTION_TABS.map((tab) => {
                const isActive = activeSectionKey === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveSectionKey(tab.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive
                      ? 'bg-orange-500 text-white'
                      : tab.count > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-500'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Workspace containing ONLY the exact fields of each table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">

            {/* Table 0: 1a. Journal Publications */}
            {activeSectionKey === '1a_journals' && (
              <SectionContainer
                title="1. Research — a) Journal Publications"
                description="List all research articles, review papers, or technical notes published by faculty/students in peer-reviewed journals during the reporting period."
                count={safeSections.journals.length}
                onAdd={() => handleAddRow('journals')}
              >
                {safeSections.journals.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('journals', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Title of Publication" value={item.title} onChange={(v) => handleUpdateField('journals', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Authors(as mentioned in order)" value={item.authors} onChange={(v) => handleUpdateField('journals', idx, 'authors', v)} />
                      </div>
                      <div>
                        <FieldInput label="Journal Name" value={item.journalName} onChange={(v) => handleUpdateField('journals', idx, 'journalName', v)} />
                      </div>
                      <div>
                        <FieldInput label="ISSN/ISBN" value={item.issnIsbn} onChange={(v) => handleUpdateField('journals', idx, 'issnIsbn', v)} />
                      </div>
                      <div>
                        <FieldInput label="Vol./Issue/Year" value={item.volIssueYear} onChange={(v) => handleUpdateField('journals', idx, 'volIssueYear', v)} />
                      </div>
                      <div>
                        <FieldInput label="Page Nos." value={item.pageNos} onChange={(v) => handleUpdateField('journals', idx, 'pageNos', v)} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Indexed In *
                        </label>
                        <select
                          value={INDEXED_IN_OPTIONS.includes(item.indexedIn) ? item.indexedIn : (item.indexedIn ? 'Other' : 'Scopus')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField('journals', idx, 'indexedIn', val === 'Other' ? '' : val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                          {INDEXED_IN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      {(!INDEXED_IN_OPTIONS.includes(item.indexedIn) || item.indexedIn === 'Other' || item.indexedIn === '') && (
                        <div>
                          <FieldInput
                            label="Specify Custom Indexing (if Other)"
                            value={item.indexedIn === 'Other' ? '' : item.indexedIn}
                            placeholder="e.g. IEEE Xplore, PubMed, SCI, Springer..."
                            onChange={(v) => handleUpdateField('journals', idx, 'indexedIn', v)}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <FieldInput label="Link to Publication/Document" value={item.link} onChange={(v) => handleUpdateField('journals', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 1: 1b. Conference Presentations */}
            {activeSectionKey === '1b_conferences' && (
              <SectionContainer
                title="1. Research — b) Conference Presentations"
                description="Include papers presented at local/national/international conferences, symposiums, or workshops. Note presentation dates and attach link to presentation or conference proceedings."
                count={safeSections.conferences.length}
                onAdd={() => handleAddRow('conferences')}
              >
                {safeSections.conferences.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('conferences', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Title of Paper" value={item.title} onChange={(v) => handleUpdateField('conferences', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Authors" value={item.authors} onChange={(v) => handleUpdateField('conferences', idx, 'authors', v)} />
                      </div>
                      <div>
                        <FieldInput label="Conference Name" value={item.conferenceName} onChange={(v) => handleUpdateField('conferences', idx, 'conferenceName', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('conferences', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Location/Mode" value={item.locationMode} onChange={(v) => handleUpdateField('conferences', idx, 'locationMode', v)} />
                      </div>
                      <div>
                        <FieldInput label="Vol./Issue/Year" value={item.volIssueYear || ''} placeholder="e.g. Vol. 14, Issue 2, 2026" onChange={(v) => handleUpdateField('conferences', idx, 'volIssueYear', v)} />
                      </div>
                      <div>
                        <FieldInput label="Page Nos." value={item.pageNos || ''} placeholder="e.g. pp. 112-124" onChange={(v) => handleUpdateField('conferences', idx, 'pageNos', v)} />
                      </div>
                      <div>
                        <FieldInput label="ISSN/ISBN" value={item.issnIsbn || ''} placeholder="e.g. ISBN: 978-93-91355-12-8" onChange={(v) => handleUpdateField('conferences', idx, 'issnIsbn', v)} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Indexed In *
                        </label>
                        <select
                          value={INDEXED_IN_OPTIONS.includes(item.indexedIn) ? item.indexedIn : (item.indexedIn ? 'Other' : 'Scopus')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField('conferences', idx, 'indexedIn', val === 'Other' ? '' : val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                          {INDEXED_IN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      {(!INDEXED_IN_OPTIONS.includes(item.indexedIn) || item.indexedIn === 'Other' || item.indexedIn === '') && (
                        <div>
                          <FieldInput
                            label="Specify Custom Indexing (if Other)"
                            value={item.indexedIn === 'Other' ? '' : item.indexedIn}
                            placeholder="e.g. IEEE Xplore, Springer, Scopus / Under Review..."
                            onChange={(v) => handleUpdateField('conferences', idx, 'indexedIn', v)}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <FieldInput label="Link to Presentation/Report" value={item.link} onChange={(v) => handleUpdateField('conferences', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 2: 2a. Patents */}
            {activeSectionKey === '1c_patents' && (
              <SectionContainer
                title="2. Innovation & Entrepreneurship — a) Patents"
                description="Record granted or published patents, patent applications, and status updates for departmental innovations and intellectual property filings."
                count={safeSections.patents.length}
                onAdd={() => handleAddRow('patents')}
              >
                {safeSections.patents.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('patents', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Patent Title" value={item.title} onChange={(v) => handleUpdateField('patents', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Inventors(as per publication order)" value={item.inventors} onChange={(v) => handleUpdateField('patents', idx, 'inventors', v)} />
                      </div>
                      <div>
                        <FieldInput label="Applicants" value={item.applicants} onChange={(v) => handleUpdateField('patents', idx, 'applicants', v)} />
                      </div>
                      <div>
                        <FieldInput label="Patent Number" value={item.patentNumber} onChange={(v) => handleUpdateField('patents', idx, 'patentNumber', v)} />
                      </div>
                      <div>
                        <FieldSelect
                          label="Patent Status"
                          value={item.status}
                          options={PATENT_STATUS_OPTIONS}
                          placeholder="Select Status"
                          onChange={(v) => handleUpdateField('patents', idx, 'status', v)}
                        />
                      </div>
                      <div>
                        <DateFieldInput label="Awarded / Filing Date" value={item.awardedDate} onChange={(v) => handleUpdateField('patents', idx, 'awardedDate', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Link to Document/Proof" value={item.link} onChange={(v) => handleUpdateField('patents', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 3: 2b. Activities and Initiatives */}
            {activeSectionKey === '1d_entrepreneurship' && (
              <SectionContainer
                title="2. Innovation & Entrepreneurship — b) Activities and Initiatives"
                description="List start-ups/spin-offs, business idea competitions, incubation activities, or innovation challenges in which the department/faculty/students participated."
                count={safeSections.entrepreneurship.length}
                onAdd={() => handleAddRow('entrepreneurship')}
              >
                {safeSections.entrepreneurship.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('entrepreneurship', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Entrepreneurship Activity/Program Title" value={item.title} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'title', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Type of Activity (Workshop/Competition/Incubation/Training/Mentorship etc.)" value={item.type} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'type', v)} />
                      </div>
                      <div>
                        <FieldInput label="Participants (Student/Faculty/Alumni)" value={item.participants} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'participants', v)} />
                      </div>
                      <div>
                        <FieldInput label="Organized By (Department/ED Cell/Incubator)" value={item.organizedBy} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'organizedBy', v)} />
                      </div>
                      <div>
                        <FieldInput label="Mode (Online/Offline/Hybrid)" value={item.mode} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'mode', v)} />
                      </div>
                      <div>
                        <FieldInput label="No. of Participants" value={item.participantsCount} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'participantsCount', v)} />
                      </div>
                      <div>
                        <FieldInput label="Mentor/Coordinator" value={item.mentorCoordinator} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'mentorCoordinator', v)} />
                      </div>
                      <div>
                        <FieldInput label="Status (Ongoing/Completed)" value={item.status} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'status', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Proof/Report Link" value={item.link} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 4: 2. NSS and Other Extension Activities */}
            {activeSectionKey === '2_nss' && (
              <SectionContainer
                title="10. NSS and Other Extension Activities"
                description="Capture all social outreach and community service work undertaken by the department, including NSS camps, awareness drives, and extension events."
                count={safeSections.nss.length}
                onAdd={() => handleAddRow('nss')}
              >
                {safeSections.nss.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('nss', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Event Name" value={item.event} onChange={(v) => handleUpdateField('nss', idx, 'event', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('nss', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Venue" value={item.venue} onChange={(v) => handleUpdateField('nss', idx, 'venue', v)} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Type of Activity *
                        </label>
                        <select
                          value={STUDENT_ENGAGEMENT_ACTIVITY_TYPES.includes(item.type) ? item.type : (item.type ? 'Other' : 'NSS / Extension Activity')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField('nss', idx, 'type', val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                          {STUDENT_ENGAGEMENT_ACTIVITY_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {(!STUDENT_ENGAGEMENT_ACTIVITY_TYPES.includes(item.type) || item.type === 'Other') && (
                        <div className="md:col-span-2">
                          <FieldInput
                            label="Specify Custom Type (if Other)"
                            value={item.type === 'Other' ? '' : item.type}
                            onChange={(v) => handleUpdateField('nss', idx, 'type', v)}
                          />
                        </div>
                      )}
                      <div>
                        <FieldInput label="No. of Participants" value={item.participantsCount} onChange={(v) => handleUpdateField('nss', idx, 'participantsCount', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Type of Participants(Students/NSS Volunteers/Villagers/General Public/Faculty)" value={item.typeOfParticipants} onChange={(v) => handleUpdateField('nss', idx, 'typeOfParticipants', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Outcomes" value={item.outcomes} onChange={(v) => handleUpdateField('nss', idx, 'outcomes', v)} />
                      </div>
                      <div>
                        <FieldInput label="Coordinator" value={item.coordinator} onChange={(v) => handleUpdateField('nss', idx, 'coordinator', v)} />
                      </div>
                      <div>
                        <FieldInput label="Report/Photo Link" value={item.link} onChange={(v) => handleUpdateField('nss', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 5A: 3a. Faculty Development Programs (FDPs) - Attended */}
            {activeSectionKey === '3a_fdp_attended' && (
              <SectionContainer
                title="3. Faculty Development Programs (FDPs) — a) Attended"
                description="List every short-term training, development course, workshop, or seminar attended by faculty for professional development. Attach certificates where possible."
                count={safeSections.fdpAttended.length}
                onAdd={() => handleAddRow('fdpAttended')}
              >
                {safeSections.fdpAttended.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('fdpAttended', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Program Title" value={item.title} onChange={(v) => handleUpdateField('fdpAttended', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Type (FDP/Workshop/Seminar/Conference)" value={item.type} onChange={(v) => handleUpdateField('fdpAttended', idx, 'type', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Dates" value={item.dates} onChange={(v) => handleUpdateField('fdpAttended', idx, 'dates', v)} placeholder="DD/MM/YYYY or DD/MM/YYYY to DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Organizing Body" value={item.organizingBody} onChange={(v) => handleUpdateField('fdpAttended', idx, 'organizingBody', v)} />
                      </div>
                      <div>
                        <FieldInput label="Mode (Online/Offline/Hybrid)" value={item.mode} onChange={(v) => handleUpdateField('fdpAttended', idx, 'mode', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Name of the faculty attended" value={item.facultyAttended} onChange={(v) => handleUpdateField('fdpAttended', idx, 'facultyAttended', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Proof/Certificate Link" value={item.link} onChange={(v) => handleUpdateField('fdpAttended', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 5B: 3b. Faculty Development Programs (FDPs) - Organized */}
            {activeSectionKey === '3b_fdp_organized' && (
              <SectionContainer
                title="3. Faculty Development Programs (FDPs) — b) Organized"
                description="List every short-term training, faculty development program, workshop, or seminar organized by the department."
                count={safeSections.fdpOrganized.length}
                onAdd={() => handleAddRow('fdpOrganized')}
              >
                {safeSections.fdpOrganized.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('fdpOrganized', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Program Title" value={item.title} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Type (FDP/Workshop/Seminar/Conference)" value={item.type} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'type', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Dates" value={item.dates} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'dates', v)} placeholder="DD/MM/YYYY or DD/MM/YYYY to DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Dept. Organized" value={item.deptOrganized} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'deptOrganized', v)} />
                      </div>
                      <div>
                        <FieldInput label="Mode (Online/Offline/Hybrid)" value={item.mode} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'mode', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Resource person name, designation, co-organization and address" value={item.resourcePersonDetails} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'resourcePersonDetails', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Name of the faculty coordinator/s" value={item.facultyCoordinators} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'facultyCoordinators', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Proof/Certificate Link" value={item.link} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 6: 4. Student Development Programs (SDPs) */}
            {activeSectionKey === '4_sdp' && (
              <SectionContainer
                title="4. Student Development Programs (SDPs)"
                description="Include workshops, seminars, guest lectures, industrial visits, internships, symposiums, and community projects for students. Indicate type and outcomes for each."
                count={safeSections.sdp.length}
                onAdd={() => handleAddRow('sdp')}
              >
                {safeSections.sdp.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('sdp', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Event Title" value={item.title} onChange={(v) => handleUpdateField('sdp', idx, 'title', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('sdp', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Type of Activity *
                        </label>
                        <select
                          value={SDP_ACTIVITY_TYPES.includes(item.type) ? item.type : (item.type ? 'Other' : 'Workshop')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField('sdp', idx, 'type', val === 'Other' ? '' : val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                          {SDP_ACTIVITY_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      {(!SDP_ACTIVITY_TYPES.includes(item.type) || item.type === 'Other' || item.type === '') && (
                        <div>
                          <FieldInput
                            label="Specify Custom Type (if Other)"
                            value={item.type === 'Other' ? '' : item.type}
                            placeholder="e.g. Hands-on Technical SDP, Software Training SDP..."
                            onChange={(v) => handleUpdateField('sdp', idx, 'type', v)}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <FieldInput label="Resource Person with designation /Organization" value={item.resourcePerson} onChange={(v) => handleUpdateField('sdp', idx, 'resourcePerson', v)} />
                      </div>
                      <div>
                        <FieldInput label="Mode (Online/Offline/Hybrid)" value={item.mode} onChange={(v) => handleUpdateField('sdp', idx, 'mode', v)} />
                      </div>
                      <div>
                        <FieldInput label="No. of Participants" value={item.participantsCount} onChange={(v) => handleUpdateField('sdp', idx, 'participantsCount', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Key Outcomes" value={item.keyOutcomes} onChange={(v) => handleUpdateField('sdp', idx, 'keyOutcomes', v)} />
                      </div>
                      <div>
                        <FieldInput label="Coordinator" value={item.coordinator} onChange={(v) => handleUpdateField('sdp', idx, 'coordinator', v)} />
                      </div>
                      <div>
                        <FieldInput label="Report/Photo Link" value={item.link} onChange={(v) => handleUpdateField('sdp', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 7: 5a. Faculty Achievements */}
            {activeSectionKey === '5a_faculty_achievements' && (
              <SectionContainer
                title="5. Achievements & Awards — a) Faculty Achievements"
                description="Recognitions for teaching, research, professional work, or leadership."
                count={safeSections.facultyAchievements.length}
                onAdd={() => handleAddRow('facultyAchievements')}
              >
                {safeSections.facultyAchievements.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('facultyAchievements', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <FieldInput label="Name" value={item.name} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'name', v)} />
                      </div>
                      <div>
                        <FieldInput label="Award/Recognition" value={item.award} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'award', v)} />
                      </div>
                      <div>
                        <FieldInput label="Organization/Body" value={item.organization} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'organization', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Proof/Certificate Link" value={item.link} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 8: 5b. Student Achievements */}
            {activeSectionKey === '5b_student_achievements' && (
              <SectionContainer
                title="b) Student Achievements"
                description="Achievements in academic, co-curricular, extra-curricular, or professional events."
                count={safeSections.studentAchievements.length}
                onAdd={() => handleAddRow('studentAchievements')}
              >
                {safeSections.studentAchievements.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('studentAchievements', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <FieldInput label="Name-Roll No" value={item.nameRoll} onChange={(v) => handleUpdateField('studentAchievements', idx, 'nameRoll', v)} />
                      </div>
                      <div>
                        <FieldInput label="Award/Recognition" value={item.award} onChange={(v) => handleUpdateField('studentAchievements', idx, 'award', v)} />
                      </div>
                      <div>
                        <FieldInput label="Event/Competition" value={item.event} onChange={(v) => handleUpdateField('studentAchievements', idx, 'event', v)} />
                      </div>
                      <div>
                        <FieldInput label="Organization" value={item.organization} onChange={(v) => handleUpdateField('studentAchievements', idx, 'organization', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Duration and Date" value={item.durationDate} onChange={(v) => handleUpdateField('studentAchievements', idx, 'durationDate', v)} placeholder="DD/MM/YYYY or Duration & Date" />
                      </div>
                      <div>
                        <FieldInput label="Proof/Certificate Link" value={item.link} onChange={(v) => handleUpdateField('studentAchievements', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 9: 5c. Certifications */}
            {activeSectionKey === '5c_certifications' && (
              <SectionContainer
                title="c) Certifications"
                description="Certifications acquired by students and faculty."
                count={safeSections.certifications.length}
                onAdd={() => handleAddRow('certifications')}
              >
                {safeSections.certifications.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('certifications', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Program Title" value={item.title} onChange={(v) => handleUpdateField('certifications', idx, 'title', v)} />
                      </div>
                      <div>
                        <FieldInput label="Type" value={item.type} onChange={(v) => handleUpdateField('certifications', idx, 'type', v)} />
                      </div>
                      <div>
                        <FieldInput label="Duration" value={item.duration} onChange={(v) => handleUpdateField('certifications', idx, 'duration', v)} />
                      </div>
                      <div>
                        <FieldInput label="Resource Person/Platform" value={item.platform} onChange={(v) => handleUpdateField('certifications', idx, 'platform', v)} />
                      </div>
                      <div>
                        <FieldInput label="Students/faculty Enrolled" value={item.enrolled} onChange={(v) => handleUpdateField('certifications', idx, 'enrolled', v)} />
                      </div>
                      <div>
                        <FieldInput label="Students/faculty  Certified" value={item.certified} onChange={(v) => handleUpdateField('certifications', idx, 'certified', v)} />
                      </div>
                      <div>
                        <FieldInput label="Key Outcomes" value={item.keyOutcomes} onChange={(v) => handleUpdateField('certifications', idx, 'keyOutcomes', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Evidence Link" value={item.link} onChange={(v) => handleUpdateField('certifications', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 10: Meetings (Minutes of the Meeting) */}
            {activeSectionKey === '6a_dept_meetings' && (
              <SectionContainer
                title="Minutes of the Meeting (MOM)"
                description="Institutional Meeting Minutes: Executive Leadership, Attendees Roster, Numbered Agenda, and Discussion Records with Embedded Milestone/Target Tables."
                count={safeSections.deptMeetings.length}
                onAdd={() => handleAddRow('deptMeetings')}
              >
                {safeSections.deptMeetings.map((item, mIdx) => (
                  <EntryCard key={mIdx} index={mIdx} onDelete={() => handleRemoveRow('deptMeetings', mIdx)}>
                    <div className="space-y-6">

                      {/* Top Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] uppercase tracking-wider">
                            {`Meeting #${mIdx + 1}`}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.title || "HoD's Meeting with Principal"}
                          </span>
                        </div>
                      </div>

                      {/* Meeting Logistics Block */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div className="md:col-span-3">
                          <FieldInput
                            label="Meeting Title"
                            value={item.title || ''}
                            placeholder="e.g. HoD's Meeting with Principal"
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'title', v)}
                          />
                        </div>
                        <div>
                          <DateFieldInput
                            label="Date"
                            value={item.date || ''}
                            placeholder="DD/MM/YYYY or e.g. 16/09/2026"
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'date', v)}
                          />
                        </div>
                        <div>
                          <FieldInput
                            label="Time"
                            value={item.time || ''}
                            placeholder="e.g. 10.15 AM – 12.10 PM"
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'time', v)}
                          />
                        </div>
                        <div>
                          <FieldInput
                            label="Venue"
                            value={item.venue || ''}
                            placeholder="e.g. Principal Chamber, SSE"
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'venue', v)}
                          />
                        </div>
                      </div>

                      {/* Section 1: Attendees */}
                      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                              Attendees Roster ({(item.attendees || []).length})
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Leadership and faculty present during the proceedings
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleFillLeadershipAttendees(mIdx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors cursor-pointer"
                            >
                              <span>⚡ Fill SSE Leadership</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddMomAttendee(mIdx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Attendee</span>
                            </button>
                          </div>
                        </div>

                        {(!item.attendees || item.attendees.length === 0) ? (
                          <div className="text-center py-4 text-xs text-slate-400">
                            No attendees added. Click "Fill SSE Leadership" or "Add Attendee".
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.attendees.map((att, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                                <span className="w-6 text-center text-xs font-bold text-slate-400 shrink-0">
                                  {aIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={att.name}
                                  placeholder="Faculty / Leader Name"
                                  onChange={(e) => handleUpdateMomAttendee(mIdx, aIdx, 'name', e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                />
                                <input
                                  type="text"
                                  value={att.designation}
                                  placeholder="Designation / Role"
                                  onChange={(e) => handleUpdateMomAttendee(mIdx, aIdx, 'designation', e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMomAttendee(mIdx, aIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                                  title="Remove attendee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Agenda */}
                      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
                        <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                          Meeting Agenda
                        </label>
                        <p className="text-[11px] text-slate-500">
                          List meeting points (e.g. ERP Portal, Assignments, IV Year Project Reviews, Targets, etc.)
                        </p>
                        <BulletTextarea
                          label=""
                          value={item.agenda || ''}
                          onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'agenda', v)}
                          placeholder="• ERP Portal – Leave & Class Substitution&#10;• Assignments – Moodle Portal&#10;• IV Year Project Review Schedule&#10;• Research Paper & Patent Publication Targets"
                        />
                      </div>

                      {/* Section 3: Detailed Discussion Topics & Minutes */}
                      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                              Detailed Discussion Topics &amp; Minutes ({(item.discussions || []).length})
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Numbered minutes with optional embedded review schedules or target tables
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddMomDiscussion(mIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Discussion Topic</span>
                          </button>
                        </div>

                        {(!item.discussions || item.discussions.length === 0) ? (
                          <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-xs text-slate-500 mb-2">No detailed discussion topics added yet.</p>
                            <button
                              type="button"
                              onClick={() => handleLoadMomTemplate(mIdx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Load Standard 8 Topics from MOM 24 Word Template</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {item.discussions.map((disc, dIdx) => (
                              <div key={dIdx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {dIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={disc.heading}
                                      placeholder="Topic Title (e.g. 1. ERP Portal – Leave & Class Substitution)"
                                      onChange={(e) => handleUpdateMomDiscussion(mIdx, dIdx, { heading: e.target.value })}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMomDiscussion(mIdx, dIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                                    title="Delete this topic"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div>
                                  <BulletTextarea
                                    label="Discussion Points / Directives"
                                    value={disc.details}
                                    placeholder="• Enter key directives, guidelines, or points discussed..."
                                    onChange={(v) => handleUpdateMomDiscussion(mIdx, dIdx, { details: v })}
                                  />
                                </div>

                                {/* Embedded Table Selector */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className="text-[11px] font-bold text-slate-700">
                                      Embedded Table Format:
                                    </label>
                                    <select
                                      value={disc.tableType || 'none'}
                                      onChange={(e) => {
                                        const tType = e.target.value as any;
                                        if (tType === 'project_reviews' && (!disc.reviewSchedule || disc.reviewSchedule.length === 0)) {
                                          handleUpdateMomDiscussion(mIdx, dIdx, {
                                            tableType: tType,
                                            reviewSchedule: [
                                              { review: '1st Review', date: '21 September 2026' },
                                              { review: '2nd Review', date: '09 October 2026' },
                                              { review: '3rd / Final Review', date: '23 October 2026' },
                                              { review: 'Final Project Report Submission', date: '24 December 2026' }
                                            ]
                                          });
                                        } else if (tType === 'publication_targets' && (!disc.publicationTargets || disc.publicationTargets.length === 0)) {
                                          handleUpdateMomDiscussion(mIdx, dIdx, {
                                            tableType: tType,
                                            publicationTargets: [
                                              { department: 'Mechanical Engineering', researchPapers: '4', patents: '0' },
                                              { department: 'EEE', researchPapers: '8', patents: '3' },
                                              { department: 'CSE', researchPapers: '20', patents: '16' },
                                              { department: 'Civil Engineering', researchPapers: '4', patents: '2' },
                                              { department: 'ECE', researchPapers: '7', patents: '4' }
                                            ]
                                          });
                                        } else {
                                          handleUpdateMomDiscussion(mIdx, dIdx, { tableType: tType });
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                                    >
                                      <option value="none">None (Text Only)</option>
                                      <option value="project_reviews">IV Year Project Review Schedule Table</option>
                                      <option value="publication_targets">Research Paper &amp; Patent Targets Table</option>
                                    </select>
                                  </div>

                                  {/* Table 1: Project Review Schedule */}
                                  {disc.tableType === 'project_reviews' && (
                                    <div className="space-y-2 pt-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-700">
                                          Review Milestone Rows ({(disc.reviewSchedule || []).length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddReviewRow(mIdx, dIdx)}
                                          className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                                        >
                                          + Add Review Milestone
                                        </button>
                                      </div>
                                      {(disc.reviewSchedule || []).map((rRow, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={rRow.review}
                                            placeholder="e.g. 1st Review"
                                            onChange={(e) => handleUpdateReviewRow(mIdx, dIdx, rIdx, 'review', e.target.value)}
                                            className="flex-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                          />
                                          <div className="flex-1 relative flex items-center">
                                            <input
                                              type="text"
                                              value={rRow.date}
                                              placeholder="DD/MM/YYYY"
                                              onChange={(e) => handleUpdateReviewRow(mIdx, dIdx, rIdx, 'date', handleDateInputAutoFormat(e.target.value))}
                                              className="w-full pl-2.5 pr-8 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                                            />
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                              <input
                                                type="date"
                                                value={getIsoDateFromDDMMYYYY(rRow.date)}
                                                onChange={(e) => {
                                                  if (e.target.value) {
                                                    handleUpdateReviewRow(mIdx, dIdx, rIdx, 'date', formatDateToDDMMYYYY(e.target.value));
                                                  }
                                                }}
                                                className="opacity-0 absolute inset-0 w-6 h-6 cursor-pointer"
                                                title="Pick review date"
                                              />
                                              <div className="p-0.5 rounded bg-slate-50 border border-slate-200 pointer-events-none text-slate-600">
                                                <Calendar className="w-3 h-3 text-blue-600" />
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveReviewRow(mIdx, dIdx, rIdx)}
                                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Table 2: Publication Targets */}
                                  {disc.tableType === 'publication_targets' && (
                                    <div className="space-y-2 pt-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-700">
                                          Department Target Rows ({(disc.publicationTargets || []).length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddTargetRow(mIdx, dIdx)}
                                          className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                                        >
                                          + Add Department Target
                                        </button>
                                      </div>
                                      {(disc.publicationTargets || []).map((tRow, tIdx) => (
                                        <div key={tIdx} className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={tRow.department}
                                            placeholder="Department (e.g. CSE)"
                                            onChange={(e) => handleUpdateTargetRow(mIdx, dIdx, tIdx, 'department', e.target.value)}
                                            className="flex-2 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                          />
                                          <input
                                            type="text"
                                            value={tRow.researchPapers}
                                            placeholder="Papers (e.g. 20)"
                                            onChange={(e) => handleUpdateTargetRow(mIdx, dIdx, tIdx, 'researchPapers', e.target.value)}
                                            className="flex-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                          />
                                          <input
                                            type="text"
                                            value={tRow.patents}
                                            placeholder="Patents (e.g. 16)"
                                            onChange={(e) => handleUpdateTargetRow(mIdx, dIdx, tIdx, 'patents', e.target.value)}
                                            className="flex-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveTargetRow(mIdx, dIdx, tIdx)}
                                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {disc.tableType !== 'none' && (
                                    <FieldInput
                                      label="Post-Table Directive / Remarks"
                                      value={disc.postTableDetails || ''}
                                      placeholder="e.g. All HODs are requested to monitor the progress regularly..."
                                      onChange={(v) => handleUpdateMomDiscussion(mIdx, dIdx, { postTableDetails: v })}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Policy Changes and Links */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
                        <div>
                          <FieldInput
                            label="Policy Changes / Key Takeaways (if any)"
                            value={item.policyChanges || ''}
                            placeholder="e.g. Mandatory online ERP substitution acceptance before leave approval"
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'policyChanges', v)}
                          />
                        </div>
                        <div>
                          <FieldInput
                            label="Signed Minutes / Digital Proof Link"
                            value={item.link || ''}
                            placeholder="https://..."
                            onChange={(v) => handleUpdateField('deptMeetings', mIdx, 'link', v)}
                          />
                        </div>
                      </div>

                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 11: 6. Collaborations & MoUs */}
            {activeSectionKey === '6b_mous' && (
              <SectionContainer
                title="6. Collaborations & MoUs"
                description="Formal agreements/ongoing collaborations with industry, academia, or organizations."
                count={safeSections.mous.length}
                onAdd={() => handleAddRow('mous')}
              >
                {safeSections.mous.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('mous', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Name of Industry/Academic Body" value={item.name} onChange={(v) => handleUpdateField('mous', idx, 'name', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Nature & Purpose" value={item.purpose} onChange={(v) => handleUpdateField('mous', idx, 'purpose', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date of Signing/Active Period" value={item.datePeriod} onChange={(v) => handleUpdateField('mous', idx, 'datePeriod', v)} placeholder="DD/MM/YYYY or Period" />
                      </div>
                      <div>
                        <FieldInput label="Faculty Involved(SPOC)" value={item.facultySpoc} onChange={(v) => handleUpdateField('mous', idx, 'facultySpoc', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Supporting Documents/Link" value={item.link} onChange={(v) => handleUpdateField('mous', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 12: 7. Additional/Other Relevant Initiatives */}
            {activeSectionKey === '7_additional' && (
              <SectionContainer
                title="11. Additional/Other Relevant Initiatives"
                description="Alumni engagement, quality initiatives, special projects, or areas not elsewhere covered."
                count={safeSections.additionalInitiatives.length}
                onAdd={() => handleAddRow('additionalInitiatives')}
              >
                {safeSections.additionalInitiatives.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('additionalInitiatives', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Initiative/Activity" value={item.initiative} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'initiative', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <FieldInput label="Coordinator(s)" value={item.coordinator} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'coordinator', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Description" value={item.description} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'description', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Outcomes" value={item.outcomes} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'outcomes', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Report/Link/Proof" value={item.link} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 13: 8. Technical Association Activities */}
            {activeSectionKey === '8_tech_association' && (
              <SectionContainer
                title="7. Technical Association Activities"
                description="Organizes technical workshops, competitions, industrial visits, and seminars to enhance technical skills."
                count={safeSections.techAssociation.length}
                onAdd={() => handleAddRow('techAssociation')}
              >
                {safeSections.techAssociation.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('techAssociation', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Event / Activity" value={item.event} onChange={(v) => handleUpdateField('techAssociation', idx, 'event', v)} />
                      </div>
                      <div>
                        <DateFieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('techAssociation', idx, 'date', v)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Type of Activity *
                        </label>
                        <select
                          value={STUDENT_ENGAGEMENT_ACTIVITY_TYPES.includes(item.type) ? item.type : (item.type ? 'Other' : 'Technical Association Activity')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField('techAssociation', idx, 'type', val);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                        >
                          {STUDENT_ENGAGEMENT_ACTIVITY_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {(!STUDENT_ENGAGEMENT_ACTIVITY_TYPES.includes(item.type) || item.type === 'Other') && (
                        <div className="md:col-span-2">
                          <FieldInput
                            label="Specify Custom Type (if Other)"
                            value={item.type === 'Other' ? '' : item.type}
                            onChange={(v) => handleUpdateField('techAssociation', idx, 'type', v)}
                          />
                        </div>
                      )}
                      <div>
                        <FieldInput label="Resource Person / Coordinator" value={item.resourcePersonCoordinator} onChange={(v) => handleUpdateField('techAssociation', idx, 'resourcePersonCoordinator', v)} />
                      </div>
                      <div>
                        <FieldInput label="Participants" value={item.participants} onChange={(v) => handleUpdateField('techAssociation', idx, 'participants', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Evidence / Proof Link" value={item.link} onChange={(v) => handleUpdateField('techAssociation', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 15: 10. Syllabus coverage Report */}
            {activeSectionKey === '10_syllabus' && (
              <SectionContainer
                title="8. Syllabus coverage Report (Summer Vacation holidays)"
                description="Tracking syllabus completion status across all classes and faculty."
                count={safeSections.syllabus.length}
                onAdd={() => handleAddRow('syllabus')}
              >
                {safeSections.syllabus.map((item, idx) => {
                  const isLab = (item.subject || '').toLowerCase().includes('lab') ||
                    (item.subject || '').toLowerCase().includes('practical') ||
                    (item.subject || '').toLowerCase().includes('simulation') ||
                    (item.completed || '').toLowerCase().includes('exp') ||
                    (item.completed || '').toLowerCase().includes('experiment');

                  const theoryMatched = SYLLABUS_THEORY_OPTIONS.find(o => o.value === item.completed);
                  const labMatched = SYLLABUS_LAB_OPTIONS.find(o => o.value === item.completed);
                  const isCustomValue = !theoryMatched && !labMatched && Boolean(item.completed);

                  // Extract percentage for progress bar
                  let currentPct = 0;
                  if (theoryMatched) currentPct = theoryMatched.pct;
                  else if (labMatched) currentPct = labMatched.pct;
                  else {
                    const pctMatch = (item.completed || '').match(/(\d+(?:\.\d+)?)\s*%/);
                    if (pctMatch) currentPct = Math.min(100, parseFloat(pctMatch[1]));
                    else {
                      const numMatch = (item.completed || '').match(/(\d+(?:\.\d+)?)/);
                      if (numMatch) {
                        const n = parseFloat(numMatch[1]);
                        currentPct = isLab ? Math.min(100, Math.round((n / 10) * 100)) : Math.min(100, Math.round((n / 5) * 100));
                      }
                    }
                  }

                  return (
                    <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('syllabus', idx)}>
                      <div className="space-y-4">
                        {/* Course Category Badge & Quick Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 ${isLab ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                              <span>{isLab ? '🔬 Lab / Practical Course' : '📘 Theory Course (Total: 5 Units)'}</span>
                            </span>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[280px]">
                              {item.subject || 'Course Title Not Specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">Progress:</span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${currentPct >= 100 ? 'bg-emerald-100 text-emerald-800' : currentPct >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {currentPct}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${currentPct >= 100 ? 'bg-emerald-500' : currentPct >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                            style={{ width: `${currentPct}%` }}
                          />
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          <div className="md:col-span-2">
                            <FieldInput
                              label="Course / Subject Title *"
                              value={item.subject}
                              placeholder="e.g. Operating Systems / Power Electronics Lab"
                              onChange={(v) => handleUpdateField('syllabus', idx, 'subject', v)}
                            />
                          </div>
                          <div>
                            <FieldInput
                              label="Year / Semester"
                              value={item.yearSem}
                              placeholder="e.g. III B.Tech I Sem / 3-1"
                              onChange={(v) => handleUpdateField('syllabus', idx, 'yearSem', v)}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <FieldInput
                              label="Faculty In-Charge"
                              value={item.faculty}
                              placeholder="e.g. Dr. Kethineni Vinod Kumar"
                              onChange={(v) => handleUpdateField('syllabus', idx, 'faculty', v)}
                            />
                          </div>

                          {/* Completed Units / Experiments Selector */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span>
                                {isLab ? 'Completed Experiments (out of Lab Total) *' : 'Completed Units (Select 0 to 5 Units) *'}
                              </span>
                              {isCustomValue && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Custom / Legacy Value Active
                                </span>
                              )}
                            </label>

                            {/* Dropdown Selector */}
                            <select
                              value={item.completed}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'CUSTOM') {
                                  // Keep current value or blank
                                  return;
                                }
                                const autoPending = calculatePendingFromCompleted(val, isLab);
                                const copy = [...safeSections.syllabus];
                                copy[idx] = {
                                  ...copy[idx],
                                  completed: val,
                                  pending: autoPending || copy[idx].pending
                                };
                                setSections(prev => ({ ...prev, syllabus: copy }));
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer transition-all"
                            >
                              <option value="" disabled>-- Select Completed Units / Progress --</option>
                              {isLab ? (
                                <optgroup label="🔬 Lab Experiments Completed">
                                  {SYLLABUS_LAB_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </optgroup>
                              ) : (
                                <optgroup label="📘 Theory Units Completed (Total 5 Units)">
                                  {SYLLABUS_THEORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </optgroup>
                              )}
                              {isCustomValue && (
                                <option value={item.completed}>Custom: "{item.completed}"</option>
                              )}
                            </select>

                            {/* Quick Units Buttons for Instant 1-Click Selection */}
                            {!isLab ? (
                              <div className="pt-1">
                                <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                  <span>⚡ Quick Units Selector:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {SYLLABUS_THEORY_OPTIONS.map(opt => {
                                    const isSelected = item.completed === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          const copy = [...safeSections.syllabus];
                                          copy[idx] = {
                                            ...copy[idx],
                                            completed: opt.value,
                                            pending: opt.pending
                                          };
                                          setSections(prev => ({ ...prev, syllabus: copy }));
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                            : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                                          }`}
                                      >
                                        {opt.units} {opt.units === 1 ? 'Unit' : 'Units'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1">
                                <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                  <span>⚡ Quick Experiments Selector:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {SYLLABUS_LAB_OPTIONS.map(opt => {
                                    const isSelected = item.completed === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          const copy = [...safeSections.syllabus];
                                          copy[idx] = {
                                            ...copy[idx],
                                            completed: opt.value,
                                            pending: opt.pending
                                          };
                                          setSections(prev => ({ ...prev, syllabus: copy }));
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${isSelected
                                            ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                            : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                                          }`}
                                      >
                                        {opt.done} Exp
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Custom Manual Entry if needed */}
                            {isCustomValue && (
                              <div className="pt-1">
                                <FieldInput
                                  label="Custom Completed Status"
                                  value={item.completed}
                                  placeholder="e.g. 1,2,3,4 Units Completed"
                                  onChange={(v) => {
                                    const autoPending = calculatePendingFromCompleted(v, isLab);
                                    handleUpdateField('syllabus', idx, 'completed', v);
                                    if (autoPending) {
                                      handleUpdateField('syllabus', idx, 'pending', autoPending);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Auto-Calculated Pending Field */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">
                                Pending Status *
                              </label>
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ⚡ Auto-calculated
                              </span>
                            </div>
                            <input
                              type="text"
                              value={item.pending || ''}
                              placeholder={isLab ? 'e.g. Nil or 2 Exp Pending' : 'e.g. Nil or 1 Unit (20%)'}
                              onChange={(e) => handleUpdateField('syllabus', idx, 'pending', e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 font-mono tracking-wide"
                            />
                            <p className="text-[10px] text-slate-400">
                              Automatically computed as ({isLab ? 'Total - Done' : '5 - Completed Units'}). You can also edit if needed.
                            </p>
                          </div>

                          {/* Remarks */}
                          <div className="md:col-span-3">
                            <FieldInput
                              label="Remarks / Action Plan"
                              value={item.remarks}
                              placeholder="e.g. Extra classes scheduled / Revision sessions underway"
                              onChange={(v) => handleUpdateField('syllabus', idx, 'remarks', v)}
                            />
                          </div>
                        </div>
                      </div>
                    </EntryCard>
                  );
                })}
              </SectionContainer>
            )}

            {/* Student Engagement Activity Table */}
            {activeSectionKey === 'student_engagement' && (
              <SectionContainer
                title="9. Clubs & Student Engagement Activity"
                description="Record student workshops, guest lectures, expert talks, industrial visits, internships, mentoring sessions, and clubs."
                count={(safeSections.studentEngagement || []).length}
                onAdd={() => handleAddRow('studentEngagement')}
              >
                {(safeSections.studentEngagement || []).map((item, idx) => {

                  const standardTypes = [
                    'FDP',
                    'Seminar',
                    'Guest lecture',
                    'Expert lecture',
                    'Industrial visit',
                    'Internship',
                    'Mentoring session',
                    'Conference',
                    'Workshop',
                    'Value Added Course',
                    'NSS / Extension Activity',
                    'Technical Association Activity',
                    'Hackathon / Project Expo',
                    'Certification Course',
                    'Field Trip',
                    'Club Event / Cultural Activity',
                    'Other'
                  ];

                  const isOtherType = item.type === 'Other' || (!standardTypes.includes(item.type) && Boolean(item.type));

                  return (
                    <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('studentEngagement', idx)}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {/* Title */}
                        <div className="md:col-span-2">
                          <FieldInput
                            label="Title of the activity *"
                            value={item.title}
                            onChange={(v) => handleUpdateField('studentEngagement', idx, 'title', v)}
                          />
                        </div>

                        {/* Type of Activity Dropdown */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Type of activity *
                          </label>
                          <select
                            value={standardTypes.includes(item.type) ? item.type : 'Other'}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateField('studentEngagement', idx, 'type', val);
                              if (val !== 'Other') {
                                handleUpdateField('studentEngagement', idx, 'otherType', '');
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                          >
                            {standardTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* If Other Type is selected, show custom input */}
                        {isOtherType && (
                          <div className="md:col-span-3">
                            <FieldInput
                              label="Specify Other Activity Type (Apart from list) *"
                              value={item.otherType || (item.type !== 'Other' ? item.type : '')}
                              onChange={(v) => {
                                handleUpdateField('studentEngagement', idx, 'otherType', v);
                              }}
                            />
                          </div>
                        )}

                        {/* Date of Activity using unified DateFieldInput */}
                        <div className="md:col-span-3">
                          <DateFieldInput
                            label="Date of Activity"
                            value={item.dates || (item.startDate && item.endDate ? `${item.startDate} to ${item.endDate}` : item.startDate || '')}
                            onChange={(val) => {
                              handleUpdateField('studentEngagement', idx, 'dates', val);
                              if (val.includes(' to ')) {
                                const [s, e] = val.split(' to ');
                                handleUpdateField('studentEngagement', idx, 'startDate', s.trim());
                                handleUpdateField('studentEngagement', idx, 'endDate', e.trim());
                              } else {
                                handleUpdateField('studentEngagement', idx, 'startDate', val);
                                handleUpdateField('studentEngagement', idx, 'endDate', '');
                              }
                            }}
                            placeholder="DD/MM/YYYY or DD/MM/YYYY to DD/MM/YYYY"
                          />
                        </div>

                        {/* No of Participants */}
                        <div>
                          <FieldInput
                            label="No of Participants"
                            value={item.participantsCount}
                            onChange={(v) => handleUpdateField('studentEngagement', idx, 'participantsCount', v)}
                          />
                        </div>

                        {/* Coordinator */}
                        <div>
                          <FieldInput
                            label="Co-Ordinator"
                            value={item.coordinator}
                            onChange={(v) => handleUpdateField('studentEngagement', idx, 'coordinator', v)}
                          />
                        </div>

                        {/* Remarks */}
                        <div>
                          <FieldInput
                            label="Co-Ordinator Remarks"
                            value={item.remarks}
                            onChange={(v) => handleUpdateField('studentEngagement', idx, 'remarks', v)}
                          />
                        </div>

                        {/* Proof / Link */}
                        <div className="md:col-span-3">
                          <FieldInput
                            label="Proof / Certificate Link (Optional)"
                            value={item.link || ''}
                            onChange={(v) => handleUpdateField('studentEngagement', idx, 'link', v)}
                          />
                        </div>
                      </div>
                    </EntryCard>
                  );
                })}
              </SectionContainer>
            )}

          </div>

          {/* Off-screen PDF container positioned at (0,0) with opacity 0 so html2canvas computes pixel-perfect coordinates */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: -999,
              opacity: 0,
              pointerEvents: 'none',
              backgroundColor: '#ffffff',
              width: '750px'
            }}
          >
            <HODProfessionalPDFView
              department={department}
              hodName={hodName}
              period={period}
              submissionDate={submissionDate}
              sections={sections}
            />
          </div>
        </>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg sticky bottom-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {department} • Monthly Report
            </div>
            <div className="text-[11px] text-slate-500">
              {totalActivities} recorded activities • Official 16 tables format
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            {viewMode === 'form' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Crafted PDF Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Form Editor</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGenerateAndDownload}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Official Word format matching template for monthly consolidation"
          >
            <Download className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>{submitting ? 'Generating...' : 'Download Word (.docx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Download beautifully crafted executive PDF"
          >
            <FileDown className={`w-4 h-4 ${generatingPdf ? 'animate-spin' : ''}`} />
            <span>{generatingPdf ? 'Crafting PDF...' : 'Download PDF (.pdf)'}</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Action Dock */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 bg-slate-950/90 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all duration-300 hover:border-slate-500">
        <div className="hidden md:flex flex-col text-right pr-2.5 border-r border-slate-700/80">
          <span className="text-[11px] font-extrabold text-white truncate max-w-[170px]">{department}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{totalActivities} activities • {period}</span>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Save to Neon database"
        >
          <Database className={`w-3.5 h-3.5 ${savingDraft ? 'animate-spin' : ''}`} />
          <span>{savingDraft ? 'Saving...' : 'Save DB'}</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={generatingPdf}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Download Executive PDF"
        >
          <FileDown className={`w-3.5 h-3.5 ${generatingPdf ? 'animate-spin' : ''}`} />
          <span>PDF</span>
        </button>
        <button
          type="button"
          onClick={handleGenerateAndDownload}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold transition-all shadow-md shadow-orange-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Download Word Document"
        >
          <Download className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
          <span>DOCX</span>
        </button>
      </div>

    </div>
  );
};

interface SectionContainerProps {
  id?: string;
  title: string;
  count: number;
  description?: string;
  badgeLabel?: string;
  onAdd: () => void;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  title,
  count,
  description,
  badgeLabel,
  onAdd,
  children
}) => (
  <div id={id} className="space-y-4 pt-2">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {badgeLabel && (
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 tracking-wide">
              {badgeLabel}
            </span>
          )}
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${count > 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
            : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
            {count > 0 ? `${count} Recorded` : '0 (NIL Row)'}
          </span>
        </div>
        {description && (
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-sm shadow-orange-500/20"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Entry</span>
      </button>
    </div>

    {count === 0 ? (
      <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-dashed border-slate-300/90 text-center space-y-2.5">
        <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 mx-auto flex items-center justify-center font-bold text-xs">
          0
        </div>
        <p className="text-xs font-bold text-slate-700">No entries recorded for this section</p>
        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
          This section will automatically output a standardized NIL row in the official generated report.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-extrabold transition-all cursor-pointer shadow-2xs mt-2 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-orange-600" />
          <span>+ Add First Entry</span>
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {children}
      </div>
    )}
  </div>
);

interface EntryCardProps {
  index: number;
  onDelete: () => void;
  children: React.ReactNode;
}

const EntryCard: React.FC<EntryCardProps> = ({ index, onDelete, children }) => (
  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4 hover:border-slate-300 hover:bg-slate-50/90 transition-all relative group shadow-2xs">
    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
      <span className="text-xs font-black text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
          {index + 1}
        </span>
        Entry #{index + 1}
      </span>

      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-200/60 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3 h-3" />
        <span>Delete</span>
      </button>
    </div>

    {children}
  </div>
);

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange, placeholder, type = 'text', required = false }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-slate-700 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all placeholder:text-slate-400"
    />
  </div>
);

interface DateFieldInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

const DateFieldInput: React.FC<DateFieldInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  required = false
}) => {
  const getIso = (val: string): string => {
    if (!val) return '';
    const ddmmyyyy = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return '';
  };

  const parseRange = (val: string): { isMulti: boolean; start: string; end: string } => {
    if (!val) return { isMulti: false, start: '', end: '' };
    if (val.includes(' to ')) {
      const [s, e] = val.split(' to ');
      return { isMulti: true, start: formatDateToDDMMYYYY(s.trim()), end: formatDateToDDMMYYYY(e.trim()) };
    }
    if (val.includes(' - ')) {
      const parts = val.split(' - ');
      if (parts.length === 2) {
        const s = formatDateToDDMMYYYY(parts[0].trim());
        const e = formatDateToDDMMYYYY(parts[1].trim());
        if (s && e) {
          return { isMulti: true, start: s, end: e };
        }
      }
    }
    return { isMulti: false, start: formatDateToDDMMYYYY(val.trim()), end: '' };
  };

  const parsed = parseRange(value);
  const [explicitMode, setExplicitMode] = useState<'single' | 'multi' | null>(null);

  const isMulti = explicitMode !== null ? explicitMode === 'multi' : parsed.isMulti;

  const calculateDaysSpan = (startStr: string, endStr: string): number | null => {
    const startIso = getIso(startStr);
    const endIso = getIso(endStr);
    if (!startIso || !endIso) return null;
    const d1 = new Date(startIso);
    const d2 = new Date(endIso);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  };

  const daysCount = isMulti && parsed.start && parsed.end ? calculateDaysSpan(parsed.start, parsed.end) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {/* 1 Day vs More than 1 Day Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
          <button
            type="button"
            onClick={() => {
              setExplicitMode('single');
              if (parsed.start) {
                onChange(parsed.start);
              }
            }}
            className={`px-2 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${!isMulti ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            1 Day
          </button>
          <button
            type="button"
            onClick={() => {
              setExplicitMode('multi');
              if (parsed.start && parsed.end) {
                onChange(`${parsed.start} to ${parsed.end}`);
              }
            }}
            className={`px-2 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${isMulti ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            More than 1 Day
          </button>
        </div>
      </div>

      {!isMulti ? (
        <div className="relative flex items-center">
          <input
            type="text"
            value={parsed.start || value}
            placeholder={placeholder}
            onChange={(e) => onChange(handleDateInputAutoFormat(e.target.value))}
            className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all placeholder:text-slate-400 font-mono tracking-wide"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const d = String(now.getDate()).padStart(2, '0');
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = now.getFullYear();
                onChange(`${d}/${m}/${y}`);
              }}
              className="text-[10px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
              title="Set Today's Date in DD/MM/YYYY"
            >
              Today
            </button>
            <input
              type="date"
              value={getIso(parsed.start || value)}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(formatDateToDDMMYYYY(e.target.value));
                }
              }}
              className="w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0 text-slate-600"
              title="Open calendar to pick date"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-600 block mb-0.5">Starting Day *</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={parsed.start}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => {
                    const s = handleDateInputAutoFormat(e.target.value);
                    const full = parsed.end ? `${s} to ${parsed.end}` : s;
                    onChange(full);
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <input
                    type="date"
                    value={getIso(parsed.start)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const s = formatDateToDDMMYYYY(e.target.value);
                        const full = parsed.end ? `${s} to ${parsed.end}` : s;
                        onChange(full);
                      }
                    }}
                    className="w-4 h-4 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0"
                    title="Pick Starting Day from Calendar"
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 block mb-0.5">Ending Day *</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={parsed.end}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => {
                    const endVal = handleDateInputAutoFormat(e.target.value);
                    const full = parsed.start ? `${parsed.start} to ${endVal}` : endVal;
                    onChange(full);
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <input
                    type="date"
                    value={getIso(parsed.end)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const endVal = formatDateToDDMMYYYY(e.target.value);
                        const full = parsed.start ? `${parsed.start} to ${endVal}` : endVal;
                        onChange(full);
                      }
                    }}
                    className="w-4 h-4 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0"
                    title="Pick Ending Day from Calendar"
                  />
                </div>
              </div>
            </div>
          </div>

          {parsed.start && parsed.end && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-medium">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                Span: <strong>{daysCount ? `${daysCount} Days` : 'Multi-day Range'}</strong> ({parsed.start} to {parsed.end})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface FieldSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

const FieldSelect: React.FC<FieldSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  required = false
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-slate-700 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);


interface BulletTextareaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

const BulletTextarea: React.FC<BulletTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder = '• Enter key decisions...',
  rows = 4
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentVal = value || '';
      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);

      // Check if current line is already an empty bullet "• " or "•"
      const lines = before.split('\n');
      const currentLine = lines[lines.length - 1];
      if (currentLine.trim() === '•') {
        // Exit bullet mode on double enter
        const newBefore = lines.slice(0, -1).join('\n') + (lines.length > 1 ? '\n' : '');
        const updated = newBefore + after;
        onChange(updated);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = newBefore.length;
        }, 0);
        return;
      }

      const insertion = '\n• ';
      const updated = before + insertion + after;
      onChange(updated);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + insertion.length;
      }, 0);
    }
  };

  const handleFocus = () => {
    if (!value || value.trim() === '') {
      onChange('• ');
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 block">{label}</label>
        <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          Press Enter for auto-bullet (•)
        </span>
      </div>
      <textarea
        rows={rows}
        value={value}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all placeholder:text-slate-400 font-sans"
      />
    </div>
  );
};

export default HODManualReportBuilder;
