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
  Save
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
  fdp: Array<{
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
}

export const INITIAL_SECTIONS: ReportSectionsData = {
  journals: [],
  conferences: [],
  patents: [],
  entrepreneurship: [],
  nss: [],
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
  syllabus: []
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
  const [period, setPeriod] = useState(currentPeriod || '01/04/2026 to 25/04/2026');
  const [submissionDate, setSubmissionDate] = useState('25/04/2026');

  const [sections, setSections] = useState<ReportSectionsData>(() => normalizeSections(INITIAL_SECTIONS));

  useEffect(() => {
    if (currentPeriod) {
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
  const [dbStatus, setDbStatus] = useState<{
    saved: boolean;
    lastSavedAt?: string;
    status?: string;
  }>({ saved: false });

  // Fetch saved report from dedicated reports database
  const loadSavedReportFromDb = async (dept = department, per = period) => {
    try {
      setLoadingDraft(true);
      const res = await api.get(`/reports/department-report-data?department=${encodeURIComponent(dept)}&period=${encodeURIComponent(per)}`);
      if (res.data?.success && res.data.exists && res.data.data) {
        const d = res.data.data;
        if (d.sections && typeof d.sections === 'object') {
          setSections(normalizeSections(d.sections));
        }
        if (d.hodName) setHodName(d.hodName);
        if (d.submissionDate) setSubmissionDate(d.submissionDate);
        setDbStatus({
          saved: true,
          lastSavedAt: d.updatedAt,
          status: d.status
        });
        toast.success(`Loaded saved report from dedicated database for ${dept} (${per})`, { id: 'db-load' });
      } else {
        setDbStatus({ saved: false });
      }
    } catch (e) {
      console.warn('Could not fetch saved draft from report db:', e);
    } finally {
      setLoadingDraft(false);
    }
  };

  useEffect(() => {
    if (department && period) {
      loadSavedReportFromDb(department, period);
    }
  }, [department, period]);

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
    if (dept.includes('Civil')) setHodName('K Siva Prasad');
    else if (dept.includes('Computer')) setHodName('Dr. Kethineni Vinod Kumar');
    else if (dept.includes('Communication')) setHodName('Dr. V. Annapurna');
    else if (dept.includes('Electrical')) setHodName('Mr. K. Gangadhar');
    else if (dept.includes('Humanities')) setHodName('Dr. Samba Sivaiah B');

    // If sample data or entries already exist, automatically switch to the new department's sample data
    const hasData = Object.values(sections).some(arr => Array.isArray(arr) && arr.length > 0);
    if (hasData) {
      const newDeptData = getDepartmentSampleData(dept);
      setSections(normalizeSections(newDeptData));
      toast.info(`Switched to sample data for ${dept}`);
    }
  };

  // Exact 16 tables matching the template format:
  const safeSections = normalizeSections(sections);

  const SECTION_TABS = [
    { key: '1a_journals', label: '1a. Journal Publications', count: (safeSections.journals || []).length },
    { key: '1b_conferences', label: '1b. Conference Presentations', count: (safeSections.conferences || []).length },
    { key: '1c_patents', label: '1c. Patents', count: (safeSections.patents || []).length },
    { key: '1d_entrepreneurship', label: '1d. Entrepreneurship/Start-up Initiatives', count: (safeSections.entrepreneurship || []).length },
    { key: '2_nss', label: '2. NSS and Other Extension Activities', count: (safeSections.nss || []).length },
    { key: '3_fdp', label: '3. Faculty Development Programs (FDPs)', count: (safeSections.fdp || []).length },
    { key: '4_sdp', label: '4. Student Development Programs (SDPs)', count: (safeSections.sdp || []).length },
    { key: '5a_faculty_achievements', label: '5a. Faculty Achievements', count: (safeSections.facultyAchievements || []).length },
    { key: '5b_student_achievements', label: '5b. Student Achievements', count: (safeSections.studentAchievements || []).length },
    { key: '5c_certifications', label: '5c. Certifications', count: (safeSections.certifications || []).length },
    { key: '6a_dept_meetings', label: '6a. Department Meetings', count: (safeSections.deptMeetings || []).length },
    { key: '6b_mous', label: '6b. Collaborations & MoUs', count: (safeSections.mous || []).length },
    { key: '7_additional', label: '7. Additional/Other Relevant Initiatives', count: (safeSections.additionalInitiatives || []).length },
    { key: '8_tech_association', label: '8. Technical Association Activities', count: (safeSections.techAssociation || []).length },
    { key: '9_iic_cell', label: '9. IIC Cell (Institution’s Innovation Council)', count: (safeSections.iicCell || []).length },
    { key: '10_syllabus', label: '10. Syllabus coverage Report', count: (safeSections.syllabus || []).length },
  ];

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
          copy.conferences = [...(copy.conferences || []), { title: '', authors: '', conferenceName: '', date: '', locationMode: '', indexedIn: '', link: '' }];
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'form' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Form Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
              <span>Fill {department.includes('Civil') ? 'Civil' : department.includes('Computer') ? 'CSE' : department.includes('Communication') ? 'ECE' : department.includes('Electrical') ? 'EEE' : 'H&S'} Sample</span>
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
              <span>{submitting ? 'Word DOCX...' : 'Word DOCX'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Crafted professional executive PDF document"
            >
              <FileDown className={`w-3.5 h-3.5 ${generatingPdf ? 'animate-spin' : ''}`} />
              <span>{generatingPdf ? 'Crafting PDF...' : 'Download Crafted PDF'}</span>
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
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-700">Dedicated Reports DB:</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              Neon PostgreSQL Connected
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
              <span className="text-slate-400 italic">No saved database record for this month yet. Click &quot;Save to Database&quot; anytime.</span>
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
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
              <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
              <option value="Humanities & Sciences">Humanities & Sciences</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Reporting Period:
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 01/04/2026 to 25/04/2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> HOD Name:
            </label>
            <input
              type="text"
              value={hodName}
              onChange={(e) => setHodName(e.target.value)}
              placeholder="e.g. K Siva Prasad"
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
                <span>{generatingPdf ? 'Crafting PDF...' : 'Download Crafted PDF'}</span>
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive 
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
            title="1. Research, Innovation & Entrepreneurship — a) Journal Publications"
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
                    <FieldInput label="Indexed In (e.g., Scopus)" value={item.indexedIn} onChange={(v) => handleUpdateField('journals', idx, 'indexedIn', v)} />
                  </div>
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
            title="b) Conference Presentations"
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
                    <FieldInput label="Indexed In" value={item.indexedIn} onChange={(v) => handleUpdateField('conferences', idx, 'indexedIn', v)} />
                  </div>
                  <div>
                    <FieldInput label="Link to Presentation/Report" value={item.link} onChange={(v) => handleUpdateField('conferences', idx, 'link', v)} />
                  </div>
                </div>
              </EntryCard>
            ))}
          </SectionContainer>
        )}

        {/* Table 2: 1c. Patents */}
        {activeSectionKey === '1c_patents' && (
          <SectionContainer
            title="c) Patents"
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

        {/* Table 3: 1d. Entrepreneurship/Start-up Initiatives */}
        {activeSectionKey === '1d_entrepreneurship' && (
          <SectionContainer
            title="d) Entrepreneurship/Start-up Initiatives"
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
                  <div className="md:col-span-2">
                    <FieldInput label="Key Outcomes (Startups Launched, Funding Received, Patents Filed, etc.)" value={item.keyOutcomes} onChange={(v) => handleUpdateField('entrepreneurship', idx, 'keyOutcomes', v)} />
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
            title="2. NSS and Other Extension Activities"
            description="Capture all social outreach and community service work undertaken by the department, including NSS camps, awareness drives, and extension events."
            count={safeSections.nss.length}
            onAdd={() => handleAddRow('nss')}
          >
            {safeSections.nss.map((item, idx) => (
              <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('nss', idx)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <FieldInput label="Event/Activity" value={item.event} onChange={(v) => handleUpdateField('nss', idx, 'event', v)} />
                  </div>
                  <div>
                    <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('nss', idx, 'date', v)} />
                  </div>
                  <div>
                    <FieldInput label="Venue" value={item.venue} onChange={(v) => handleUpdateField('nss', idx, 'venue', v)} />
                  </div>
                  <div>
                    <FieldInput label="Type (NSS/Community)" value={item.type} onChange={(v) => handleUpdateField('nss', idx, 'type', v)} />
                  </div>
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

        {/* Table 5: 3. Faculty Development Programs (FDPs) */}
        {activeSectionKey === '3_fdp' && (
          <SectionContainer
            title="3. Faculty Development Programs (FDPs)"
            description="List every short-term training, development course, workshop, or seminar attended or organized by faculty for professional development. Attach certificates where possible."
            count={safeSections.fdp.length}
            onAdd={() => handleAddRow('fdp')}
          >
            {safeSections.fdp.map((item, idx) => (
              <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('fdp', idx)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <FieldInput label="Program Title" value={item.title} onChange={(v) => handleUpdateField('fdp', idx, 'title', v)} />
                  </div>
                  <div>
                    <FieldInput label="Type (FDP/Workshop/Seminar/Conference)" value={item.type} onChange={(v) => handleUpdateField('fdp', idx, 'type', v)} />
                  </div>
                  <div>
                    <FieldInput label="Dates" value={item.dates} onChange={(v) => handleUpdateField('fdp', idx, 'dates', v)} />
                  </div>
                  <div>
                    <FieldInput label="Organizing Body" value={item.organizingBody} onChange={(v) => handleUpdateField('fdp', idx, 'organizingBody', v)} />
                  </div>
                  <div>
                    <FieldInput label="Mode (Online/Offline/Hybrid)" value={item.mode} onChange={(v) => handleUpdateField('fdp', idx, 'mode', v)} />
                  </div>
                  <div>
                    <FieldInput label="Role (Attendee/Organizer/Resource Person)" value={item.role} onChange={(v) => handleUpdateField('fdp', idx, 'role', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Key Outcomes" value={item.keyOutcomes} onChange={(v) => handleUpdateField('fdp', idx, 'keyOutcomes', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Proof/Certificate Link" value={item.link} onChange={(v) => handleUpdateField('fdp', idx, 'link', v)} />
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
                    <FieldInput label="Type (Guest Lecture/Workshop/Seminar/Industrial Visit/Internship/Symposium/Community Project)" value={item.type} onChange={(v) => handleUpdateField('sdp', idx, 'type', v)} />
                  </div>
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

        {/* Table 10: 6a. Department Meetings */}
        {activeSectionKey === '6a_dept_meetings' && (
          <SectionContainer
            title="6. Other Notable Activities — a) Department Meetings"
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
                    <FieldInput label="Main Decisions/Topics Discussed" value={item.decisions} onChange={(v) => handleUpdateField('deptMeetings', idx, 'decisions', v)} />
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
            title="7. Additional/Other Relevant Initiatives"
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
            title="8. Technical Association Activities"
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
                    <FieldInput label="Type (Workshop/Seminar/Contest)" value={item.type} onChange={(v) => handleUpdateField('techAssociation', idx, 'type', v)} />
                  </div>
                  <div>
                    <FieldInput label="Resource Person / Coordinator" value={item.resourcePersonCoordinator} onChange={(v) => handleUpdateField('techAssociation', idx, 'resourcePersonCoordinator', v)} />
                  </div>
                  <div>
                    <FieldInput label="Participants" value={item.participants} onChange={(v) => handleUpdateField('techAssociation', idx, 'participants', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Outcomes / Achievements" value={item.outcomes} onChange={(v) => handleUpdateField('techAssociation', idx, 'outcomes', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Evidence / Proof Link" value={item.link} onChange={(v) => handleUpdateField('techAssociation', idx, 'link', v)} />
                  </div>
                </div>
              </EntryCard>
            ))}
          </SectionContainer>
        )}

        {/* Table 14: 9. IIC Cell (Institution’s Innovation Council) */}
        {activeSectionKey === '9_iic_cell' && (
          <SectionContainer
            title="9. IIC Cell (Institution’s Innovation Council)"
            description="Focuses on fostering innovation and entrepreneurship among students and faculty through various events and mentoring."
            count={safeSections.iicCell.length}
            onAdd={() => handleAddRow('iicCell')}
          >
            {safeSections.iicCell.map((item, idx) => (
              <EntryCard key={idx} index={idx} onDelete={() => handleRemoveRow('iicCell', idx)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <FieldInput label="Activity/Initiative" value={item.activity} onChange={(v) => handleUpdateField('iicCell', idx, 'activity', v)} />
                  </div>
                  <div>
                    <FieldInput label="Date" value={item.date} onChange={(v) => handleUpdateField('iicCell', idx, 'date', v)} />
                  </div>
                  <div>
                    <FieldInput label="Resource Person/Partner" value={item.partner} onChange={(v) => handleUpdateField('iicCell', idx, 'partner', v)} />
                  </div>
                  <div>
                    <FieldInput label="Beneficiaries" value={item.beneficiaries} onChange={(v) => handleUpdateField('iicCell', idx, 'beneficiaries', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Description/Objective" value={item.description} onChange={(v) => handleUpdateField('iicCell', idx, 'description', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Key Outcomes/Impact" value={item.outcomes} onChange={(v) => handleUpdateField('iicCell', idx, 'outcomes', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldInput label="Evidence / Proof Link" value={item.link} onChange={(v) => handleUpdateField('iicCell', idx, 'link', v)} />
                  </div>
                </div>
              </EntryCard>
            ))}
          </SectionContainer>
        )}

        {/* Table 15: 10. Syllabus coverage Report */}
        {activeSectionKey === '10_syllabus' && (
          <SectionContainer
            title="10. Syllabus coverage Report (Summer Vacation holidays)"
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
                    <FieldInput label="Syllabus Status - Completed" value={item.completed} onChange={(v) => handleUpdateField('syllabus', idx, 'completed', v)} />
                  </div>
                  <div>
                    <FieldInput label="Syllabus Status - Pending" value={item.pending} onChange={(v) => handleUpdateField('syllabus', idx, 'pending', v)} />
                  </div>
                  <div className="md:col-span-3">
                    <FieldInput label="Remarks" value={item.remarks} onChange={(v) => handleUpdateField('syllabus', idx, 'remarks', v)} />
                  </div>
                </div>
              </EntryCard>
            ))}
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
        <span>{submitting ? 'Generating...' : 'Word DOCX'}</span>
      </button>

      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={generatingPdf}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Download beautifully crafted executive PDF"
      >
        <FileDown className={`w-4 h-4 ${generatingPdf ? 'animate-spin' : ''}`} />
        <span>{generatingPdf ? 'Crafting PDF...' : 'Download Crafted PDF'}</span>
      </button>
    </div>
  </div>

    </div>
  );
};

interface SectionContainerProps {
  title: string;
  description: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  description,
  count,
  onAdd,
  children
}) => (
  <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Row</span>
      </button>
    </div>

    {count === 0 ? (
      <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
        <p className="text-xs font-bold text-slate-700">No entries for this section</p>
        <p className="text-[11px] text-slate-400">
          Will be output as a standard NIL row in the generated report.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs mt-2"
        >
          <Plus className="w-3.5 h-3.5 text-orange-600" />
          <span>Add Row</span>
        </button>
      </div>
    ) : (
      <div className="space-y-3.5">
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
  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-4 hover:border-slate-300 transition-colors relative group">
    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
      <span className="text-xs font-black text-slate-700 flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] flex items-center justify-center">
          {index + 1}
        </span>
        Row #{index + 1}
      </span>

      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
}

const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-slate-600 block">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all placeholder:text-slate-400"
    />
  </div>
);

export default HODManualReportBuilder;
