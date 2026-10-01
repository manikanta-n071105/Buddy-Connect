import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Download,
  RefreshCw,
  UploadCloud,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  Sparkles,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  FileUp,
  FileText,
  UserCheck,
  Send,
  Trash2,
  FolderArchive,
  BarChart3,
  Check,
  AlertCircle,
  FileCode2,
  ChevronRight,
  FileDown,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { HODManualReportBuilder } from './HODManualReportBuilder';
import { ConsolidatedInstitutionalPDFView, exportPagesToPdf } from './ConsolidatedInstitutionalPDFView';

interface DepartmentStatus {
  code: string;
  name: string;
  type?: 'ACADEMIC' | 'COMMITTEE';
  isSubmitted: boolean;
  hasDraft?: boolean;
  id: string | null;
  hodName: string;
  submissionDate?: string | null;
  fileName: string | null;
  fileSizeBytes: number;
  fileSizeFormatted: string | null;
  itemsCount: number;
  uploadedAt: string | null;
  updatedAt?: string | null;
  status: string;
}

interface SubmissionsData {
  period: string;
  submittedCount: number;
  submittedDeptsCount?: number;
  submittedCommsCount?: number;
  totalDepartments: number;
  totalCommittees?: number;
  totalEntities?: number;
  isComplete: boolean;
  departments: DepartmentStatus[];
  committees?: DepartmentStatus[];
  allEntities?: DepartmentStatus[];
}

const DEPARTMENT_CONFIG: Record<string, { badge: string; accent: string }> = {
  CIVIL: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'bg-amber-500'
  },
  CSE: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'bg-blue-600'
  },
  ECE: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    accent: 'bg-purple-600'
  },
  EEE: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'bg-emerald-600'
  },
  MECH: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    accent: 'bg-cyan-600'
  },
  'H&S': {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'bg-rose-600'
  },
  'IIC/EDC': {
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    accent: 'bg-amber-600'
  },
  CLUBS: {
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    accent: 'bg-pink-500'
  },
  NSS: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    accent: 'bg-emerald-600'
  },
  MOM: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accent: 'bg-indigo-600'
  }
};

const EXECUTIVE_METRICS = [
  { category: '1a. Journal Publications', civil: 1, cse: 2, ece: 2, eee: 2, mech: 2, hs: 1, total: 10 },
  { category: '1b. Conference Presentations', civil: 2, cse: 3, ece: 3, eee: 2, mech: 2, hs: 2, total: 14 },
  { category: '2a. Patents', civil: 0, cse: 1, ece: 1, eee: 0, mech: 1, hs: 0, total: 3 },
  { category: '2b. Activities and Initiatives', civil: 0, cse: 1, ece: 1, eee: 0, mech: 0, hs: 0, total: 2 },
  { category: '3a. FDPs Attended', civil: 1, cse: 1, ece: 1, eee: 1, mech: 2, hs: 1, total: 7 },
  { category: '3b. FDPs Organized', civil: 1, cse: 1, ece: 1, eee: 1, mech: 1, hs: 1, total: 6 },
  { category: '4. Student Development Programs (SDPs)', civil: 0, cse: 1, ece: 0, eee: 0, mech: 1, hs: 1, total: 3 },
  { category: '5a. Faculty Achievements', civil: 1, cse: 1, ece: 0, eee: 1, mech: 1, hs: 0, total: 4 },
  { category: '5b. Student Achievements', civil: 0, cse: 1, ece: 1, eee: 0, mech: 1, hs: 1, total: 4 },
  { category: '5c. Certifications', civil: 4, cse: 7, ece: 5, eee: 5, mech: 4, hs: 4, total: 29 },
  { category: '6a. Meetings', civil: 1, cse: 0, ece: 1, eee: 1, mech: 1, hs: 0, total: 4 },
  { category: '6b. Collaborations & MoUs', civil: 1, cse: 0, ece: 1, eee: 1, mech: 1, hs: 0, total: 4 },
  { category: '7. Technical Association Activities', civil: 0, cse: 1, ece: 1, eee: 0, mech: 1, hs: 0, total: 3 },
  { category: '8. Syllabus coverage Report', civil: 1, cse: 0, ece: 0, eee: 0, mech: 1, hs: 1, total: 3 },
  { category: '9. Clubs & Student Engagement Activity', civil: 0, cse: 2, ece: 1, eee: 1, mech: 2, hs: 1, total: 7 },
  { category: '10. NSS and Other Extension Activities', civil: 0, cse: 0, ece: 0, eee: 0, mech: 1, hs: 2, total: 3 },
  { category: '11. Additional/Other Relevant Initiatives', civil: 0, cse: 1, ece: 0, eee: 1, mech: 1, hs: 0, total: 3 },
];

