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
import { getDepartmentSampleData } from './departmentSampleData';

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
  deptMeetings: Array<{
    date: string;
    decisions: string;
    policyChanges: string;
    link: string;
  }>;
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
    deptMeetings: Array.isArray(raw.deptMeetings) ? raw.deptMeetings : [],
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
  const [period, setPeriod] = useState(currentPeriod || 'April 2026');
  const [submissionDate, setSubmissionDate] = useState('25/04/2026');

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
    { key: '1d_entrepreneurship', label: '2b. Activities and Iniativies', count: (safeSections.entrepreneurship || []).length },
    { key: '3a_fdp_attended', label: '3a. FDPs Attended', count: (safeSections.fdpAttended || []).length },
    { key: '3b_fdp_organized', label: '3b. FDPs Organized', count: (safeSections.fdpOrganized || []).length },
    { key: '4_sdp', label: '4. Student Development Programs (SDPs)', count: (safeSections.sdp || []).length },
    { key: '5a_faculty_achievements', label: '5a. Faculty Achievements', count: (safeSections.facultyAchievements || []).length },
    { key: '5b_student_achievements', label: '5b. Student Achievements', count: (safeSections.studentAchievements || []).length },
    { key: '5c_certifications', label: '5c. Certifications', count: (safeSections.certifications || []).length },
    { key: '6a_dept_meetings', label: '6a. Meetings', count: (safeSections.deptMeetings || []).length },
    { key: '6b_mous', label: '6b. Collaborations & MoUs', count: (safeSections.mous || []).length },
    { key: '8_tech_association', label: '7. Technical Association Activities', count: (safeSections.techAssociation || []).length },
    { key: '10_syllabus', label: '8. Syllabus coverage Report', count: (safeSections.syllabus || []).length },
    { key: 'student_engagement', label: '9. Clubs & Student Engagement Activity', count: (safeSections.studentEngagement || []).length },
    { key: '2_nss', label: '10. NSS and Other Extension Activities', count: (safeSections.nss || []).length },
    { key: '7_additional', label: '11. Additional/Other Relevant Initiatives', count: (safeSections.additionalInitiatives || []).length },
  ];

  // Specific department filtering as requested:
  // - Innovation And Entrepreneurship: only 1c and 1d
  // - Student Engagement and Clubs: only Student Engagement Activity
  // - NSS & Community Engagement: only NSS & Extension Activities
  // - Minutes of the Meeting: only 6a Department Meetings
  const SECTION_TABS = React.useMemo(() => {
    if (department === 'Innovation And Entrepreneurship') {
      return ALL_SECTION_TABS.filter(t => t.key === '1c_patents' || t.key === '1d_entrepreneurship');
    }
    if (department === 'Student Engagement and Clubs') {
      return ALL_SECTION_TABS.filter(t => t.key === 'student_engagement');
    }
    if (department === 'NSS & Community Engagement') {
      return ALL_SECTION_TABS.filter(t => t.key === '2_nss');
    }
    if (department === 'Minutes of the Meeting') {
      return ALL_SECTION_TABS.filter(t => t.key === '6a_dept_meetings');
    }
    return ALL_SECTION_TABS;
  }, [department, safeSections]);

  // Keep activeSectionKey focused on an allowed tab when department changes
  useEffect(() => {
    const isCurrentValid = SECTION_TABS.some(t => t.key === activeSectionKey);
    if (!isCurrentValid && SECTION_TABS.length > 0) {
      setActiveSectionKey(SECTION_TABS[0].key);
    }
  }, [SECTION_TABS, activeSectionKey]);

  const totalActivities = Object.values(safeSections).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);

  // Load comprehensive multi-item sample data for the selected department
  const handleLoadSampleData = () => {
    const data = getDepartmentSampleData(department);
    setSections(normalizeSections(data));
    toast.success(`Loaded sample data for ${department}!`);
  };

  const handleClearForm = () => {
    if (window.confirm('Clear all fields?')) {
      setSections({ ...INITIAL_SECTIONS });
      toast.info('All fields cleared.');
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
          copy.deptMeetings = [...(copy.deptMeetings || []), { date: '', decisions: '', policyChanges: '', link: '' }];
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
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
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
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all cursor-pointer"
              title={`Load complete 16-section sample data tailored for ${department}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Fill {department.includes('Civil') ? 'Civil' : department.includes('Computer') ? 'CSE' : department.includes('Communication') ? 'ECE' : department.includes('Electrical') ? 'EEE' : department.includes('Mechanical') ? 'Mech' : department.includes('Humanities') ? 'H&S' : department.includes('Innovation') ? 'I&E' : department.includes('Student Engagement') ? 'Clubs' : department.includes('NSS') ? 'NSS' : department.includes('Minutes') ? 'MoM' : 'Sample'} Sample</span>
            </button>

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
                <option value="Innovation And Entrepreneurship">Innovation And Entrepreneurship</option>
                <option value="Student Engagement and Clubs">Student Engagement and Clubs</option>
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
              <optgroup label="Academic Year 2025–26">
                <option value="June 2025">June 2025</option>
                <option value="July 2025">July 2025</option>
                <option value="August 2025">August 2025</option>
                <option value="September 2025">September 2025</option>
                <option value="October 2025">October 2025</option>
                <option value="November 2025">November 2025</option>
                <option value="December 2025">December 2025</option>
                <option value="January 2026">January 2026</option>
                <option value="February 2026">February 2026</option>
                <option value="March 2026">March 2026</option>
                <option value="April 2026">April 2026</option>
                <option value="May 2026">May 2026</option>
              </optgroup>
              <optgroup label="Academic Year 2026–27">
                <option value="June 2026">June 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="August 2026">August 2026</option>
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
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Date of Submission:
            </label>
            <input
              type="text"
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
              placeholder="e.g. 25/04/2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600"
            />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('conferences', idx, 'date', v)} />
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
                        <FieldInput label="Patent Status (Filed/Published/Granted/Commercialized)" value={item.status} onChange={(v) => handleUpdateField('patents', idx, 'status', v)} />
                      </div>
                      <div>
                        <FieldInput label="Awarded Date" value={item.awardedDate} onChange={(v) => handleUpdateField('patents', idx, 'awardedDate', v)} />
                      </div>
                      <div>
                        <FieldInput label="Link to Document/Proof" value={item.link} onChange={(v) => handleUpdateField('patents', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 3: 2b. Activities and Iniativies */}
            {activeSectionKey === '1d_entrepreneurship' && (
              <SectionContainer
                title="2. Innovation & Entrepreneurship — b) Activities and Iniativies"
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'date', v)} />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('nss', idx, 'date', v)} />
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
                        <FieldInput label="Dates" value={item.dates} onChange={(v) => handleUpdateField('fdpAttended', idx, 'dates', v)} />
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
                        <FieldInput label="Dates" value={item.dates} onChange={(v) => handleUpdateField('fdpOrganized', idx, 'dates', v)} />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('sdp', idx, 'date', v)} />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('facultyAchievements', idx, 'date', v)} />
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
                        <FieldInput label="Duration and date" value={item.durationDate} onChange={(v) => handleUpdateField('studentAchievements', idx, 'durationDate', v)} />
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

            {/* Table 10: 2b. Meetings */}
            {activeSectionKey === '6a_dept_meetings' && (
              <SectionContainer
                title="6a. Meetings"
                description="Details of official meetings: key decisions, date, and supporting documents."
                count={safeSections.deptMeetings.length}
                onAdd={() => handleAddRow('deptMeetings')}
              >
                {safeSections.deptMeetings.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('deptMeetings', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('deptMeetings', idx, 'date', v)} />
                      </div>
                      <div>
                        <FieldInput label="Policy Changes (if any)" value={item.policyChanges} onChange={(v) => handleUpdateField('deptMeetings', idx, 'policyChanges', v)} />
                      </div>
                      <div className="md:col-span-2">
                        <BulletTextarea
                          label="Main Decisions/Topics Discussed"
                          value={item.decisions}
                          onChange={(v) => handleUpdateField('deptMeetings', idx, 'decisions', v)}
                          placeholder="• Discussed curriculum progress&#10;• Finalized schedule for project reviews"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FieldInput label="Minutes/Proof Link" value={item.link} onChange={(v) => handleUpdateField('deptMeetings', idx, 'link', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
              </SectionContainer>
            )}

            {/* Table 11: 6b. Collaborations & MoUs */}
            {activeSectionKey === '6b_mous' && (
              <SectionContainer
                title="b) Collaborations & MoUs"
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
                        <FieldInput label="Date of Signing/Active Period" value={item.datePeriod} onChange={(v) => handleUpdateField('mous', idx, 'datePeriod', v)} />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('additionalInitiatives', idx, 'date', v)} />
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
                        <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('techAssociation', idx, 'date', v)} />
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
                {safeSections.syllabus.map((item, idx) => (
                  <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('syllabus', idx)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="md:col-span-2">
                        <FieldInput label="Subject" value={item.subject} onChange={(v) => handleUpdateField('syllabus', idx, 'subject', v)} />
                      </div>
                      <div>
                        <FieldInput label="Year/sem" value={item.yearSem} onChange={(v) => handleUpdateField('syllabus', idx, 'yearSem', v)} />
                      </div>
                      <div>
                        <FieldInput label="Faculty" value={item.faculty} onChange={(v) => handleUpdateField('syllabus', idx, 'faculty', v)} />
                      </div>
                      <div>
                        <FieldInput
                          label="Syllabus Status - Completed (Total 5 Units)"
                          value={item.completed}
                          placeholder="e.g. 5 Units (100%), 4.5 Units (90%), 4 Units (80%)"
                          onChange={(v) => handleUpdateField('syllabus', idx, 'completed', v)}
                        />
                      </div>
                      <div>
                        <FieldInput
                          label="Syllabus Status - Pending (Total 5 Units)"
                          value={item.pending}
                          placeholder="e.g. Nil, 0.5 Units (10%), 1 Unit (20%)"
                          onChange={(v) => handleUpdateField('syllabus', idx, 'pending', v)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <FieldInput label="Remarks" value={item.remarks} onChange={(v) => handleUpdateField('syllabus', idx, 'remarks', v)} />
                      </div>
                    </div>
                  </EntryCard>
                ))}
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
                  const expectedDays = parseDaysFromOption(item.noOfDays);
                  const isMultiDay = item.noOfDays !== '1 day';
                  const actualDays = (item.startDate && item.endDate) ? calculateDiffDays(item.startDate, item.endDate) : null;
                  const isInvalidDuration = Boolean(isMultiDay && actualDays !== null && actualDays !== expectedDays);

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

                        {/* No of Days */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            No of Days *
                          </label>
                          <select
                            value={item.noOfDays || '1 day'}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateField('studentEngagement', idx, 'noOfDays', val);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer"
                          >
                            <option value="1 day">1 day</option>
                            <option value="2 days">2 days</option>
                            <option value="3 days">3 days</option>
                            <option value="4 days">4 days</option>
                            <option value="5 days">5 days</option>
                            <option value="1 week">1 week (7 days)</option>
                            <option value="2 weeks">2 weeks (14 days)</option>
                          </select>
                        </div>

                        {/* Date Inputs based on No of Days */}
                        {!isMultiDay ? (
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Date of Activity *
                            </label>
                            <input
                              type="date"
                              value={item.startDate || item.dates || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateField('studentEngagement', idx, 'startDate', val);
                                handleUpdateField('studentEngagement', idx, 'endDate', '');
                                handleUpdateField('studentEngagement', idx, 'dates', val);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all"
                            />
                          </div>
                        ) : (
                          <div className="md:col-span-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Start Date *
                              </label>
                              <input
                                type="date"
                                value={item.startDate || ''}
                                onChange={(e) => {
                                  const s = e.target.value;
                                  handleUpdateField('studentEngagement', idx, 'startDate', s);
                                  const fullSpan = s && item.endDate ? `${s} to ${item.endDate}` : s;
                                  handleUpdateField('studentEngagement', idx, 'dates', fullSpan);
                                }}
                                className={`w-full px-3 py-2 rounded-xl bg-white border ${isInvalidDuration ? 'border-red-400 bg-red-50/30' : 'border-slate-200'} text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 transition-all`}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                End Date *
                              </label>
                              <input
                                type="date"
                                value={item.endDate || ''}
                                onChange={(e) => {
                                  const endD = e.target.value;
                                  handleUpdateField('studentEngagement', idx, 'endDate', endD);
                                  const fullSpan = item.startDate && endD ? `${item.startDate} to ${endD}` : endD;
                                  handleUpdateField('studentEngagement', idx, 'dates', fullSpan);
                                }}
                                className={`w-full px-3 py-2 rounded-xl bg-white border ${isInvalidDuration ? 'border-red-400 bg-red-50/30' : 'border-slate-200'} text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 transition-all`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Date Duration Invalidation Warning */}
                        {isInvalidDuration && (
                          <div className="md:col-span-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">Invalid Duration Detected</div>
                              <div>
                                Selected duration span covers <strong>{actualDays} day{actualDays === 1 ? '' : 's'}</strong> ({item.startDate} to {item.endDate}), but "No of Days" is specified as <strong>{item.noOfDays} ({expectedDays} days)</strong>. Please correct the dates or change the number of days to match.
                              </div>
                            </div>
                          </div>
                        )}

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
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            count > 0 
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
