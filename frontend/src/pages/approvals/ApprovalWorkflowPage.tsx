import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Building2,
  DollarSign,
  UserCheck,
  Send,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileText,
  XCircle,
  Edit3,
  Sparkles,
  Layers,
  ArrowRight,
  Image,
  Camera,
  Trash2,
  Upload,
  Award,
  FileDown,
  Sliders,
  Download,
  ExternalLink,
  Linkedin,
  FileType,
  Grid,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export interface UN_SDG_Item {
  id: number;
  code: string;
  name: string;
  color: string;
  link: string;
  iconUrl: string;
  keywords: string[];
}

export const UN_SDGS: UN_SDG_Item[] = [
  { id: 1, code: 'SDG 1', name: 'No Poverty', color: '#E5243B', link: 'https://sdgs.un.org/goals/goal1', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-01.jpg', keywords: ['poverty', 'welfare', 'hardship', 'assistance', 'financial aid'] },
  { id: 2, code: 'SDG 2', name: 'Zero Hunger', color: '#DDA63A', link: 'https://sdgs.un.org/goals/goal2', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-02.jpg', keywords: ['food', 'hunger', 'nutrition', 'mess', 'canteen', 'agriculture', 'farming'] },
  { id: 3, code: 'SDG 3', name: 'Good Health and Well-being', color: '#4C9F38', link: 'https://sdgs.un.org/goals/goal3', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-03.jpg', keywords: ['health', 'wellness', 'blood', 'counseling', 'mental', 'hospital', 'medical', 'fitness', 'hygiene'] },
  { id: 4, code: 'SDG 4', name: 'Quality Education', color: '#C5192D', link: 'https://sdgs.un.org/goals/goal4', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-04.jpg', keywords: ['education', 'learning', 'lecture', 'student', 'faculty', 'fdp', 'workshop', 'seminar', 'academic', 'college', 'school', 'physics', 'course', 'training', 'teaching', 'knowledge', 'guest program', 'program'] },
  { id: 5, code: 'SDG 5', name: 'Gender Equality', color: '#FF3A21', link: 'https://sdgs.un.org/goals/goal5', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-05.jpg', keywords: ['gender', 'women', 'female', 'equality', 'empowerment', 'girls'] },
  { id: 6, code: 'SDG 6', name: 'Clean Water and Sanitation', color: '#26BDE2', link: 'https://sdgs.un.org/goals/goal6', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-06.jpg', keywords: ['water', 'sanitation', 'clean water', 'hygiene', 'drainage'] },
  { id: 7, code: 'SDG 7', name: 'Affordable and Clean Energy', color: '#FCC30B', link: 'https://sdgs.un.org/goals/goal7', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-07.jpg', keywords: ['energy', 'solar', 'renewable', 'clean energy', 'electricity', 'power', 'battery'] },
  { id: 8, code: 'SDG 8', name: 'Decent Work and Economic Growth', color: '#A21942', link: 'https://sdgs.un.org/goals/goal8', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-08.jpg', keywords: ['career', 'work', 'job', 'placement', 'employment', 'r&d', 'industry', 'economic', 'startup'] },
  { id: 9, code: 'SDG 9', name: 'Industry, Innovation and Infrastructure', color: '#FD6925', link: 'https://sdgs.un.org/goals/goal9', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-09.jpg', keywords: ['technology', 'engineering', 'innovation', 'semiconductor', 'infrastructure', 'ai', 'computer', 'research', 'lab', 'software', 'hardware'] },
  { id: 10, code: 'SDG 10', name: 'Reduced Inequalities', color: '#DD1367', link: 'https://sdgs.un.org/goals/goal10', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-10.jpg', keywords: ['inclusion', 'equality', 'diversity', 'equal opportunity', 'disability'] },
  { id: 11, code: 'SDG 11', name: 'Sustainable Cities and Communities', color: '#FD9D24', link: 'https://sdgs.un.org/goals/goal11', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-11.jpg', keywords: ['city', 'community', 'smart city', 'urban', 'sustainable'] },
  { id: 12, code: 'SDG 12', name: 'Responsible Consumption and Production', color: '#BF8B2E', link: 'https://sdgs.un.org/goals/goal12', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-12.jpg', keywords: ['waste', 'recycling', 'consumption', 'resource', 'e-waste'] },
  { id: 13, code: 'SDG 13', name: 'Climate Action', color: '#3F7E44', link: 'https://sdgs.un.org/goals/goal13', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-13.jpg', keywords: ['climate', 'green', 'environment', 'carbon', 'sustainability'] },
  { id: 14, code: 'SDG 14', name: 'Life Below Water', color: '#0A97D9', link: 'https://sdgs.un.org/goals/goal14', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-14.jpg', keywords: ['marine', 'ocean', 'water body', 'aquatic'] },
  { id: 15, code: 'SDG 15', name: 'Life on Land', color: '#56C02B', link: 'https://sdgs.un.org/goals/goal15', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-15.jpg', keywords: ['forest', 'tree', 'plantation', 'biodiversity', 'land', 'nature'] },
  { id: 16, code: 'SDG 16', name: 'Peace, Justice and Strong Institutions', color: '#00689D', link: 'https://sdgs.un.org/goals/goal16', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-16.jpg', keywords: ['ethics', 'governance', 'justice', 'peace', 'disciplinary', 'institution'] },
  { id: 17, code: 'SDG 17', name: 'Partnerships for the Goals', color: '#19486A', link: 'https://sdgs.un.org/goals/goal17', iconUrl: 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-17.jpg', keywords: ['partnership', 'collaboration', 'mou', 'jntu', 'resource person', 'guest speaker'] }
];

export const getMappedSDGs = (req: any): UN_SDG_Item[] => {
  if (!req) return [UN_SDGS[3], UN_SDGS[8], UN_SDGS[7]]; // SDG 4, SDG 9, SDG 8
  const textToScan = `${req.title || ''} ${req.category || ''} ${req.description || ''} ${req.report_summary || ''} ${req.report_outcomes || ''}`.toLowerCase();
  
  const matched = UN_SDGS.filter((sdg) =>
    sdg.keywords.some((kw) => textToScan.includes(kw))
  );

  if (matched.length > 0) {
    return matched;
  }
  // Default mapping for engineering & guest academic lectures
  return [UN_SDGS[3], UN_SDGS[8], UN_SDGS[7]]; // SDG 4: Quality Education, SDG 9: Innovation, SDG 8: Decent Work
};

export const SdgWheelSvg: React.FC<{ size?: number }> = ({ size = 40 }) => {
  const colors = [
    '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2',
    '#FCC30B', '#A21942', '#FD6925', '#DD1367', '#FD9D24', '#BF8B2E',
    '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A'
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 drop-shadow-sm">
      {colors.map((color, i) => {
        const startAngle = (i * 360) / 17 - 90;
        const endAngle = ((i + 1) * 360) / 17 - 90;
        const x1 = 50 + 46 * Math.cos((startAngle * Math.PI) / 180);
        const y1 = 50 + 46 * Math.sin((startAngle * Math.PI) / 180);
        const x2 = 50 + 46 * Math.cos((endAngle * Math.PI) / 180);
        const y2 = 50 + 46 * Math.sin((endAngle * Math.PI) / 180);
        return (
          <path
            key={i}
            d={`M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 46 46 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
            fill={color}
          />
        );
      })}
      <circle cx="50" cy="50" r="23" fill="#ffffff" />
      <circle cx="50" cy="50" r="21" fill="#1a365d" />
      <text x="50" y="47" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">SDG</text>
      <text x="50" y="58" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">SSE</text>
    </svg>
  );
};

export const ApprovalWorkflowPage: React.FC = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'principal' | 'department' | 'all'>('my');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrincipalModal, setShowPrincipalModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Post-Event Completion Report Modals & Form State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // PDF & Printable Document Customization Controls State
  const [pdfMargin, setPdfMargin] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [pdfWatermarkText, setPdfWatermarkText] = useState('OFFICIAL COPY');
  const [pdfShowWatermark, setPdfShowWatermark] = useState(true);
  const [pdfShowHeader, setPdfShowHeader] = useState(true);
  const [pdfShowFooter, setPdfShowFooter] = useState(true);
  const [pdfPhotoColumns, setPdfPhotoColumns] = useState<'2' | '1'>('2');
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [reportEventDate, setReportEventDate] = useState('');
  const [reportParticipantsCount, setReportParticipantsCount] = useState('');
  const [reportActualExpenditure, setReportActualExpenditure] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportOutcomes, setReportOutcomes] = useState('');
  const [reportCustomTitle, setReportCustomTitle] = useState('');
  const [reportCustomHeading, setReportCustomHeading] = useState('POST-EVENT OUTCOME & COMPLETION REPORT');
  const [reportResourcePerson, setReportResourcePerson] = useState('');
  const [reportPhotos, setReportPhotos] = useState<{ url: string; caption: string }[]>([]);

  // Temp photo input state
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');

  // Form States for 14-Point SSE Financial Assistance Application (Blank initial state, sample data shown in placeholders)
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Guest Program / Lecture');
  const [newDept, setNewDept] = useState(user?.department || '');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // 14 Individual Points State
  const [f1OrgSecretary, setF1OrgSecretary] = useState('');
  const [f2Dept, setF2Dept] = useState(user?.department || '');
  const [f3Theme, setF3Theme] = useState('');
  const [f4TargetGroup, setF4TargetGroup] = useState('');
  const [f5ResourcePerson, setF5ResourcePerson] = useState('');
  const [f6Affiliation, setF6Affiliation] = useState('');
  const [f7Level, setF7Level] = useState('State Level');
  const [f8Duration, setF8Duration] = useState('Half Day');
  const [f9PastPrograms, setF9PastPrograms] = useState('');
  const [f10LocalPart, setF10LocalPart] = useState('');
  const [f10OutstationPart, setF10OutstationPart] = useState('');
  
  // Expenditure
  const [f11TaDa, setF11TaDa] = useState('');
  const [f11Honorarium, setF11Honorarium] = useState('');
  const [f11Misc, setF11Misc] = useState('');
  const [f11Total, setF11Total] = useState('');
  
  const [f12AssistanceSought, setF12AssistanceSought] = useState('');
  const [f13OtherSources, setF13OtherSources] = useState('');
  const [f14ImportanceNote, setF14ImportanceNote] = useState('');

  // Auto-calculate Total Expenditure
  const calculateTotalExp = (hon: string, misc: string) => {
    const h = parseFloat(hon) || 0;
    const m = parseFloat(misc) || 0;
    const tot = h + m;
    setF11Total(tot > 0 ? tot.toString() : '6000');
    setF12AssistanceSought(tot > 0 ? tot.toString() : '6000');
  };

  // Principal Action State
  const [principalActionType, setPrincipalActionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [principalComment, setPrincipalComment] = useState('');

  // Dept Action State
  const [deptRole, setDeptRole] = useState<'HR' | 'DIRECTOR' | 'ACCOUNTS'>('HR');
  const [deptActionType, setDeptActionType] = useState<'APPROVED' | 'NEEDS_INFO'>('APPROVED');
  const [deptComment, setDeptComment] = useState('');

  // Resubmit State
  const [resubmitNotes, setResubmitNotes] = useState('');

  // Discussion Comment State
  const [newDiscussionComment, setNewDiscussionComment] = useState('');

  // Photo Attachment Handlers (Max 4 photos)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reportPhotos.length >= 4) {
      toast.error('Maximum 4 event photographs allowed.');
      if (e.target) e.target.value = '';
      return;
    }

    const availableSlots = 4 - reportPhotos.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.error(`You can only upload up to 4 photos in total. Adding ${availableSlots} photo(s).`);
    }

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setReportPhotos((prev) => {
            if (prev.length >= 4) return prev;
            return [
              ...prev,
              { url: base64Url, caption: photoCaptionInput.trim() || '' }
            ];
          });
          setPhotoCaptionInput('');
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleAddPhotoFromUrl = () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter image URL or select a photo file');
      return;
    }
    if (reportPhotos.length >= 4) {
      toast.error('Maximum 4 event photographs allowed.');
      return;
    }
    setReportPhotos((prev) => [
      ...prev.slice(0, 3),
      { url: photoUrlInput.trim(), caption: photoCaptionInput.trim() || '' }
    ]);
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setReportPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAISummaryAndOutcomes = async () => {
    if (!selectedRequest) return;
    setIsGeneratingAI(true);
    try {
      const response = await api.post('/approvals/generate-report-ai', {
        title: selectedRequest.title,
        department: selectedRequest.department,
        category: selectedRequest.category,
        description: selectedRequest.description,
        userNotes: reportSummary.trim(),
        eventDate: reportEventDate || selectedRequest.report_event_date,
        participantsCount: reportParticipantsCount || selectedRequest.report_participants_count
      });

      if (response.data.success && response.data.data) {
        const { executiveSummary, keyOutcomes, usedGemini } = response.data.data;
        setReportSummary(executiveSummary);
        setReportOutcomes(keyOutcomes);
        if (usedGemini) {
          toast.success('Generated Executive Summary & Outcomes using Gemini AI!');
        } else {
          toast.success('Generated Executive Summary & Outcomes via AI engine!');
        }
      }
    } catch (err: any) {
      console.error('Error generating AI report:', err);
      toast.error('Failed to generate report using AI. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAutoFillSampleReport = () => {
    setReportEventDate('22 March 2024');
    setReportParticipantsCount('145 First-Year Students & 12 Faculty Members');
    setReportActualExpenditure('6000');
    
    // Set brief 2-3 line notes specific to the title
    const reqTitle = selectedRequest?.title || 'Guest Academic Program';
    const sampleNotes = `Official event execution of "${reqTitle}". Keynote speaker delivered interactive technical lectures, live case study demonstrations, and engaged students in a detailed Q&A session.`;
    setReportSummary(sampleNotes);
    setReportOutcomes('1. Conceptual understanding of key topics.\n2. Practical analytical exposure.\n3. Industry alignment.\n4. Positive participant feedback.');
    
    setReportPhotos([
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
        caption: 'Chief Guest inaugurating the Guest Program'
      },
      {
        url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop',
        caption: 'HOD presenting memento & felicitation to Resource Person'
      },
      {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        caption: 'Interactive Q&A Session with Students'
      },
      {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        caption: 'Group photo of Faculty Organizers with Chief Guest'
      }
    ]);
  };

  const openReportModal = (reqItem: any) => {
    setReportEventDate(reqItem.report_event_date || '22 March 2024');
    setReportParticipantsCount(reqItem.report_participants_count || '145 Students & 12 Faculty');
    setReportActualExpenditure(
      reqItem.report_actual_expenditure !== undefined && reqItem.report_actual_expenditure !== null
        ? reqItem.report_actual_expenditure.toString()
        : reqItem.amount ? reqItem.amount.toString() : '6000'
    );
    setReportSummary(reqItem.report_summary || '');
    setReportOutcomes(reqItem.report_outcomes || '');
    setReportCustomTitle(reqItem.report_custom_title || reqItem.title || '');
    setReportCustomHeading(reqItem.report_custom_heading || 'POST-EVENT OUTCOME & COMPLETION REPORT');
    setReportResourcePerson(reqItem.report_resource_person || reqItem.resource_person || '');

    let photos = [];
    if (reqItem.report_photos) {
      try {
        photos = typeof reqItem.report_photos === 'string' ? JSON.parse(reqItem.report_photos) : reqItem.report_photos;
      } catch (e) {
        photos = [];
      }
    }
    setReportPhotos(photos || []);
    setShowReportModal(true);
  };

  const openPrintReportModal = (reqItem: any) => {
    setReportCustomTitle(reqItem.report_custom_title || reqItem.title || '');
    setReportCustomHeading(reqItem.report_custom_heading || 'POST-EVENT OUTCOME & COMPLETION REPORT');
    setReportResourcePerson(reqItem.report_resource_person || reqItem.resource_person || '');
    setShowPrintReportModal(true);
  };

  const handleSaveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!reportSummary.trim()) {
      toast.error('Please enter executive summary of the program');
      return;
    }
    try {
      await api.post(`/approvals/${selectedRequest.id}/report`, {
        reportSummary,
        reportOutcomes,
        reportParticipantsCount,
        reportEventDate,
        reportResourcePerson,
        reportActualExpenditure: parseFloat(reportActualExpenditure) || selectedRequest.amount,
        reportPhotos,
        reportCustomTitle,
        reportCustomHeading
      });
      toast.success('Post-Event Outcome & Completion Report saved with photos!');
      setShowReportModal(false);
      fetchRequests();
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save completion report');
    }
  };

  const displayReportTitle = reportCustomTitle.trim() || selectedRequest?.report_custom_title || selectedRequest?.title || 'Event Completion Report';
  const displayReportHeading = reportCustomHeading.trim() || selectedRequest?.report_custom_heading || 'POST-EVENT OUTCOME & COMPLETION REPORT';

  const fetchAsBase64 = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return url;
    }
  };

  const parseOutcomePoints = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    let raw = text.trim();
    let lines = raw.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && /\d+\.\s+/.test(lines[0])) {
      lines = lines[0].split(/(?=\d+\.\s+)/).map((l) => l.trim()).filter(Boolean);
    }
    return lines.map((line) => line.replace(/^(\d+[\.\)]|[-*•])\s*/, '').trim()).filter(Boolean);
  };

  const exportReportToWord = async (req: any) => {
    if (!req) return;
    toast.info('Preparing Word document export...');

    // Convert uploaded college header logo & S-logo to Base64 so Word displays them offline & reliably
    const logoBase64 = await fetchAsBase64('/assets/sse-header-logo.png');
    const sLogoBase64 = await fetchAsBase64('/assets/sse-s-logo.jpg');

    let photos = [];
    try {
      photos = typeof req.report_photos === 'string' ? JSON.parse(req.report_photos) : req.report_photos;
    } catch (e) {
      photos = [];
    }

    // Convert photo URLs to Base64 if needed for offline Word rendering (Max 4 photos)
    const processedPhotos = await Promise.all(
      (photos || []).slice(0, 4).map(async (p: any) => {
        let b64 = p.url;
        if (p.url && !p.url.startsWith('data:')) {
          b64 = await fetchAsBase64(p.url);
        }
        return {
          ...p,
          url: b64
        };
      })
    );

    let photosHTML = '';
    if (processedPhotos && processedPhotos.length > 0) {
      photosHTML = `
        <h3 style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 2pt solid #0f172a; padding-bottom: 3pt; margin-top: 16pt; margin-bottom: 8pt; page-break-after: avoid;">
          EVENT PHOTOGRAPHS & VISUAL EVIDENCE
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; page-break-inside: avoid;" class="no-border">
          <tr>
            ${processedPhotos
              .map(
                (p: any, idx: number) => `
              <td style="width: 50%; padding: 4pt; vertical-align: top; border: none; page-break-inside: avoid;" align="center">
                <div style="border: 1.5pt solid #0f172a; background-color: #ffffff; padding: 6pt; text-align: center; border-radius: 4pt; width: 230px; margin: 0 auto;">
                  <table style="width: 100%; border: none;" class="no-border">
                    <tr style="border: none;">
                      <td style="border: none; text-align: center; vertical-align: middle; height: 140px; background-color: #f8fafc; padding: 2px;" align="center">
                        <img src="${p.url}" width="220" height="135" alt="${p.caption || 'Event Photo'}" style="width: 220px; height: 135px; border: 1pt solid #cbd5e1; display: block; margin: 0 auto;" />
                      </td>
                    </tr>
                  </table>
                  <p style="font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: bold; font-style: italic; color: #1e293b; background-color: #f1f5f9; padding: 4pt; margin-top: 5pt; margin-bottom: 0; border: 1pt solid #cbd5e1; border-radius: 3pt; text-align: center;">
                    ${p.caption || `Photo ${idx + 1}`}
                  </p>
                </div>
              </td>
              ${(idx + 1) % 2 === 0 && idx < processedPhotos.length - 1 ? '</tr><tr style="page-break-inside: avoid;">' : ''}
            `
              )
              .join('')}
          </tr>
        </table>
      `;
    }

    const outcomeList = parseOutcomePoints(req.report_outcomes);
    const mappedSdgs = getMappedSDGs(req);
    const wordTitle = reportCustomTitle.trim() || req.report_custom_title || req.title || 'Event Completion Report';
    const wordHeading = reportCustomHeading.trim() || req.report_custom_heading || 'POST-EVENT OUTCOME & COMPLETION REPORT';

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${wordTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 210mm 297mm;
            margin: 15mm 15mm 15mm 15mm;
            mso-header-margin: 10mm;
            mso-footer-margin: 10mm;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          th, td { border: 1pt solid #64748b; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
          tr { page-break-inside: avoid; }
          .no-border, .no-border td { border: none !important; }
          .banner { background-color: #f1f5f9; text-align: center; font-weight: bold; font-size: 12pt; padding: 8pt; border: 1pt solid #475569; margin-top: 12pt; margin-bottom: 12pt; text-transform: uppercase; }
          .section-heading { font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 2pt solid #0f172a; padding-bottom: 3pt; margin-top: 16pt; margin-bottom: 6pt; page-break-after: avoid; }
          .text-box { background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 8pt 10pt; font-size: 10pt; line-height: 1.5; margin-top: 4pt; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- PAGE 1: PROGRAM OVERVIEW & EXECUTIVE SUMMARY -->
          <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
            <!-- Header Bar -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; border-bottom: 2pt solid #1a365d; padding-bottom: 4pt;" class="no-border">
              <tr style="border: none;">
                <td style="border: none; font-size: 11pt; font-weight: bold; color: #1a365d; text-transform: uppercase;">
                  SANSKRITHI SCHOOL OF ENGINEERING
                </td>
                <td style="border: none; font-size: 9.5pt; font-weight: bold; color: #64748b; text-align: right;" align="right">
                  Department of ${req.department || 'Humanities & Sciences'}
                </td>
              </tr>
            </table>

            <!-- DOCUMENT TITLE -->
            <div style="text-align: center; margin-top: 12pt; margin-bottom: 14pt;">
              <h1 style="font-family: Arial, sans-serif; font-size: 20pt; font-weight: 900; color: #1a365d; margin: 0; text-transform: uppercase; letter-spacing: 0.5pt;">
                POST-EVENT OUTCOME &amp; COMPLETION REPORT
              </h1>
              <div style="font-size: 12.5pt; font-weight: bold; color: #334155; margin-top: 4pt;">
                ${wordTitle}
              </div>
              <div style="font-size: 9.5pt; color: #64748b; margin-top: 2pt;">
                Event Date: ${req.report_event_date || '22 March 2024'} &middot; Year ${req.report_event_date ? req.report_event_date.split(' ').pop() : '2024'}
              </div>
            </div>

            <!-- PROGRAM OVERVIEW -->
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              PROGRAM OVERVIEW
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1pt solid #cbd5e1; margin-top: 6pt; margin-bottom: 14pt;">
              <tr>
                <td style="width: 32%; font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Program / Event Title:</td>
                <td style="width: 68%; font-weight: bold; color: #0f172a; border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${wordTitle}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Organizing Department &amp; Secretary:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">Department of ${req.department || 'Humanities & Sciences'} &middot; ${req.submitted_by_name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Event Execution Date:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${req.report_event_date || '22 March 2024'}</td>
              </tr>
              ${
                (req.report_resource_person || req.resource_person || reportResourcePerson)
                  ? `<tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Resource Person / Speaker:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${req.report_resource_person || req.resource_person || reportResourcePerson}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Participants / Beneficiaries:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${req.report_participants_count || '145 students and 12 faculty members'}</td>
              </tr>
            </table>

            <!-- EXECUTIVE SUMMARY -->
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              EXECUTIVE SUMMARY
            </div>
            <div style="padding: 4pt 0; font-size: 10pt; line-height: 1.5; color: #334155; margin-bottom: 14pt; white-space: pre-wrap;">
              ${req.report_summary || 'The Department conducted a program designed to introduce participants to physical principles and engineering applications. The session connected classroom concepts with practical considerations such as energy efficiency and system performance.'}
            </div>

            <div style="text-align: center; border-top: 1pt solid #e2e8f0; padding-top: 8pt; font-size: 10pt; font-weight: bold; color: #1a365d; margin-top: 24pt;">
              1
            </div>
          </div>
          <br clear="all" style="page-break-before:always;" />

          <!-- PAGE 2: KEY OUTCOMES & SDG ALIGNMENT -->
          <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
            <!-- Header Bar -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; border-bottom: 2pt solid #1a365d; padding-bottom: 4pt;" class="no-border">
              <tr style="border: none;">
                <td style="border: none; font-size: 11pt; font-weight: bold; color: #1a365d; text-transform: uppercase;">
                  SANSKRITHI SCHOOL OF ENGINEERING
                </td>
                <td style="border: none; font-size: 9.5pt; font-weight: bold; color: #64748b; text-align: right;" align="right">
                  Department of ${req.department || 'Humanities & Sciences'}
                </td>
              </tr>
            </table>

            <!-- KEY OUTCOMES -->
            ${
              outcomeList.length > 0
                ? `
              <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 10pt; margin-bottom: 8pt;">
                KEY OUTCOMES &amp; LEARNING IMPACT
              </div>
              <div style="margin-bottom: 16pt;">
                <ol style="margin: 0; padding-left: 18pt; font-size: 10pt; line-height: 1.6; color: #0f172a;">
                  ${outcomeList.map((pt) => `<li style="margin-bottom: 6pt; font-weight: 500;">${pt}</li>`).join('')}
                </ol>
              </div>
            `
                : ''
            }

            <!-- SDG ALIGNMENT -->
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              SUSTAINABLE DEVELOPMENT GOALS
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 14pt;" class="no-border">
              <tr>
                ${mappedSdgs
                  .map(
                    (sdg) => `
                  <td style="width: 85px; padding: 4pt; border: none; vertical-align: top;" align="center">
                    <a href="${sdg.link}">
                      <img src="${sdg.iconUrl}" width="75" height="75" alt="SDG ${sdg.id} ${sdg.name}" style="width: 75px; height: 75px; border: none; margin: 0; display: block;" />
                    </a>
                  </td>
                `
                  )
                  .join('')}
              </tr>
            </table>

            <div style="text-align: center; border-top: 1pt solid #e2e8f0; padding-top: 8pt; font-size: 10pt; font-weight: bold; color: #1a365d; margin-top: 24pt;">
              2
            </div>
          </div>
          <br clear="all" style="page-break-before:always;" />

          <!-- PAGE 3: EVENT PHOTOGRAPHS & CERTIFICATION -->
          <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
            <!-- Header Bar -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; border-bottom: 2pt solid #1a365d; padding-bottom: 4pt;" class="no-border">
              <tr style="border: none;">
                <td style="border: none; font-size: 11pt; font-weight: bold; color: #1a365d; text-transform: uppercase;">
                  SANSKRITHI SCHOOL OF ENGINEERING
                </td>
                <td style="border: none; font-size: 9.5pt; font-weight: bold; color: #64748b; text-align: right;" align="right">
                  Department of ${req.department || 'Humanities & Sciences'}
                </td>
              </tr>
            </table>

            ${photosHTML}

            <!-- CERTIFICATION & APPROVAL SIGNATURES -->
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 20pt; margin-bottom: 8pt; page-break-inside: avoid;">
              CERTIFICATION &amp; APPROVAL
            </div>
            <div style="font-size: 9.5pt; color: #64748b; font-style: italic; margin-bottom: 16pt;">
              The undersigned certify that the program was conducted as reported and that the information presented in this completion report is accurate to the best of their knowledge.
            </div>

            <table style="width: 100%; border: none; margin-top: 20pt; page-break-inside: avoid;" class="no-border">
              <tr style="border: none; text-align: center; font-weight: bold;">
                <td style="border: none; width: 25%;">
                  <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">Signed digitally</div>
                  Organizing Secretary
                </td>
                <td style="border: none; width: 25%;">
                  <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">Verified & Signed</div>
                  Head of Dept (HOD)
                </td>
                <td style="border: none; width: 25%;">
                  <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">Approved</div>
                  Principal
                </td>
                <td style="border: none; width: 25%;">
                  <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">Approved</div>
                  Chairman
                </td>
              </tr>
            </table>

            <div style="text-align: center; border-top: 1pt solid #e2e8f0; padding-top: 8pt; font-size: 10pt; font-weight: bold; color: #1a365d; margin-top: 24pt;">
              3
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${req.request_number || 'Report'}_Event_Outcome_Report.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Word document (.doc) exported with clean layout!');
  };

  const exportApplicationToWord = async (req: any) => {
    if (!req) return;
    toast.info('Preparing Word document export...');
    const logoBase64 = await fetchAsBase64('/assets/sse-header-logo.png');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${req.title || 'Requisition Application'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 210mm 297mm;
            margin: 15mm 15mm 15mm 15mm;
            mso-header-margin: 10mm;
            mso-footer-margin: 10mm;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          th, td { border: 1pt solid #64748b; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
          tr { page-break-inside: avoid; }
          .no-border, .no-border td { border: none !important; }
          .banner { background-color: #f1f5f9; text-align: center; font-weight: bold; font-size: 12pt; padding: 8pt; border: 1pt solid #475569; margin-top: 12pt; margin-bottom: 12pt; text-transform: uppercase; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div style="text-align: center; margin-bottom: 10pt; border-bottom: 2pt solid #0f172a; padding-bottom: 8pt;">
            <img src="${logoBase64}" width="480" alt="Sanskrithi School of Engineering Logo" style="max-width: 100%; width: 480px; height: auto; display: block; margin: 0 auto;" />
            <div style="font-size: 9.5pt; font-weight: bold; color: #334155; margin-top: 6pt; text-align: center;">
              Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134
            </div>
            <div style="font-size: 8.5pt; color: #64748b; font-style: italic; margin-top: 2pt; text-align: center;">
              Affiliated to JNTUA & Approved by AICTE | www.sseptp.org
            </div>
          </div>

          <div class="banner">${req.title || 'APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING GUEST PROGRAM'}</div>

          <table>
            <tr>
              <td style="width: 40%; font-weight: bold; background-color: #f1f5f9;">1. Name & address of Organizing Secretary:</td>
              <td style="width: 60%; font-weight: bold;">${req.submitted_by_name} (${req.department})</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">2. Department under auspices of lecture:</td>
              <td>${req.department}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f1f5f9;">3. Theme(s) of the FDP/Program:</td>
              <td>${req.category}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">4. Target Group:</td>
              <td>HAS Faculties, all First Year Students</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f1f5f9;">5. Resource Person & Affiliation:</td>
              <td>Dr. Padmasuvarna, Professor, Dept of Physics, JNTU Anantapur</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">6. Level of Expert Lecture:</td>
              <td>State / Regional Level</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f1f5f9;">7. Duration of Programme:</td>
              <td>Half Day</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">8. Estimated Expenditure Breakdown:</td>
              <td style="font-family: monospace;">Honorarium: Rs. 5000 | Misc: Rs. 1000 | <strong>Total: Rs. ${req.amount || 6000}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f1f5f9;">9. Description & Purpose:</td>
              <td style="white-space: pre-wrap;">${req.description}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">10. Principal Review Status:</td>
              <td style="font-weight: bold;">${req.status} ${req.principal_comments ? `(${req.principal_comments})` : ''}</td>
            </tr>
          </table>

          <table style="width: 100%; border: none; margin-top: 35pt; page-break-inside: avoid;" class="no-border">
            <tr style="border: none; text-align: center; font-weight: bold;">
              <td style="border: none; width: 33%;">
                <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">Signed digitally</div>
                Organizing Secretary
              </td>
              <td style="border: none; width: 33%;">
                <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">
                  ${req.principal_action_at ? `Approved on ${new Date(req.principal_action_at).toLocaleDateString()}` : 'Pending Signature'}
                </div>
                Principal Signature
              </td>
              <td style="border: none; width: 33%;">
                <div style="border-bottom: 1pt solid #94a3b8; padding-bottom: 25pt; margin-bottom: 4pt; color: #94a3b8; font-weight: normal; font-style: italic;">
                  ${req.status === 'FULLY_APPROVED' ? 'Verified & Signed' : 'Pending Clearance'}
                </div>
                Chairman Signature
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${req.request_number || 'Requisition'}_Application_Form.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Requisition Application exported to Word (.doc) successfully!');
  };

  const handleDownloadPDF = async (elementId: string, defaultFilename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Document content not found for PDF export');
      return;
    }
    setIsGeneratingPdf(true);
    const loadingToast = toast.loading('Generating professional A4 PDF...');

    try {
      const marginMm = pdfMargin === 'narrow' ? 5 : pdfMargin === 'wide' ? 15 : 10;
      const opt = {
        margin: [marginMm, marginMm, marginMm, marginMm],
        filename: defaultFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
      toast.dismiss(loadingToast);
      toast.success('Official PDF document downloaded successfully!');
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      toast.dismiss(loadingToast);
      toast.error('Direct PDF export failed. Falling back to Print/Save as PDF...');
      if (elementId === 'printable-application-body') {
        handlePrintApplication(selectedRequest);
      } else {
        handlePrintReport(selectedRequest);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintReport = (req: any) => {
    window.print();
  };

  const handlePrintApplication = (req: any) => {
    window.print();
  };

  const specialRole = (user?.special_role || user?.specialRole || '').toUpperCase();
  const userRole = (user?.role || '').toUpperCase();

  const isSuperAdmin = userRole === 'SUPER_ADMIN' || specialRole.includes('PRINCIPAL');
  const isHR = specialRole.includes('HR') || userRole === 'HR' || isSuperAdmin;
  const isDirector = specialRole.includes('DIRECTOR') || specialRole.includes('MENTOR') || userRole === 'DIRECTOR' || userRole === 'MENTOR' || userRole === 'ADMIN' || isSuperAdmin;
  const isAccounts = specialRole.includes('ACCOUNTS') || userRole === 'ACCOUNTS' || isSuperAdmin;
  const isHOD = specialRole.includes('HOD') || userRole === 'FACULTY' || userRole === 'MENTOR' || userRole === 'DIRECTOR' || isSuperAdmin;

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/approvals');
      setRequests(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load approval requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (isSuperAdmin) {
      setActiveTab('principal');
    } else if (isHR || isDirector || isAccounts) {
      setActiveTab('department');
    } else {
      setActiveTab('my');
    }
  }, [user]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter application title');
      return;
    }
    
    // Construct formatted 14-point description
    const formatted14Points = `
1. Organizing Secretary: ${f1OrgSecretary}
2. Department: ${f2Dept}
3. Theme: ${f3Theme}
4. Target Group: ${f4TargetGroup}
5. Resource Person: ${f5ResourcePerson}
6. Affiliation: ${f6Affiliation}
7. Level: ${f7Level}
8. Duration: ${f8Duration}
9. Past Programmes Organized: ${f9PastPrograms}
10. Expected Participants: Local (${f10LocalPart}), Outstation (${f10OutstationPart})
11. Estimated Expenditure:
    - TA & DA: ${f11TaDa}
    - Honorarium: Rs. ${f11Honorarium}
    - Miscellaneous: Rs. ${f11Misc}
    - Total Expenditure: Rs. ${f11Total}
12. Financial Assistance Sought: Rs. ${f12AssistanceSought}
13. Expected Other Sources: ${f13OtherSources}
14. Note on Importance: ${f14ImportanceNote}
`.trim();

    try {
      await api.post('/approvals', {
        title: newTitle,
        category: newCategory,
        description: formatted14Points,
        amount: parseFloat(f11Total) || 6000,
        department: f2Dept || newDept
      });
      toast.success('Application submitted to Principal for approval!');
      setShowCreateModal(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    }
  };

  const handlePrincipalActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (principalActionType === 'REQUEST_CHANGES' && !principalComment.trim()) {
      toast.error('Please provide details/comments on required changes');
      return;
    }
    try {
      await api.post(`/approvals/${selectedRequest.id}/principal-action`, {
        action: principalActionType,
        comments: principalComment
      });
      toast.success(`Principal action recorded: ${principalActionType}`);
      setShowPrincipalModal(false);
      setPrincipalComment('');
      fetchRequests();
      // refresh details if currently viewing
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record Principal action');
    }
  };

  const handleDeptActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!deptComment.trim()) {
      toast.error('Please provide departmental review comments');
      return;
    }
    try {
      const res = await api.post(`/approvals/${selectedRequest.id}/department-action`, {
        departmentRole: deptRole,
        action: deptActionType,
        comments: deptComment
      });
      toast.success(`${deptRole} sign-off and review submitted!`);
      if (res.data.isFullyApproved) {
        toast.success('🎉 Requisition is now FULLY APPROVED across all departments!');
      }
      setShowDeptModal(false);
      setDeptComment('');
      fetchRequests();
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit departmental action');
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await api.put(`/approvals/${selectedRequest.id}/resubmit`, {
        title: newTitle || selectedRequest.title,
        category: newCategory || selectedRequest.category,
        description: newDesc || selectedRequest.description,
        amount: newAmount !== '' ? parseFloat(newAmount) : selectedRequest.amount,
        resubmissionNotes: resubmitNotes
      });
      toast.success('Requisition updated & resubmitted to Principal!');
      setShowResubmitModal(false);
      setResubmitNotes('');
      fetchRequests();
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit requisition');
    }
  };

  const fetchRequestDetails = async (id: string) => {
    try {
      const res = await api.get(`/approvals/${id}`);
      setSelectedRequest(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load request details');
    }
  };

  const handlePostGeneralComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newDiscussionComment.trim()) return;
    try {
      await api.post(`/approvals/${selectedRequest.id}/comments`, {
        comment: newDiscussionComment
      });
      toast.success('Comment added to discussion thread');
      setNewDiscussionComment('');
      fetchRequestDetails(selectedRequest.id);
    } catch (err: any) {
      toast.error('Failed to add comment');
    }
  };

  // Filter lists based on tab
  const mySubmissions = requests.filter(r => r.submitted_by_id === user?.id);
  const pendingPrincipal = requests.filter(r => r.status === 'PENDING_PRINCIPAL_APPROVAL');
  const pendingDept = requests.filter(r => r.status === 'PENDING_DEPARTMENTAL_REVIEW' || r.status === 'FULLY_APPROVED');

  const displayedRequests =
    activeTab === 'my'
      ? mySubmissions
      : activeTab === 'principal'
      ? pendingPrincipal
      : activeTab === 'department'
      ? pendingDept
      : requests;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PRINCIPAL_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Principal Approval
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Changes Requested by Principal
          </span>
        );
      case 'PENDING_DEPARTMENTAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Layers className="w-3.5 h-3.5" /> Under HR, Director & Accounts Review
          </span>
        );
      case 'FULLY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Approved & Disbursed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected by Principal
          </span>
        );
      default:
        return <span className="text-xs font-medium text-slate-600">{status}</span>;
    }
  };

  if (isLoading) return <LoadingState message="Loading Multi-Stage Approvals & Requisitions Hub..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Global CSS for Browser Print to PDF */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        #printable-report-body,
        #printable-report-body * {
          font-family: 'Inter', system-ui, sans-serif;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          
          #printable-application-body,
          #printable-application-body *,
          #printable-report-body,
          #printable-report-body * {
            visibility: visible !important;
          }

          #printable-application-body,
          #printable-report-body {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 backdrop-blur-md text-xs font-medium border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Executive Workflow Engine
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Requisitions & Multi-Stage Approvals
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Submit HOD proposals & requisitions, route through <span className="text-orange-400 font-semibold">Principal Approval</span> with feedback comments, and complete multi-departmental sign-offs across <span className="text-blue-300 font-semibold">HR, Director, & Accounts</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" /> Submit Requisition
            </button>

            <button
              onClick={fetchRequests}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all"
              title="Refresh Requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Stage Stepper */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-medium">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">1</div>
            <div>
              <p className="font-semibold text-white">HOD Submission</p>
              <p className="text-slate-400 text-[11px]">Draft & submit proposal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
            <div>
              <p className="font-semibold text-white">Principal Review</p>
              <p className="text-slate-400 text-[11px]">Approve or comment/revise</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">3</div>
            <div>
              <p className="font-semibold text-white">HR, Director & Accounts</p>
              <p className="text-slate-400 text-[11px]">Departmental sign-offs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">4</div>
            <div>
              <p className="font-semibold text-white">Execution</p>
              <p className="text-slate-400 text-[11px]">Fully approved & disbursed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'my'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> My Submissions ({mySubmissions.length})
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('principal')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'principal'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Pending Principal Approvals ({pendingPrincipal.length})
          </button>
        )}

        {(isHR || isDirector || isAccounts || isSuperAdmin) && (
          <button
            onClick={() => setActiveTab('department')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'department'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Departmental Reviews (HR, Director & Accounts)
          </button>
        )}

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> All Requisitions History ({requests.length})
        </button>
      </div>

      {/* Main Grid List & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requisitions List */}
        <div className={`space-y-4 ${selectedRequest ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {displayedRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Requisitions Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No active approval requests match this filter tab. Click "Submit Requisition" above to post a new proposal.
              </p>
            </div>
          ) : (
            displayedRequests.map((reqItem) => {
              const isSelected = selectedRequest?.id === reqItem.id;
              return (
                <div
                  key={reqItem.id}
                  onClick={() => fetchRequestDetails(reqItem.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                          {reqItem.request_number}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {reqItem.department}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base line-clamp-1">{reqItem.title}</h4>
                      <p className="text-xs text-slate-500">
                        Submitted by <span className="font-semibold text-slate-700">{reqItem.submitted_by_name}</span>
                      </p>
                    </div>
                    {getStatusBadge(reqItem.status)}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      {reqItem.amount > 0 && (
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> ₹{reqItem.amount.toLocaleString()}
                        </span>
                      )}
                      <span>{new Date(reqItem.created_at).toLocaleDateString()}</span>
                    </div>

                    <span className="text-orange-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Inspect & Action <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Inspection Details Panel */}
        {selectedRequest && (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                      {selectedRequest.request_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {selectedRequest.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{selectedRequest.title}</h2>
                  <p className="text-xs text-slate-500">
                    Department: <span className="font-semibold text-slate-700">{selectedRequest.department}</span> | Submitter: <span className="font-semibold text-slate-700">{selectedRequest.submitted_by_name}</span> ({selectedRequest.submitter_email})
                  </p>
                </div>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {/* Rejection / Feedback Remarks Alert Banner */}
              {(selectedRequest.status === 'REJECTED' || selectedRequest.status === 'CHANGES_REQUESTED' || selectedRequest.principal_comments) && (
                <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                  selectedRequest.status === 'REJECTED'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-900'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertCircle className={`w-5 h-5 ${selectedRequest.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`} />
                      <span>{selectedRequest.status === 'REJECTED' ? 'Requisition Rejected - Remarks' : 'Revisions Requested - Remarks'}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 border border-current shadow-sm">
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reviewer Remarks / Instructions:</span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed italic">
                      "{selectedRequest.principal_comments || 'No detailed comments provided.'}"
                    </p>
                  </div>
                  {selectedRequest.submitted_by_id === user?.id && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                      <p className="text-xs font-semibold text-slate-700">
                        💡 Please address the remarks above, adjust your requisition details, and click <strong>"Revise & Resubmit Application"</strong>.
                      </p>
                      <button
                        onClick={() => {
                          setNewTitle(selectedRequest.title);
                          setNewCategory(selectedRequest.category);
                          setNewDesc(selectedRequest.description);
                          setNewAmount(selectedRequest.amount);
                          setShowResubmitModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Revise & Resubmit Application
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Amount & Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Estimated Expenditure / Budget:</span>
                  <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    ₹{selectedRequest.amount ? parseFloat(selectedRequest.amount).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Requisition Details & Purpose</h5>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Action Buttons for Roles */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white">
                {/* Principal Action Button */}
                {isSuperAdmin && selectedRequest.status === 'PENDING_PRINCIPAL_APPROVAL' && (
                  <button
                    onClick={() => {
                      setPrincipalActionType('APPROVE');
                      setShowPrincipalModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4" /> Principal Review & Decision
                  </button>
                )}

                {/* HOD Resubmit Button */}
                {selectedRequest.submitted_by_id === user?.id && (selectedRequest.status === 'CHANGES_REQUESTED' || selectedRequest.status === 'REJECTED') && (
                  <button
                    onClick={() => {
                      setNewTitle(selectedRequest.title);
                      setNewCategory(selectedRequest.category);
                      setNewDesc(selectedRequest.description);
                      setNewAmount(selectedRequest.amount);
                      setShowResubmitModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <Edit3 className="w-4 h-4" /> Revise & Resubmit Application
                  </button>
                )}

                {/* Departmental Review Button (HR, Director, Accounts) */}
                {(isHR || isDirector || isAccounts) && selectedRequest.status === 'PENDING_DEPARTMENTAL_REVIEW' && (
                  <button
                    onClick={() => {
                      if (isHR) setDeptRole('HR');
                      else if (isDirector) setDeptRole('DIRECTOR');
                      else if (isAccounts) setDeptRole('ACCOUNTS');
                      setShowDeptModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <Building2 className="w-4 h-4" /> Add Departmental Review & Sign-off
                  </button>
                )}

                {/* 1. Submit / Edit Post-Event Outcome Report Form */}
                {(selectedRequest.submitted_by_id === user?.id || isSuperAdmin) && (
                  <button
                    onClick={() => openReportModal(selectedRequest)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <Camera className="w-4 h-4" /> {selectedRequest.report_summary ? 'Edit Post-Event Report' : 'Submit Post-Event Report'}
                  </button>
                )}

                {/* 2. Formal Application Form (Print / Word Export) */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 shadow-md"
                >
                  <FileText className="w-4 h-4 text-orange-400" /> Application Form (Print / Word)
                </button>

                {/* 3. Post-Event Outcome Report (Print / Word Export) */}
                {(selectedRequest.report_summary || selectedRequest.report_submitted_at) && (
                  <button
                    onClick={() => openPrintReportModal(selectedRequest)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs transition-all border border-teal-600 shadow-md"
                  >
                    <Award className="w-4 h-4 text-emerald-300" /> Event Outcome Report (Print / Word)
                  </button>
                )}
              </div>

              {/* Post-Event Outcome Report Card (if submitted) */}
              {selectedRequest.report_summary && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" /> Post-Event Outcome & Completion Report
                    </h5>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Submitted on {selectedRequest.report_submitted_at ? new Date(selectedRequest.report_submitted_at).toLocaleDateString() : 'Recorded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-semibold bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-slate-500 font-normal">Event Date:</span> {selectedRequest.report_event_date || 'N/A'}
                    </div>
                    <div>
                      <span className="text-slate-500 font-normal">Attendance:</span> {selectedRequest.report_participants_count || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-0.5">Executive Summary & Highlights:</span>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedRequest.report_summary}</p>
                  </div>

                  {selectedRequest.report_outcomes && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-0.5">Key Learning Outcomes:</span>
                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedRequest.report_outcomes}</p>
                    </div>
                  )}

                  {/* UN SDGs Mapping below Outcomes */}
                  {(() => {
                    const sdgs = getMappedSDGs(selectedRequest);
                    return (
                      <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                        <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider block">
                          Sustainable Development Goals:
                        </span>
                        <div className="flex flex-wrap gap-2.5 pt-0.5">
                          {sdgs.map((sdg) => (
                            <a
                              key={sdg.id}
                              href={sdg.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative rounded-xl overflow-hidden border border-slate-300 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all"
                              title={`SDG ${sdg.id}: ${sdg.name}`}
                            >
                              <img src={sdg.iconUrl} alt={`SDG ${sdg.id} ${sdg.name}`} className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Photos Grid Preview */}
                  {(() => {
                    let photos: any[] = [];
                    try {
                      photos = typeof selectedRequest.report_photos === 'string' ? JSON.parse(selectedRequest.report_photos) : selectedRequest.report_photos;
                    } catch (e) {
                      photos = [];
                    }
                    if (!photos || photos.length === 0) return null;
                    return (
                      <div className="pt-2 space-y-1.5 border-t border-emerald-200/60">
                        <span className="text-[11px] font-bold text-slate-700 block">Event Photographs ({photos.length}):</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {photos.map((p, idx) => (
                            <div key={idx} className="group relative rounded-xl border-2 border-slate-800 bg-white p-1 shadow-sm text-center">
                              <img src={p.url} alt={p.caption} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                              <p className="text-[10px] font-bold text-slate-800 truncate mt-1 px-1">{p.caption || `Photo ${idx+1}`}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Departmental Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">HR Department</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedRequest.hr_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {selectedRequest.hr_status || 'PENDING'}
                    </span>
                  </div>
                  {selectedRequest.hr_comments && (
                    <p className="text-xs text-slate-600 italic line-clamp-2">"{selectedRequest.hr_comments}"</p>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Director</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedRequest.director_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {selectedRequest.director_status || 'PENDING'}
                    </span>
                  </div>
                  {selectedRequest.director_comments && (
                    <p className="text-xs text-slate-600 italic line-clamp-2">"{selectedRequest.director_comments}"</p>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Accounts Dept</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedRequest.accounts_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {selectedRequest.accounts_status || 'PENDING'}
                    </span>
                  </div>
                  {selectedRequest.accounts_comments && (
                    <p className="text-xs text-slate-600 italic line-clamp-2">"{selectedRequest.accounts_comments}"</p>
                  )}
                </div>
              </div>

              {/* Discussion & Audit Trail Thread */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" /> Discussion & Audit Log
                </h4>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {selectedRequest.comments?.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-800">
                          {c.author_name} ({c.author_role})
                        </span>
                        <span className="text-[10px]">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{c.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Add General Comment Input */}
                <form onSubmit={handlePostGeneralComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newDiscussionComment}
                    onChange={(e) => setNewDiscussionComment(e.target.value)}
                    placeholder="Type a comment or question..."
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE REQUISITION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING GUEST PROGRAM</h3>
                <p className="text-xs text-slate-500">Sanskrithi School of Engineering Official Requisition Form</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Quick Fill Sample Button */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-orange-950 font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-orange-500" /> Pre-fill 22 March 2024 SSE Guest Lecture Data
                </span>
                <p className="text-[11px] text-slate-600">Populates Dr. R. Nithya, Dr. Padmasuvarna, JNTU Anantapur, HAS Dept, Rs. 6000</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewTitle('APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING ONE DAY GUEST PROGRAM ON 22 MARCH 2024');
                  setNewCategory('Guest Program / Lecture');
                  setNewDept('HAS');
                  setF1OrgSecretary('Dr. R. Nithya, Associate Professor');
                  setF2Dept('HAS');
                  setF3Theme('Guest Lecture');
                  setF4TargetGroup('HAS Faculties, all First Year Students');
                  setF5ResourcePerson('Dr. Padmasuvarna');
                  setF6Affiliation('Professor, Department of Physics, Jawaharlal Nehru Technological University Anantapur, Andhra Pradesh');
                  setF7Level('State Level');
                  setF8Duration('Half Day');
                  setF9PastPrograms('Organized 2 FDPs and 1 National Seminar in the last academic year');
                  setF10LocalPart('First Year Students & HAS Faculty');
                  setF10OutstationPart('NIL');
                  setF11TaDa('NIL');
                  setF11Honorarium('5000');
                  setF11Misc('1000');
                  setF11Total('6000');
                  setF12AssistanceSought('6000');
                  setF13OtherSources('NIL (External Sponsors: NIL, Registration Fees: NIL)');
                  setF14ImportanceNote('Guest Lecture on Physics & Engineering applications essential for first-year students foundational growth.');
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold transition-all shadow-sm"
              >
                Auto-Fill Sample Form
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Application Title / Heading</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING ONE DAY GUEST PROGRAM ON 22 MARCH 2024"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* 1. Organizing Secretary */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">1. Name & Address of Organizing Secretary of FDP/Program</label>
                <input
                  type="text"
                  required
                  value={f1OrgSecretary}
                  onChange={(e) => setF1OrgSecretary(e.target.value)}
                  placeholder="e.g. Dr. R. Nithya, Associate Professor"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* 2 & 3. Department & Theme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">2. Department</label>
                  <input
                    type="text"
                    required
                    value={f2Dept}
                    onChange={(e) => {
                      setF2Dept(e.target.value);
                      setNewDept(e.target.value);
                    }}
                    placeholder="e.g. HAS (Humanities & Sciences)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">3. Theme(s) of the FDP / Program</label>
                  <input
                    type="text"
                    required
                    value={f3Theme}
                    onChange={(e) => setF3Theme(e.target.value)}
                    placeholder="e.g. Guest Lecture"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* 4. Target Group */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">4. Target Group</label>
                <input
                  type="text"
                  required
                  value={f4TargetGroup}
                  onChange={(e) => setF4TargetGroup(e.target.value)}
                  placeholder="e.g. HAS Faculties, all First Year Students"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* 5 & 6. Resource Person & Affiliation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">5. Name(s) of Resource Person(s)</label>
                  <input
                    type="text"
                    required
                    value={f5ResourcePerson}
                    onChange={(e) => setF5ResourcePerson(e.target.value)}
                    placeholder="e.g. Dr. Padmasuvarna"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">6. Affiliation of Resource Person</label>
                  <input
                    type="text"
                    required
                    value={f6Affiliation}
                    onChange={(e) => setF6Affiliation(e.target.value)}
                    placeholder="e.g. Professor, Dept of Physics, JNTU Anantapur"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* 7 & 8. Level & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">7. Level of Expert Lecture</label>
                  <select
                    value={f7Level}
                    onChange={(e) => setF7Level(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="State Level">State Level</option>
                    <option value="Regional Level">Regional Level</option>
                    <option value="National Level">National Level</option>
                    <option value="International Level">International Level</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">8. Duration of Programme</label>
                  <select
                    value={f8Duration}
                    onChange={(e) => setF8Duration(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Half Day">Half Day</option>
                    <option value="1 Day">1 Day</option>
                    <option value="2 Days">2 Days</option>
                  </select>
                </div>
              </div>

              {/* 9. Past Programmes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">9. Details of Programmes Organized During Last 1 Year</label>
                <input
                  type="text"
                  value={f9PastPrograms}
                  onChange={(e) => setF9PastPrograms(e.target.value)}
                  placeholder="e.g. Organized 2 FDPs under Department auspices"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* 10. Participants Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">10a. Local Participants Expected</label>
                  <input
                    type="text"
                    value={f10LocalPart}
                    onChange={(e) => setF10LocalPart(e.target.value)}
                    placeholder="e.g. All First Year Students"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">10b. Outstation Participants Expected</label>
                  <input
                    type="text"
                    value={f10OutstationPart}
                    onChange={(e) => setF10OutstationPart(e.target.value)}
                    placeholder="e.g. NIL"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* 11. Estimated Expenditure */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs">11. Estimated Expenditure Breakdown</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TA & DA</label>
                    <input
                      type="text"
                      value={f11TaDa}
                      onChange={(e) => setF11TaDa(e.target.value)}
                      placeholder="NIL"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Honorarium to Resource Persons (₹)</label>
                    <input
                      type="number"
                      value={f11Honorarium}
                      onChange={(e) => {
                        setF11Honorarium(e.target.value);
                        calculateTotalExp(e.target.value, f11Misc);
                      }}
                      placeholder="5000"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Miscellaneous (₹)</label>
                    <input
                      type="number"
                      value={f11Misc}
                      onChange={(e) => {
                        setF11Misc(e.target.value);
                        calculateTotalExp(f11Honorarium, e.target.value);
                      }}
                      placeholder="1000"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-800">Total Estimated Expenditure:</span>
                  <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                    ₹{f11Total}
                  </span>
                </div>
              </div>

              {/* 12 & 13. Financial Assistance & Other Sources */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">12. Financial Assistance Sought (₹)</label>
                  <input
                    type="number"
                    value={f12AssistanceSought}
                    onChange={(e) => setF12AssistanceSought(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">13. Expected from Other Sources</label>
                  <input
                    type="text"
                    value={f13OtherSources}
                    onChange={(e) => setF13OtherSources(e.target.value)}
                    placeholder="e.g. NIL / Sponsors"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* 14. Importance Note */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">14. Enclose a Brief Note About Importance of Program</label>
                <textarea
                  rows={3}
                  required
                  value={f14ImportanceNote}
                  onChange={(e) => setF14ImportanceNote(e.target.value)}
                  placeholder="Explain why this guest program is essential..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  Submit Application to Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINCIPAL ACTION MODAL */}
      {showPrincipalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Principal Review & Decision</h3>
              <button onClick={() => setShowPrincipalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handlePrincipalActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Decision</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrincipalActionType('APPROVE')}
                    className={`py-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                      principalActionType === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrincipalActionType('REQUEST_CHANGES')}
                    className={`py-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                      principalActionType === 'REQUEST_CHANGES'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" /> Request Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrincipalActionType('REJECT')}
                    className={`py-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                      principalActionType === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Principal Comments & Instructions {principalActionType === 'REQUEST_CHANGES' && <span className="text-orange-500">*</span>}
                </label>
                <textarea
                  rows={4}
                  value={principalComment}
                  onChange={(e) => setPrincipalComment(e.target.value)}
                  placeholder={
                    principalActionType === 'REQUEST_CHANGES'
                      ? 'Specify what changes or additional budget details are required from the HOD...'
                      : 'Optional comments or notes...'
                  }
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPrincipalModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT ACTION MODAL (HR, DIRECTOR, ACCOUNTS) */}
      {showDeptModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Departmental Review & Sign-off</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDeptActionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department Role</label>
                  <select
                    value={deptRole}
                    onChange={(e: any) => setDeptRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  >
                    <option value="HR">HR Department</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="ACCOUNTS">Accounts Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sign-off Status</label>
                  <select
                    value={deptActionType}
                    onChange={(e: any) => setDeptActionType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  >
                    <option value="APPROVED">Approved & Verified</option>
                    <option value="NEEDS_INFO">Needs Information</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departmental Review Comments</label>
                <textarea
                  rows={4}
                  required
                  value={deptComment}
                  onChange={(e) => setDeptComment(e.target.value)}
                  placeholder="Enter HR / Director / Accounts departmental comments, budget code allocations, or clearance notes..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Submit Department Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOD RESUBMIT MODAL */}
      {showResubmitModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Revise & Resubmit Application</h3>
              <button onClick={() => setShowResubmitModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleResubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Application Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Updated Budget / Expenditure (₹)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Updated 14-Point Details & Revisions</label>
                <textarea
                  rows={6}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resubmission Response to Principal Comments</label>
                <input
                  type="text"
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Explain how Principal feedback was addressed..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md"
                >
                  Resubmit to Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMAL 14-POINT SANSKRITHI SCHOOL OF ENGINEERING PRINT MODAL */}
      {showPrintModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="w-full max-w-4xl h-[92vh] max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 flex flex-col space-y-4 overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-200 shrink-0 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-800">Official Financial Assistance Application (14-Point SSE Format)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadPDF('printable-application-body', `${selectedRequest.request_number || 'Requisition'}_Application.pdf`)}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    onClick={() => exportApplicationToWord(selectedRequest)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <FileDown className="w-4 h-4" /> Export Word (.doc)
                  </button>
                  <button
                    onClick={() => handlePrintApplication(selectedRequest)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* PDF Customization Settings Bar */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-xs tracking-wide uppercase text-slate-200">PDF Document Formatting Controls</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPdfSettings(!showPdfSettings)}
                    className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 transition-all"
                  >
                    {showPdfSettings ? 'Collapse Options ▲' : 'Customize PDF Options (Margins, Watermark, Header) ▼'}
                  </button>
                </div>

                {showPdfSettings && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                    {/* Margins */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">A4 Page Margins</label>
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                        {(['narrow', 'normal', 'wide'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPdfMargin(m)}
                            className={`flex-1 py-1 text-[11px] font-bold rounded-md capitalize transition-all ${
                              pdfMargin === m ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m} ({m === 'narrow' ? '5mm' : m === 'wide' ? '15mm' : '10mm'})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Watermark Toggle & Preset */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-300">Watermark Overlay</label>
                        <button
                          type="button"
                          onClick={() => setPdfShowWatermark(!pdfShowWatermark)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${pdfShowWatermark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {pdfShowWatermark ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                      {pdfShowWatermark && (
                        <select
                          value={pdfWatermarkText}
                          onChange={(e) => setPdfWatermarkText(e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold"
                        >
                          <option value="OFFICIAL COPY">OFFICIAL COPY</option>
                          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                          <option value="SANCTIONED & APPROVED">SANCTIONED & APPROVED</option>
                          <option value="SSE PUTTAPARTHI">SSE PUTTAPARTHI</option>
                          <option value="FOR COLLEGE RECORD ONLY">FOR COLLEGE RECORD ONLY</option>
                        </select>
                      )}
                    </div>

                    {/* Toggles (Header & Footer) */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Visibility Controls</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfShowHeader(!pdfShowHeader)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            pdfShowHeader ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {pdfShowHeader ? '✓ Header Visible' : '✗ Header Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfShowFooter(!pdfShowFooter)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            pdfShowFooter ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {pdfShowFooter ? '✓ Signatures On' : '✗ Signatures Off'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Document Body Wrapper */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div
                id="printable-application-body"
                className={`relative space-y-6 text-slate-900 text-xs font-sans rounded-none bg-white leading-relaxed shadow-none border-0 ${
                  pdfMargin === 'narrow' ? 'p-4' : pdfMargin === 'wide' ? 'p-10 sm:p-12' : 'p-6 sm:p-8'
                }`}
              >
              {/* Watermark Overlay */}
              {pdfShowWatermark && pdfWatermarkText && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 overflow-hidden z-0 select-none">
                  <span className="text-6xl sm:text-7xl font-black tracking-widest text-slate-900 -rotate-45 uppercase text-center whitespace-nowrap">
                    {pdfWatermarkText}
                  </span>
                </div>
              )}

              {/* Header with College Logo */}
              {pdfShowHeader && (
                <div className="flex flex-col items-center justify-center text-center pb-4 border-b-2 border-slate-900 space-y-2 relative z-10">
                  <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-14 sm:h-16 w-auto object-contain max-w-full" />
                  <p className="text-[11px] sm:text-xs text-slate-700 font-semibold">Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 italic">Affiliated to JNTUA & Approved by AICTE | Accredited by NAAC | www.sseptp.org</p>
                </div>
              )}

              {/* Title */}
              <div className="text-center font-bold uppercase text-xs sm:text-sm tracking-wider py-3 bg-slate-50 border-y border-slate-300 rounded-lg relative z-10">
                {selectedRequest.title || 'APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING GUEST PROGRAM'}
              </div>

              {/* 14-Point Table Format */}
              <table className="w-full border-collapse border border-slate-400 text-xs my-4 relative z-10">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/2 p-2.5 font-semibold border-r border-slate-300 bg-slate-50">1. Name & address of Organizing Secretary of FDP/Program:</td>
                    <td className="w-1/2 p-2.5 font-bold text-slate-900">{selectedRequest.submitted_by_name} ({selectedRequest.department})</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">2. Department under auspices of which lecture is proposed:</td>
                    <td className="p-2.5 font-bold text-slate-900">{selectedRequest.department}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">3. Theme(s) of the FDP/Program:</td>
                    <td className="p-2.5">{selectedRequest.category}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">4. Target Group:</td>
                    <td className="p-2.5">HAS Faculties, all First Year Students</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">5. Name(s) & Affiliation of Resource Person(s):</td>
                    <td className="p-2.5 font-semibold">Dr. Padmasuvarna, Professor, Dept of Physics, JNTU Anantapur</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">6. Level of Expert Lecture:</td>
                    <td className="p-2.5">State / Regional Level</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">7. Duration of Programme:</td>
                    <td className="p-2.5">Half Day</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">8. Estimated Expenditure Breakdown:</td>
                    <td className="p-2.5 font-mono">
                      Honorarium: Rs. 5000<br />
                      Miscellaneous: Rs. 1000<br />
                      <strong className="text-emerald-700">Total Expenditure: Rs. {selectedRequest.amount || 6000}</strong>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">9. Requisition Description & Details:</td>
                    <td className="p-2.5 whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-semibold border-r border-slate-300 bg-slate-50">10. Principal Review Status:</td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {selectedRequest.status} {selectedRequest.principal_comments ? `(${selectedRequest.principal_comments})` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signature Line Blocks */}
              {pdfShowFooter && (
                <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold pt-12 mt-8 font-sans border-t border-slate-300 relative z-10" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div>
                    <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">Signed digitally</div>
                    <p className="pt-2">Signature of Organizing Secretary</p>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">
                      {selectedRequest.principal_action_at ? `Approved on ${new Date(selectedRequest.principal_action_at).toLocaleDateString()}` : 'Pending Principal Signature'}
                    </div>
                    <p className="pt-2">Signature of Principal</p>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">
                      {selectedRequest.status === 'FULLY_APPROVED' ? 'Verified & Signed' : 'Pending Clearance'}
                    </div>
                    <p className="pt-2">Signature of Chairman</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* POST-EVENT OUTCOME REPORT FORM MODAL */}
      {showReportModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 my-auto overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" /> Post-Event Outcome & Completion Report
                </h3>
                <p className="text-xs text-slate-500">
                  Submit program outcomes, participant count, and event photographs for <span className="font-bold text-slate-800">{selectedRequest.request_number}</span>
                </p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Quick Fill Sample Button */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-emerald-950 font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Pre-fill Sample Report & Photos
                </span>
                <p className="text-[11px] text-slate-600">Populates event date, 145 attendees, summary, learning outcomes, & 4 sample event photos with captions</p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillSampleReport}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-sm shrink-0"
              >
                Auto-Fill Sample Report
              </button>
            </div>

            <form onSubmit={handleSaveReportSubmit} className="space-y-4 text-xs">
              {/* Custom Report Title & Main Heading Customization Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> Custom Report Title & Main Heading
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Event / Report Title</label>
                    <input
                      type="text"
                      value={reportCustomTitle}
                      onChange={(e) => setReportCustomTitle(e.target.value)}
                      placeholder={selectedRequest?.title || 'e.g. Guest Lecture on Physics & Engineering Applications'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Changes title on Cover Page, PDF & Word Export</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Report Heading / Banner</label>
                    <input
                      type="text"
                      value={reportCustomHeading}
                      onChange={(e) => setReportCustomHeading(e.target.value)}
                      placeholder="POST-EVENT OUTCOME & COMPLETION REPORT"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">e.g. FACULTY DEVELOPMENT PROGRAM OUTCOME REPORT</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Event Execution Date</label>
                  <input
                    type="text"
                    required
                    value={reportEventDate}
                    onChange={(e) => setReportEventDate(e.target.value)}
                    placeholder="e.g. 22 March 2024"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Resource Person (Optional)</label>
                  <input
                    type="text"
                    value={reportResourcePerson}
                    onChange={(e) => setReportResourcePerson(e.target.value)}
                    placeholder="e.g. Dr. A. Sharma (IIT Madras)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Total Attendance / Count</label>
                  <input
                    type="text"
                    required
                    value={reportParticipantsCount}
                    onChange={(e) => setReportParticipantsCount(e.target.value)}
                    placeholder="e.g. 145 Students & 12 Faculty"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Actual Expenditure (₹)</label>
                  <input
                    type="number"
                    required
                    value={reportActualExpenditure}
                    onChange={(e) => setReportActualExpenditure(e.target.value)}
                    placeholder="6000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Executive Summary & Highlights (~300 Words)</label>
                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateAISummaryAndOutcomes}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> Gemini AI Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Auto-Generate with Gemini AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={6}
                  required
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Enter a brief 2-3 line summary or click Auto-Generate to create a full ~300-word executive summary..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 leading-relaxed font-sans text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Tip: Fill 2-3 lines above and click <span className="font-bold text-emerald-700 font-sans">Auto-Generate</span> to expand it into a detailed ~300-word executive summary and key outcomes automatically!
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Key Outcomes & Feedback Received</label>
                  <button
                    type="button"
                    onClick={handleGenerateAISummaryAndOutcomes}
                    className="text-[10px] font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Auto-generate outcomes
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={reportOutcomes}
                  onChange={(e) => setReportOutcomes(e.target.value)}
                  placeholder="List key learning takeaways, feedback ratings, or follow-up actions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 leading-relaxed font-sans text-xs"
                />
              </div>

              {/* Event Photos Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-emerald-600" /> Event Photographs ({reportPhotos.length}/4 max)
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {reportPhotos.length >= 4 ? (
                      <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">Max 4 photos reached</span>
                    ) : (
                      `Can upload ${4 - reportPhotos.length} more photo(s)`
                    )}
                  </span>
                </div>

                {/* Photo Inputs */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upload Photo File (Max 4)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={reportPhotos.length >= 4}
                        onChange={handlePhotoFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Paste Image URL</label>
                      <input
                        type="url"
                        value={photoUrlInput}
                        disabled={reportPhotos.length >= 4}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder={reportPhotos.length >= 4 ? "Max 4 photos added" : "https://..."}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photoCaptionInput}
                      disabled={reportPhotos.length >= 4}
                      onChange={(e) => setPhotoCaptionInput(e.target.value)}
                      placeholder="Photo caption (e.g. Chief guest addressing students)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      disabled={reportPhotos.length >= 4}
                      onClick={handleAddPhotoFromUrl}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add URL Photo
                    </button>
                  </div>
                </div>

                {/* Attached Photos Thumbnail List with Caption Inputs */}
                {reportPhotos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {reportPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative border border-slate-300 bg-white p-2.5 rounded-xl shadow-xs flex items-center gap-2.5"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || `Photo ${index + 1}`}
                          className="w-14 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-600 font-bold">Photo {index + 1} Caption</span>
                            {!photo.caption?.trim() && (
                              <span className="text-amber-700 font-bold animate-pulse text-[9px] bg-amber-100 px-1.5 py-0.5 rounded">
                                Caption required
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={photo.caption}
                            placeholder={`Event Photo ${index + 1} (Enter caption...)`}
                            onChange={(e) => {
                              const updated = [...reportPhotos];
                              updated[index].caption = e.target.value;
                              setReportPhotos(updated);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded-lg border outline-none transition-all ${
                              !photo.caption?.trim()
                                ? 'border-2 border-amber-500 bg-amber-50 text-amber-900 placeholder-amber-600/75'
                                : 'border-slate-200 text-slate-800 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Save Post-Event Report with Photos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL POST-EVENT OUTCOME REPORT PRINT MODAL */}
      {showPrintReportModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="w-full max-w-4xl h-[92vh] max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 flex flex-col space-y-4 overflow-hidden">
            {/* Pinned Top Toolbar */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-200 shrink-0 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-800">Official Post-Event Outcome Report (with Photos)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadPDF('printable-report-body', `${selectedRequest.request_number || 'Report'}_Event_Outcome_Report.pdf`)}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    onClick={() => exportReportToWord(selectedRequest)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <FileDown className="w-4 h-4" /> Export Word (.doc)
                  </button>
                  <button
                    onClick={() => handlePrintReport(selectedRequest)}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPrintReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* PDF Customization Settings Bar */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-xs tracking-wide uppercase text-slate-200">PDF Report Formatting & Layout Controls</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPdfSettings(!showPdfSettings)}
                    className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 transition-all"
                  >
                    {showPdfSettings ? 'Collapse Options ▲' : 'Customize PDF Options (Margins, Watermark, Layout) ▼'}
                  </button>
                </div>

                {showPdfSettings && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
                    {/* Margins */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">A4 Page Margins</label>
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                        {(['narrow', 'normal', 'wide'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPdfMargin(m)}
                            className={`flex-1 py-1 text-[11px] font-bold rounded-md capitalize transition-all ${
                              pdfMargin === m ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m} ({m === 'narrow' ? '5mm' : m === 'wide' ? '15mm' : '10mm'})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Watermark Toggle & Preset */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-300">Watermark Overlay</label>
                        <button
                          type="button"
                          onClick={() => setPdfShowWatermark(!pdfShowWatermark)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${pdfShowWatermark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {pdfShowWatermark ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                      {pdfShowWatermark && (
                        <select
                          value={pdfWatermarkText}
                          onChange={(e) => setPdfWatermarkText(e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold"
                        >
                          <option value="OFFICIAL COPY">OFFICIAL COPY</option>
                          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                          <option value="SANCTIONED & APPROVED">SANCTIONED & APPROVED</option>
                          <option value="SSE PUTTAPARTHI">SSE PUTTAPARTHI</option>
                          <option value="FOR COLLEGE RECORD ONLY">FOR COLLEGE RECORD ONLY</option>
                        </select>
                      )}
                    </div>

                    {/* Photo Grid Layout */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Photo Gallery Layout</label>
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setPdfPhotoColumns('2')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                            pdfPhotoColumns === '2' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          2 Columns Grid
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfPhotoColumns('1')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                            pdfPhotoColumns === '1' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          1 Column Full
                        </button>
                      </div>
                    </div>

                    {/* Visibility Controls */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Visibility Controls</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfShowHeader(!pdfShowHeader)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            pdfShowHeader ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {pdfShowHeader ? '✓ Header On' : '✗ Header Off'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfShowFooter(!pdfShowFooter)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            pdfShowFooter ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {pdfShowFooter ? '✓ Signs On' : '✗ Signs Off'}
                        </button>
                      </div>
                    </div>

                    {/* Live Editable Title & Heading Controls */}
                    <div className="sm:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Report Event Title (Cover Page & Header)</label>
                        <input
                          type="text"
                          value={reportCustomTitle}
                          onChange={(e) => setReportCustomTitle(e.target.value)}
                          placeholder={selectedRequest?.title || "e.g. Guest Lecture on Physics & Engineering Applications"}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Report Main Heading / Banner</label>
                        <input
                          type="text"
                          value={reportCustomHeading}
                          onChange={(e) => setReportCustomHeading(e.target.value)}
                          placeholder="POST-EVENT OUTCOME & COMPLETION REPORT"
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Document Body Wrapper */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div
                id="printable-report-body"
                className={`relative space-y-6 text-slate-900 text-xs font-sans rounded-none bg-white leading-relaxed shadow-none border-0 ${
                  pdfMargin === 'narrow' ? 'p-4' : pdfMargin === 'wide' ? 'p-10 sm:p-12' : 'p-6 sm:p-8'
                }`}
              >
                    {/* Watermark Overlay */}
                    {pdfShowWatermark && pdfWatermarkText && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 overflow-hidden z-0 select-none">
                        <span className="text-6xl sm:text-7xl font-black tracking-widest text-slate-900 -rotate-45 uppercase text-center whitespace-nowrap">
                          {pdfWatermarkText}
                        </span>
                      </div>
                    )}

                    {/* PAGE 1: PROGRAM OVERVIEW, EXECUTIVE SUMMARY & KEY OUTCOMES */}
                    <div className="relative min-h-[780px] print:min-h-0 flex flex-col justify-between p-4 sm:p-6 bg-white shadow-none space-y-4">
                      <div className="space-y-3 relative z-10">
                        {/* Page 1 Header Bar */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                          <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-8 sm:h-10 w-auto object-contain" />
                          <span className="text-slate-700 font-bold text-xs uppercase tracking-wide">Department of {selectedRequest.department || 'Humanities & Sciences'}</span>
                        </div>

                        {/* DOCUMENT TITLE BLOCK */}
                        <div className="text-center space-y-1 py-0.5">
                          <h1 className="text-lg sm:text-xl font-black text-[#1a365d] uppercase tracking-wide" style={{ letterSpacing: '0.03em', fontFamily: "'Inter', sans-serif" }}>
                            {displayReportHeading}
                          </h1>
                          <div className="text-xs sm:text-sm font-bold text-slate-800">
                            {displayReportTitle}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 pt-0.5">
                            Event Date: {selectedRequest.report_event_date || '22 March 2024'} &bull; Year {selectedRequest.report_event_date ? selectedRequest.report_event_date.split(' ').pop() : '2024'}
                          </div>
                        </div>

                        {/* SECTION 1: PROGRAM OVERVIEW */}
                        <div className="mb-[10px]">
                          <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                            PROGRAM OVERVIEW
                          </h3>
                          <table className="w-full border-collapse border border-slate-200 text-xs shadow-none">
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="w-1/3 py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-200 text-[#1a365d]">Program / Event Title</td>
                                <td className="w-2/3 py-1.5 px-2.5 font-semibold text-slate-900">{displayReportTitle}</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-200 text-[#1a365d]">Organizing Department &amp; Secretary</td>
                                <td className="py-1.5 px-2.5 font-semibold text-slate-800">Department of {selectedRequest.department || 'Humanities & Sciences'} &middot; {selectedRequest.submitted_by_name}</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-200 text-[#1a365d]">Event Execution Date</td>
                                <td className="py-1.5 px-2.5 font-semibold text-slate-800">{selectedRequest.report_event_date || '22 March 2024'}</td>
                              </tr>
                              {(selectedRequest.report_resource_person || selectedRequest.resource_person || reportResourcePerson) && (
                                <tr className="border-b border-slate-200">
                                  <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-200 text-[#1a365d]">Resource Person / Speaker</td>
                                  <td className="py-1.5 px-2.5 font-semibold text-slate-800">{selectedRequest.report_resource_person || selectedRequest.resource_person || reportResourcePerson}</td>
                                </tr>
                              )}
                              <tr>
                                <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-200 text-[#1a365d]">Participants / Beneficiaries</td>
                                <td className="py-1.5 px-2.5 font-semibold text-slate-800">{selectedRequest.report_participants_count || '145 first-year students and 12 faculty members'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* SECTION 2: EXECUTIVE SUMMARY */}
                        <div className="mb-[10px]">
                          <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                            EXECUTIVE SUMMARY
                          </h3>
                          <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-normal pt-0.5 space-y-1">
                            {selectedRequest.report_summary || 'The Department conducted a program designed to introduce participants to physical principles and engineering applications. The session connected classroom concepts with practical considerations such as energy efficiency and system performance. With active student and faculty participation, the event provided a valuable platform for technical enrichment and academic engagement.'}
                          </div>
                        </div>

                        {/* SECTION 3: KEY OUTCOMES & LEARNING IMPACT */}
                        <div className="mb-[10px]" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                            KEY OUTCOMES &amp; LEARNING IMPACT
                          </h3>
                          <div className="space-y-1 pt-0.5">
                            {parseOutcomePoints(selectedRequest.report_outcomes).map((pt: string, idx: number) => {
                              const parts = pt.split(':');
                              const title = parts.length > 1 ? parts[0].trim() : `Outcome Point ${idx + 1}`;
                              const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : pt;
                              return (
                                <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-slate-100 last:border-b-0">
                                  <span className="text-[#1a365d] font-extrabold text-xs leading-none w-5 shrink-0 pt-0.5">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div>
                                    <span className="font-bold text-slate-900 text-xs mr-1">{title}:</span>
                                    <span className="text-slate-600 text-xs leading-snug">{desc}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Page 1 Centered Footer */}
                      <div className="pt-2 border-t border-slate-200 text-center font-extrabold text-[#1a365d] text-xs mt-auto">
                        1
                      </div>
                    </div>

                    {/* PAGE BREAK INDICATOR IN PREVIEW MODAL */}
                    <div className="py-2 flex items-center justify-center gap-2 border-y border-dashed border-slate-300 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg print:hidden">
                      <span>Page 1 (Overview, Summary &amp; Outcomes) &bull; Page 2 (SDGs, Photographs &amp; Signatures) Below</span>
                    </div>

                    {/* PAGE 2: SDG ALIGNMENT, PHOTOGRAPHS & SIGNATURES */}
                    <div className="relative min-h-[780px] print:min-h-[268mm] flex flex-col justify-between p-4 sm:p-6 bg-white shadow-none space-y-3 page-break-before-always" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                      <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-start">
                        {/* Page 2 Header Bar */}
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 text-xs">
                          <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-8 sm:h-10 w-auto object-contain" />
                          <span className="text-slate-800 font-extrabold text-xs uppercase tracking-wide">Department of {selectedRequest.department || 'Humanities & Sciences'}</span>
                        </div>

                        {/* SECTION 1: SUSTAINABLE DEVELOPMENT GOAL ALIGNMENT */}
                        <div className="pt-0.5 mb-1">
                          <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-2">
                            SUSTAINABLE DEVELOPMENT GOAL ALIGNMENT
                          </h3>
                          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                            {getMappedSDGs(selectedRequest).map((sdg) => (
                              <a
                                key={sdg.id}
                                href={sdg.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 transition-transform hover:scale-105"
                              >
                                <img
                                  src={sdg.iconUrl}
                                  alt={`${sdg.code}: ${sdg.name}`}
                                  className="report-sdg-img w-16 h-16 sm:w-[68px] sm:h-[68px] print:w-[64px] print:h-[64px] rounded-lg object-contain shadow-xs"
                                  style={{ width: '64px', height: '64px' }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* SECTION 2: EVENT PHOTOGRAPHS (Right below SDG Alignment) */}
                        {(() => {
                          let photos: any[] = [];
                          try {
                            photos = typeof selectedRequest.report_photos === 'string' ? JSON.parse(selectedRequest.report_photos) : selectedRequest.report_photos;
                          } catch (e) {
                            photos = [];
                          }
                          const defaultPhotos = [
                            { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop', caption: 'Chief Guest Address' },
                            { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop', caption: 'Interactive Session with Students' }
                          ];
                          const displayPhotos = (photos && photos.length > 0 ? photos : defaultPhotos).slice(0, 4);

                          if (displayPhotos.length > 0) {
                            return (
                              <div className="pt-1 mb-1">
                                <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-2">
                                  EVENT PHOTOGRAPHS &amp; VISUAL EVIDENCE
                                </h3>
                                <div className="report-photo-grid grid grid-cols-2 gap-3 pt-0.5 w-full justify-center">
                                  {displayPhotos.map((photo: any, index: number) => (
                                    <div key={index} className="report-photo-item text-center flex flex-col items-center">
                                      <div className="w-full h-[150px] bg-slate-50 rounded-lg overflow-hidden shadow-xs flex items-center justify-center">
                                        <img
                                          src={photo.url}
                                          alt={photo.caption || `Photo ${index + 1}`}
                                          className="report-photo-img w-full h-[150px] object-cover rounded-lg"
                                          style={{ height: '150px', maxHeight: '150px' }}
                                        />
                                      </div>
                                      <p className="report-caption text-[10px] sm:text-[11px] font-semibold italic text-slate-700 pt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                                        {photo.caption?.trim() ? photo.caption.trim() : `Event Photo ${index + 1}`}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* SECTION 3: SOCIAL MEDIA & DIGITAL COVERAGE */}
                        <div className="pt-1 mb-1">
                          <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-1.5">
                            SOCIAL MEDIA &amp; DIGITAL COVERAGE
                          </h3>
                          <div className="pt-0.5 text-left">
                            <span className="font-bold text-[#1a365d] text-xs mr-1.5" style={{ fontFamily: 'Cambria, Georgia, serif' }}>LinkedIn Post URL:</span>
                            <a
                              href={selectedRequest.report_linkedin_url || selectedRequest.linkedin_url || 'https://www.linkedin.com/school/sanskrithi-school-of-engineering'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-medium text-xs inline-flex items-center gap-1"
                              style={{ fontFamily: 'Cambria, Georgia, serif' }}
                            >
                              <span>{selectedRequest.report_linkedin_url || selectedRequest.linkedin_url || 'https://www.linkedin.com/school/sanskrithi-school-of-engineering'}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 print:hidden" />
                            </a>
                          </div>
                        </div>

                        {/* SECTION 3: OFFICIAL SIGNATURES - Pinned at bottom of page 2 */}
                        <div className="report-signatures-grid pt-6 pb-2 flex flex-row justify-between text-center mt-auto w-full">
                          <div className="report-signature-col flex-1 space-y-1">
                            <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                              {selectedRequest.submitted_by_name || 'Faculty Coordinator'}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">Event Convener</div>
                          </div>

                          <div className="report-signature-col flex-1 space-y-1">
                            <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                              Head of Department
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">Department of {selectedRequest.department}</div>
                          </div>

                          <div className="report-signature-col flex-1 space-y-1">
                            <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                              Principal
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">Sanskrithi School of Engineering</div>
                          </div>
                        </div>
                      </div>

                      {/* Page 2 Centered Footer */}
                      <div className="pt-2 border-t border-slate-200 text-center font-extrabold text-[#1a365d] text-xs mt-auto">
                        2
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};