export const HODReportConsolidatorPage: React.FC = () => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'superadmin' | 'manual_entry' | 'hod_upload' | 'matrix' | 'zip_batch'>('manual_entry');

  // Data State
  const [period, setPeriod] = useState('April 2026');
  const [submissions, setSubmissions] = useState<SubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [consolidatingPdf, setConsolidatingPdf] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [allDeptCustomData, setAllDeptCustomData] = useState<Record<string, any>>({});

  // HOD Upload Form State
  const [selectedDept, setSelectedDept] = useState('Computer Science & Engineering');
  const [hodName, setHodName] = useState('Dr. Kethineni Vinod Kumar');
  const [hodFile, setHodFile] = useState<File | null>(null);
  const [uploadingHod, setUploadingHod] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hodFileInputRef = useRef<HTMLInputElement>(null);

  // Batch ZIP State
  const [uploadingZip, setUploadingZip] = useState(false);
  const zipFileInputRef = useRef<HTMLInputElement>(null);

  // Tracker filtering state
  const [trackerFilter, setTrackerFilter] = useState<'ALL' | 'ACADEMIC' | 'COMMITTEE'>('ALL');

  // Auto-Detect & Map Upload State
  const [autoMapping, setAutoMapping] = useState(false);
  const [isAutoMapDragOver, setIsAutoMapDragOver] = useState(false);
  const autoMapFileInputRef = useRef<HTMLInputElement>(null);

  // Direct upload for individual department or committee
  const [targetDeptForUpload, setTargetDeptForUpload] = useState<{ name: string; hod: string } | null>(null);
  const deptCardFileInputRef = useRef<HTMLInputElement>(null);

  const triggerUploadForDept = (deptName: string, hodName: string) => {
    setTargetDeptForUpload({ name: deptName, hod: hodName });
    if (deptCardFileInputRef.current) {
      deptCardFileInputRef.current.value = '';
      deptCardFileInputRef.current.click();
    }
  };

  const handleDeptCardFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetDeptForUpload) return;

    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a valid Word document (.docx) or PDF (.pdf).');
      return;
    }

    try {
      toast.loading(`Uploading ${targetDeptForUpload.name} report...`, { id: 'card-upload' });
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const res = await api.post('/reports/upload-department-report', {
            department: targetDeptForUpload.name,
            hodName: targetDeptForUpload.hod,
            period,
            fileBase64,
            fileName: file.name
          });

          if (res.data.success) {
            toast.success(`Successfully uploaded report for ${targetDeptForUpload.name}!`, { id: 'card-upload' });
            await fetchSubmissions(period);
          } else {
            toast.error(res.data.message || 'Upload failed', { id: 'card-upload' });
          }
        } catch (err: any) {
          toast.error('Upload error: ' + (err.response?.data?.message || err.message), { id: 'card-upload' });
        } finally {
          if (deptCardFileInputRef.current) deptCardFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: 'card-upload' });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(`Are you sure you want to clear all departmental submissions for ${period}?`)) {
      return;
    }
    try {
      toast.loading('Clearing all submissions...', { id: 'clear-all' });
      const res = await api.post(`/reports/clear-department-submissions?period=${encodeURIComponent(period)}`);
      if (res.data.success) {
        toast.success('All departmental submissions cleared.', { id: 'clear-all' });
        await fetchSubmissions(period);
      }
    } catch (err: any) {
      toast.error('Failed to clear: ' + err.message, { id: 'clear-all' });
    }
  };

  const fetchSubmissions = async (reportingPeriod = period) => {
    try {
      setLoading(true);
      const [res, customDataRes] = await Promise.all([
        api.get(`/reports/department-submissions?period=${encodeURIComponent(reportingPeriod)}`),
        api.get(`/reports/all-department-report-data?period=${encodeURIComponent(reportingPeriod)}`).catch(() => ({ data: { data: {} } }))
      ]);
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
      if (customDataRes.data?.data) {
        setAllDeptCustomData(customDataRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch departmental submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(period);
  }, [period]);

  const allSubmissionsList = submissions?.allEntities || [
    ...(submissions?.departments || []),
    ...(submissions?.committees || [])
  ];

  const displayedEntities = allSubmissionsList.filter(item => {
    if (trackerFilter === 'ALL') return true;
    return item.type === trackerFilter;
  });

  const handleDepartmentChange = (deptName: string) => {
    setSelectedDept(deptName);
    if (deptName === 'auto') {
      setHodName('Auto-Detect from Document');
      return;
    }
    const found = allSubmissionsList.find(d => d.name === deptName);
    if (found?.hodName) {
      setHodName(found.hodName);
    } else {
      if (deptName.includes('Civil')) setHodName('Prof. K. Siva Prasad');
      else if (deptName.includes('Computer')) setHodName('Dr. Kethineni Vinod Kumar');
      else if (deptName.includes('Communication')) setHodName('Dr. V. Annapurna');
      else if (deptName.includes('Electrical')) setHodName('Mr. K. Gangadhar');
      else if (deptName.includes('Mechanical')) setHodName('Prof. C. Anil Kumar Reddy');
      else if (deptName.includes('Humanities')) setHodName('Dr. Samba Sivaiah B');
      else if (deptName.includes('Innovation')) setHodName('Dean / Convener - IIC & EDC');
      else if (deptName.includes('Student Engagement')) setHodName('Faculty Advisor - Student Affairs');
      else if (deptName.includes('NSS')) setHodName('Dr. Samba Sivaiah B (NSS Officer)');

      else if (deptName.includes('Minutes')) setHodName('Member Secretary - Academic Committee');

    }
  };

  const handleAutoMapFileSelected = async (file: File) => {
    if (!file) return;
    const nameLow = file.name.toLowerCase();
    if (!nameLow.endsWith('.docx') && !nameLow.endsWith('.pdf')) {
      toast.error('Please select a valid Word document (.docx) or PDF (.pdf).');
      return;
    }

    try {
      setAutoMapping(true);
      toast.loading(`Auto-detecting and mapping ${file.name}...`, { id: 'auto-map' });

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const res = await api.post('/reports/upload-auto-map', {
            fileBase64,
            fileName: file.name,
            period
          });

          if (res.data.success) {
            const mapped = res.data.data;
            toast.success(
              `✨ Automatically mapped to ${mapped.department} (${mapped.code}) with ${mapped.itemsCount} activities!`,
              { id: 'auto-map', duration: 5000 }
            );
            await fetchSubmissions(period);
          } else {
            toast.error(res.data.message || 'Auto-mapping failed', { id: 'auto-map' });
          }
        } catch (err: any) {
          toast.error('Mapping error: ' + (err.response?.data?.message || err.message), { id: 'auto-map' });
        } finally {
          setAutoMapping(false);
          if (autoMapFileInputRef.current) autoMapFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: 'auto-map' });
      setAutoMapping(false);
    }
  };

  // 1. Super Admin: Generate & Download Consolidated Report
  const handleGenerateConsolidated = async () => {
    try {
      setConsolidating(true);
      toast.loading('Synthesizing consolidated institutional report from all submitted HOD documents...', { id: 'consolidate' });

      const res = await api.post('/reports/generate-from-submissions', { period });
      if (res.data.success) {
        toast.success(res.data.message || 'Consolidated Report successfully generated!', { id: 'consolidate' });

        const downloadUrl = `${api.defaults.baseURL || '/api'}/reports/download-consolidated`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `Consolidated_Institutional_HOD_Report_${period.replace(/\s+/g, '_')}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(res.data.message || 'Consolidation failed', { id: 'consolidate' });
      }
    } catch (err: any) {
      toast.error('Consolidation failed: ' + (err.response?.data?.message || err.message), { id: 'consolidate' });
    } finally {
      setConsolidating(false);
    }
  };

  const handleDirectDownload = () => {
    const downloadUrl = `${api.defaults.baseURL || '/api'}/reports/download-consolidated`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Consolidated_Institutional_HOD_Report_${period.replace(/\s+/g, '_')}.docx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Consolidated Institutional Report (.docx)');
  };

  // 2. Super Admin: Generate & Download Consolidated Institutional PDF
  const handleGenerateConsolidatedPDF = async () => {
    try {
      setConsolidatingPdf(true);
      toast.loading('Synthesizing official Consolidated Institutional PDF...', { id: 'consolidate-pdf' });

      const fileName = `Consolidated_Institutional_HOD_Report_${period.replace(/\s+/g, '_')}.pdf`;
      const pdfBlob = await exportPagesToPdf('consolidated-pdf-document', fileName);

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to server asynchronously
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          if (typeof reader.result === 'string') {
            await api.post('/reports/save-consolidated-pdf', {
              fileBase64: reader.result,
              fileName: `Consolidated_Institutional_HOD_Report_${period.replace(/\s+/g, '_')}.pdf`
            });
          }
        } catch (e) {
          // non-blocking
        }
      };
      reader.readAsDataURL(pdfBlob);

      toast.success('Master Consolidated Institutional PDF generated & downloaded!', { id: 'consolidate-pdf' });
    } catch (err: any) {
      toast.error('PDF consolidation failed: ' + (err.message || 'Unknown error'), { id: 'consolidate-pdf' });
    } finally {
      setConsolidatingPdf(false);
    }
  };

  const handleDirectDownloadPDF = () => {
    const downloadUrl = `${api.defaults.baseURL || '/api'}/reports/download-consolidated-pdf`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Consolidated_Institutional_HOD_Report_${period.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Consolidated Institutional Report (.pdf)');
  };

  // Choice Handler when user picks format from modal:
  const handleConsolidateChoice = async (format: 'docx' | 'pdf' | 'both') => {
    setShowConsolidateModal(false);
    if (format === 'docx') {
      await handleGenerateConsolidated();
    } else if (format === 'pdf') {
      await handleGenerateConsolidatedPDF();
    } else if (format === 'both') {
      toast.info('Synthesizing both Word (.docx) and PDF (.pdf) consolidated reports...');
      await handleGenerateConsolidated();
      await handleGenerateConsolidatedPDF();
    }
  };

  const handleDownloadDeptReport = (id: string, fileName: string) => {
    const downloadUrl = `${api.defaults.baseURL || '/api'}/reports/download-department/${id}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${fileName}`);
  };

  // 2. HOD Individual Department DOCX / PDF Upload
  const handleHodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodFile) {
      toast.error('Please select your department report (.docx or .pdf).');
      return;
    }
    const nameLow = hodFile.name.toLowerCase();
    if (!nameLow.endsWith('.docx') && !nameLow.endsWith('.pdf')) {
      toast.error('Please select a valid Word document (.docx) or PDF document (.pdf).');
      return;
    }

    try {
      setUploadingHod(true);
      toast.loading(`Submitting ${selectedDept === 'auto' ? 'report' : selectedDept}...`, { id: 'hod-upload' });

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const endpoint = selectedDept === 'auto' ? '/reports/upload-auto-map' : '/reports/upload-department-report';
          const payload = selectedDept === 'auto'
            ? { fileBase64, fileName: hodFile.name, period }
            : { department: selectedDept, hodName, period, fileBase64, fileName: hodFile.name };

          const res = await api.post(endpoint, payload);

          if (res.data.success) {
            const mappedName = res.data.data?.department || selectedDept;
            toast.success(`Report for ${mappedName} submitted & mapped successfully!`, { id: 'hod-upload' });
            setHodFile(null);
            if (hodFileInputRef.current) hodFileInputRef.current.value = '';
            await fetchSubmissions(period);
            setActiveTab('superadmin');
          } else {
            toast.error(res.data.message || 'Upload failed', { id: 'hod-upload' });
          }
        } catch (err: any) {
          toast.error('Upload error: ' + (err.response?.data?.message || err.message), { id: 'hod-upload' });
        } finally {
          setUploadingHod(false);
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file from disk', { id: 'hod-upload' });
        setUploadingHod(false);
      };
      reader.readAsDataURL(hodFile);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: 'hod-upload' });
      setUploadingHod(false);
    }
  };

  // 3. Batch ZIP Archive Upload
  const handleBatchZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please upload a .zip archive containing the departmental reports.');
      return;
    }

    try {
      setUploadingZip(true);
      toast.loading(`Synthesizing all reports from ${file.name}...`, { id: 'zip-upload' });

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const res = await api.post('/reports/upload-and-consolidate', {
            fileBase64,
            fileName: file.name
          });

          if (res.data.success) {
            toast.success('Successfully consolidated reports from uploaded archive!', { id: 'zip-upload' });
            await fetchSubmissions(period);
            handleDirectDownload();
          } else {
            toast.error(res.data.message || 'Consolidation failed', { id: 'zip-upload' });
          }
        } catch (err: any) {
          toast.error('Processing error: ' + (err.response?.data?.message || err.message), { id: 'zip-upload' });
        } finally {
          setUploadingZip(false);
          if (zipFileInputRef.current) zipFileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file from disk', { id: 'zip-upload' });
        setUploadingZip(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: 'zip-upload' });
      setUploadingZip(false);
    }
  };

  // Calculations
  const submittedCount = submissions?.submittedCount || 0;
  const totalCount = submissions?.totalDepartments || 5;
  const completionPercentage = Math.round((submittedCount / totalCount) * 100);
  const totalExtractedItems = submissions?.departments.reduce((acc, d) => acc + (d.itemsCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500/20 selection:text-orange-900 pb-16">

      {/* Hidden File Input for Direct Department Card Upload */}
      <input
        type="file"
        ref={deptCardFileInputRef}
        onChange={handleDeptCardFileSelected}
        accept=".docx"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Institutional Header Bar */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-slate-500 group-hover:text-slate-700" />
              <span>Back to Portal</span>
            </Link>

            <span className="hidden sm:inline-block w-px h-4 bg-slate-200" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Public Live Mode • No Login Required</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              to="/report-generator"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Event Report Generator</span>
            </Link>

            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-slate-500 font-medium">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
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
              </select>
            </div>
          </div>
        </header>

        {/* Executive Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 md:p-10 shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Sanskrithi School of Engineering • Office of Principal & HODs
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                Monthly Institutional Report Consolidation Hub
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Centralized system for departmental submissions. Each HOD submits their monthly Word report (.docx), and Super Admin synthesizes a single, complete master institutional document with executive matrix.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('manual_entry')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/30 hover:bg-orange-500/40 border border-orange-400/50 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-orange-300" />
                Manual HOD Entry Form
              </button>

              <button
                onClick={() => setActiveTab('hod_upload')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-slate-300" />
                HOD Upload Portal
              </button>

              <button
                onClick={handleGenerateConsolidated}
                disabled={consolidating || submittedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-orange-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${consolidating ? 'animate-spin' : ''}`} />
                {consolidating ? 'Synthesizing...' : 'Synthesize Master Report'}
              </button>
            </div>
          </div>
        </section>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Submissions Received
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
              <span>{submittedCount}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {totalCount} Depts</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-orange-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Consolidation Rate
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-1 flex items-center gap-2">
              {completionPercentage}%
              {completionPercentage === 100 && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {completionPercentage === 100 ? 'All 5 Departments ready' : `${totalCount - submittedCount} departments pending`}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Extracted Records
            </span>
            <div className="text-3xl font-black text-indigo-600 mt-1">
              {totalExtractedItems} <span className="text-xs text-slate-400 font-medium">items</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Auto-parsed across 16 categories</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Master Document
            </span>
            <div className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
              {submittedCount > 0 ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-600" /> Ready to Build
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 text-xs font-bold">
                  <Clock className="w-4 h-4 text-amber-600" /> Awaiting Files
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Executive Matrix included</p>
          </div>
        </div>

        {/* Clean Segmented Pill Navigation */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('manual_entry')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'manual_entry'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Manual Report Builder</span>
            <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>
          </button>

          <button
            onClick={() => setActiveTab('superadmin')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'superadmin'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Consolidation Center</span>
          </button>

          <button
            onClick={() => setActiveTab('hod_upload')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'hod_upload'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <FileUp className="w-4 h-4" />
            <span>HOD Upload Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'matrix'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Performance Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('zip_batch')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'zip_batch'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Batch ZIP Upload</span>
          </button>
        </div>

        {/* TAB 0: Interactive HOD Manual Report Builder */}
        {activeTab === 'manual_entry' && (
          <HODManualReportBuilder
            currentPeriod={period}
            onReportGenerated={() => {
              fetchSubmissions(period);
            }}
          />
        )}

        {/* TAB 1: Super Admin Command Center */}
        {activeTab === 'superadmin' && (
          <div className="space-y-6">

            {/* Master Consolidated Action Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Institutional Master Document
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Consolidated_Institutional_HOD_Report_{period.replace(/\s+/g, '_')} (.docx &amp; .pdf)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Synthesizes all submitted departmental reports into the official institutional master format in DOCX or PDF.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                <button
                  onClick={handleClearAll}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title="Clear all submissions for this period"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>

                {/* Primary Action Button: Prompts for DOCX, PDF, or Both */}
                <button
                  onClick={() => setShowConsolidateModal(true)}
                  disabled={consolidating || consolidatingPdf || submittedCount === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${consolidating || consolidatingPdf ? 'animate-spin' : ''}`} />
                  {consolidating || consolidatingPdf ? 'Consolidating...' : 'Consolidate Report...'}
                </button>

                {/* Direct DOCX */}
                <button
                  onClick={handleGenerateConsolidated}
                  disabled={consolidating || submittedCount === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Direct generate & download Word (.docx)"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-600" />
                  DOCX
                </button>

                {/* Direct PDF */}
                <button
                  onClick={handleGenerateConsolidatedPDF}
                  disabled={consolidatingPdf || submittedCount === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Direct generate & download Executive PDF (.pdf)"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  PDF
                </button>

                {/* Toggle Preview */}
                <button
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Preview Master Consolidated PDF"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  {showPdfPreview ? 'Hide' : 'Preview'}
                </button>
              </div>
            </div>

            {/* Optional On-Screen Consolidated PDF Preview */}
            {showPdfPreview && (
              <div className="bg-slate-200/80 border border-slate-300 rounded-3xl p-6 space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Master Consolidated Institutional PDF Preview ({period})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateConsolidatedPDF}
                      disabled={consolidatingPdf}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={() => setShowPdfPreview(false)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
                <div className="flex justify-center overflow-x-auto p-2">
                  <div className="w-full max-w-[800px]">
                    <ConsolidatedInstitutionalPDFView period={period} customData={allDeptCustomData} id="consolidated-pdf-preview" />
                  </div>
                </div>
              </div>
            )}

            {/* ⚡ Auto-Detect & Map Dedicated Hero Upload Card */}
            <div className="bg-linear-to-r from-orange-50 via-amber-50 to-indigo-50 border border-orange-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Auto-Mapping Engine
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Upload Any Committee or Department Report
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Drop your committee report (e.g. <strong>IIC/EDC</strong>, <strong>NSS</strong>, <strong>Student Clubs</strong>, <strong>Disciplinary Committee</strong>, <strong>Placement Cell</strong>, <strong>R&amp;D</strong>) or department document. Our engine automatically detects the issuing body, indexes all performance data, and maps it directly into the master institutional dossier.
                  </p>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => autoMapFileInputRef.current?.click()}
                    disabled={autoMapping}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className={`w-4 h-4 ${autoMapping ? 'animate-bounce' : ''}`} />
                    <span>{autoMapping ? 'Detecting & Mapping...' : 'Upload & Auto-Map Report (.docx / .pdf)'}</span>
                  </button>
                  <input
                    type="file"
                    ref={autoMapFileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAutoMapFileSelected(f);
                    }}
                    accept=".docx,.pdf"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Supported Bodies Quick Pill Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-orange-200/60 text-[11px]">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Auto-Supported Bodies:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-800 font-bold">💡 Innovation &amp; Entrepreneurship (IIC)</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold">🤝 NSS &amp; Community</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-pink-200 text-pink-800 font-bold">🎯 Student Clubs</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-800 font-bold">📋 Academic Committee Minutes</span>
              </div>
            </div>

            {/* Submissions Tracker */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    Submissions &amp; Committee Tracker ({period})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track academic departments and institutional committees contributing to the dossier.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setTrackerFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${trackerFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                      }`}
                  >
                    All ({allSubmissionsList.length})
                  </button>
                  <button
                    onClick={() => setTrackerFilter('ACADEMIC')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${trackerFilter === 'ACADEMIC' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                      }`}
                  >
                    Departments ({submissions?.submittedDeptsCount || 0}/{submissions?.totalDepartments || 6})
                  </button>
                  <button
                    onClick={() => setTrackerFilter('COMMITTEE')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${trackerFilter === 'COMMITTEE' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                      }`}
                  >
                    Committees ({submissions?.submittedCommsCount || 0}/{submissions?.totalCommittees || 7})
                  </button>
                </div>
              </div>

              {/* Entity Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedEntities.map((dept) => {
                  const cfg = DEPARTMENT_CONFIG[dept.code] || {
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    accent: 'bg-slate-600'
                  };

                  return (
                    <div
                      key={dept.code}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 relative overflow-hidden group"
                    >
                      {/* Top colored accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${cfg.accent}`} />

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                              {dept.code}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${dept.type === 'COMMITTEE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                              {dept.type === 'COMMITTEE' ? 'Committee' : 'Department'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {dept.name}
                          </h4>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Lead: <strong className="text-slate-800 font-semibold">{dept.hodName}</strong></span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {dept.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content & Actions */}
                      <div className="pt-2 border-t border-slate-100">
                        {dept.isSubmitted ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-slate-800 font-semibold truncate">
                                <span className="truncate max-w-[200px]" title={dept.fileName || ''}>
                                  {dept.fileName}
                                </span>
                                <span className="text-slate-500 text-[11px] ml-2 shrink-0">
                                  {dept.fileSizeFormatted}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                <span className="text-indigo-600 font-bold">
                                  {dept.itemsCount} Activities Extracted
                                </span>
                                {dept.uploadedAt && (
                                  <span className="text-slate-400">
                                    {new Date(dept.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => triggerUploadForDept(dept.name, dept.hodName)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                              >
                                <FileUp className="w-3.5 h-3.5 text-slate-600" />
                                Re-upload
                              </button>

                              {dept.id && (
                                <button
                                  onClick={() => handleDownloadDeptReport(dept.id!, dept.fileName!)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-600" />
                                  {dept.fileName?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <p className="text-xs text-slate-500">
                              No report submitted yet for {period}.
                            </p>
                            <button
                              onClick={() => triggerUploadForDept(dept.name, dept.hodName)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-700 border border-slate-300 hover:border-orange-600 text-xs font-bold transition-all duration-150 cursor-pointer group/btn"
                            >
                              <UploadCloud className="w-4 h-4 text-orange-600 group-hover/btn:text-white transition-colors" />
                              <span>Upload {dept.code} Report (.docx / .pdf)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden file input for direct department card upload */}
              <input
                type="file"
                ref={deptCardFileInputRef}
                onChange={handleDeptCardFileSelected}
                accept=".docx,.pdf"
                className="hidden"
              />
            </div>

          </div>
        )}

        {/* TAB 2: HOD Department Upload Portal */}
        {activeTab === 'hod_upload' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-5 space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-extrabold uppercase">
                <FileUp className="w-3.5 h-3.5" /> Department Submission Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Submit Monthly Department Report
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Upload your completed institutional Word report for {period}. No password or login required.
              </p>
            </div>

            {/* Prompt to use Manual Entry Builder */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block">Prefer to enter details directly without creating a Word file?</span>
                  <span className="text-amber-700">Fill publications, conferences, patents, syllabus & meetings into our interactive form.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('manual_entry')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Open Manual Form &rarr;
              </button>
            </div>

            <form onSubmit={handleHodSubmit} className="space-y-5">
              {/* Department Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value="auto">⚡ Auto-Detect &amp; Map from Document (Recommended)</option>
                  <optgroup label="Academic Departments">
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Humanities & Sciences">Humanities & Sciences (H&S)</option>
                  </optgroup>
                  <optgroup label="Institutional Committees & Specialized Bodies">
                    <option value="Innovation & Entrepreneurship">Innovation & Entrepreneurship (IIC/EDC)</option>
                    <option value="Student Engagement & Clubs">Student Engagement & Clubs (CLUBS)</option>
                    <option value="NSS & Community Engagement">NSS & Community Engagement (NSS)</option>
                    <option value="Minutes of the Meeting">Minutes of the Meeting (MOM)</option>
                  </optgroup>
                </select>
              </div>

              {/* HOD Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  HOD Full Name
                </label>
                <input
                  type="text"
                  value={hodName}
                  onChange={(e) => setHodName(e.target.value)}
                  placeholder="e.g. Dr. Kethineni Vinod Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>

              {/* Drag and Drop Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Attach Department Document (.docx or .pdf)
                </label>

                <div
                  onClick={() => hodFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.pdf'))) {
                      setHodFile(file);
                    } else {
                      toast.error('Please drop a valid .docx Word file or .pdf document');
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${isDragOver
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-slate-300 hover:border-orange-500 bg-slate-50/60 hover:bg-orange-50/20'
                    }`}
                >
                  <input
                    type="file"
                    ref={hodFileInputRef}
                    onChange={(e) => setHodFile(e.target.files?.[0] || null)}
                    accept=".docx,.pdf"
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>

                  {hodFile ? (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {hodFile.name}
                      </div>
                      <div className="text-xs text-orange-600 font-semibold">
                        {(hodFile.size / 1024).toFixed(1)} KB • Ready to submit
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-800">
                        Click to browse or drag & drop report here
                      </div>
                      <div className="text-xs text-slate-500">
                        Official monthly template document (.docx or .pdf)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploadingHod || !hodFile}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm transition-all shadow-md shadow-orange-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {uploadingHod ? 'Submitting to Registry...' : `Submit ${selectedDept} Report`}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Executive Performance Matrix */}
        {activeTab === 'matrix' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Institutional Performance Matrix ({period})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated departmental distribution inserted directly into the header of the master report.
                </p>
              </div>

              <button
                onClick={handleGenerateConsolidated}
                disabled={submittedCount === 0}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Consolidated DOCX
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                    <th className="p-3.5">Activity Category</th>
                    <th className="p-3.5 text-center text-amber-700">CIVIL</th>
                    <th className="p-3.5 text-center text-blue-700">CSE</th>
                    <th className="p-3.5 text-center text-purple-700">ECE</th>
                    <th className="p-3.5 text-center text-emerald-700">EEE</th>
                    <th className="p-3.5 text-center text-cyan-700">MECH</th>
                    <th className="p-3.5 text-center text-rose-700">H&S</th>
                    <th className="p-3.5 text-center text-slate-900 font-black bg-slate-200/60">Institutional Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {EXECUTIVE_METRICS.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-100/60 transition-colors'}>
                      <td className="p-3.5 font-bold text-slate-900">{row.category}</td>
                      <td className="p-3.5 text-center">{row.civil > 0 ? row.civil : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center">{row.cse > 0 ? row.cse : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center">{row.ece > 0 ? row.ece : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center">{row.eee > 0 ? row.eee : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center">{row.mech > 0 ? row.mech : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center">{row.hs > 0 ? row.hs : <span className="text-slate-400">-</span>}</td>
                      <td className="p-3.5 text-center font-black text-slate-900 bg-slate-100/60">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-4 text-orange-600 font-black">Total Activities Reported</td>
                    <td className="p-4 text-center text-amber-700 font-bold">18</td>
                    <td className="p-4 text-center text-blue-700 font-bold">34</td>
                    <td className="p-4 text-center text-purple-700 font-bold">28</td>
                    <td className="p-4 text-center text-emerald-700 font-bold">26</td>
                    <td className="p-4 text-center text-cyan-700 font-bold">25</td>
                    <td className="p-4 text-center text-rose-700 font-bold">29</td>
                    <td className="p-4 text-center text-base text-orange-600 font-black bg-orange-50">160</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Batch ZIP Upload */}
        {activeTab === 'zip_batch' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-8 space-y-6 shadow-2xs text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
              <FolderArchive className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Batch ZIP Archive Consolidation</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have all departmental reports packed in a single ZIP file? Upload it here to extract and consolidate them instantly.
              </p>
            </div>

            <input
              type="file"
              ref={zipFileInputRef}
              onChange={handleBatchZipUpload}
              accept=".zip"
              className="hidden"
            />

            <button
              onClick={() => zipFileInputRef.current?.click()}
              disabled={uploadingZip}
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {uploadingZip ? 'Processing Archive...' : 'Select & Upload ZIP Archive'}
            </button>
          </div>
        )}

        {/* Off-screen Consolidated PDF container positioned at (0,0) with opacity 0 for pixel-perfect html2pdf capture */}
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
          <ConsolidatedInstitutionalPDFView period={period} customData={allDeptCustomData} />
        </div>

        {/* Interactive Consolidation Format Choice Modal */}
        {showConsolidateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Master Institutional Report
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Consolidate Institutional Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your desired output format to consolidate all 5 departmental submissions for <strong>{period}</strong>:
                  </p>
                </div>
                <button
                  onClick={() => setShowConsolidateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: DOCX */}
                <button
                  onClick={() => handleConsolidateChoice('docx')}
                  disabled={consolidating}
                  className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 transition-all flex items-start gap-4 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-950">
                        Word Document (.docx)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">DOCX</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official institutional master format with editable tables for administration and record keeping.
                    </p>
                  </div>
                </button>

                {/* Option 2: PDF */}
                <button
                  onClick={() => handleConsolidateChoice('pdf')}
                  disabled={consolidatingPdf}
                  className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-start gap-4 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-950">
                        Executive PDF Dossier (.pdf)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">PDF</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Publication-grade executive document matching official SSE theme with the Executive Performance Matrix.
                    </p>
                  </div>
                </button>

                {/* Option 3: Both */}
                <button
                  onClick={() => handleConsolidateChoice('both')}
                  disabled={consolidating || consolidatingPdf}
                  className="w-full text-left p-4 rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-50/50 to-blue-50/50 hover:border-orange-500 transition-all flex items-start gap-4 group cursor-pointer shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900">
                        Consolidate Both (.docx + .pdf)
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">RECOMMENDED</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Synthesizes both the editable Word document and the executive presentation PDF in a single click.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConsolidateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HODReportConsolidatorPage;


