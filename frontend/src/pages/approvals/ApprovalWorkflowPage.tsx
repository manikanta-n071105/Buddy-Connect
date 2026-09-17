import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
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
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';

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

  const [reportEventDate, setReportEventDate] = useState('');
  const [reportParticipantsCount, setReportParticipantsCount] = useState('');
  const [reportActualExpenditure, setReportActualExpenditure] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportOutcomes, setReportOutcomes] = useState('');
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

  // Photo Attachment Handlers
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setReportPhotos((prev) => [
            ...prev,
            { url: base64Url, caption: photoCaptionInput.trim() || file.name.replace(/\.[^/.]+$/, '') }
          ]);
          setPhotoCaptionInput('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotoFromUrl = () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter image URL or select a photo file');
      return;
    }
    setReportPhotos((prev) => [
      ...prev,
      { url: photoUrlInput.trim(), caption: photoCaptionInput.trim() || 'Event Photo' }
    ]);
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setReportPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoFillSampleReport = () => {
    setReportEventDate('22 March 2024');
    setReportParticipantsCount('145 First-Year Students & 12 Faculty Members');
    setReportActualExpenditure('6000');
    setReportSummary(
      'The One-Day Guest Lecture on "Physics & Engineering Applications" was conducted successfully at SSE Main Auditorium. Chief Guest Dr. Padmasuvarna delivered an insightful keynote on quantum mechanics, semiconductor physics, and modern engineering applications.'
    );
    setReportOutcomes(
      '1. Students gained deep clarity on physics concepts applied in semiconductor manufacturing.\n2. Interactive Q&A session addressed career prospects in R&D and higher studies.\n3. Outstanding student feedback rating of 4.8/5.0.'
    );
    setReportPhotos([
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
        caption: 'Chief Guest Dr. Padmasuvarna inaugurating the Guest Program'
      },
      {
        url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop',
        caption: 'HOD presenting memento & felicitation to Resource Person'
      },
      {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        caption: 'Interactive Q&A Session with First Year Students'
      },
      {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        caption: 'Group photo of Faculty Organizers with Dr. Padmasuvarna'
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
        reportActualExpenditure: parseFloat(reportActualExpenditure) || selectedRequest.amount,
        reportPhotos
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

    // Convert uploaded college header logo to Base64 so Word displays it offline & reliably
    const logoBase64 = await fetchAsBase64('/assets/sse-header-logo.png');

    let photos = [];
    try {
      photos = typeof req.report_photos === 'string' ? JSON.parse(req.report_photos) : req.report_photos;
    } catch (e) {
      photos = [];
    }

    // Convert photo URLs to Base64 if needed for offline Word rendering
    const processedPhotos = await Promise.all(
      (photos || []).map(async (p: any) => {
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

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${req.title || 'Event Completion Report'}</title>
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
          <div style="text-align: center; margin-bottom: 10pt; border-bottom: 2pt solid #0f172a; padding-bottom: 8pt;">
            <img src="${logoBase64}" width="480" alt="Sanskrithi School of Engineering Logo" style="max-width: 100%; width: 480px; height: auto; display: block; margin: 0 auto;" />
            <div style="font-size: 9.5pt; font-weight: bold; color: #334155; margin-top: 6pt; text-align: center;">
              Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134
            </div>
            <div style="font-size: 8.5pt; color: #64748b; font-style: italic; margin-top: 2pt; text-align: center;">
              Affiliated to JNTUA & Approved by AICTE | Accredited by NAAC | www.sseptp.org
            </div>
          </div>

          <div class="banner">POST-EVENT OUTCOME & COMPLETION REPORT</div>

          <table>
            <tr>
              <td style="width: 32%; font-weight: bold; background-color: #f1f5f9;">Program / Event Title:</td>
              <td style="width: 68%; font-weight: bold; color: #0f172a;">${req.title}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">Organizing Department & Secretary:</td>
              <td>${req.submitted_by_name} (${req.department} Dept)</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f1f5f9;">Event Execution Date:</td>
              <td>${req.report_event_date || '22 March 2024'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f8fafc;">Total Participants / Beneficiaries:</td>
              <td>${req.report_participants_count || '145 Students & 12 Faculty'}</td>
            </tr>
          </table>

          <div class="section-heading">Executive Summary & Highlights of the Program</div>
          <div class="text-box">
            ${req.report_summary || 'The program was executed successfully as per approved requisition schedule.'}
          </div>

          ${
            outcomeList.length > 0
              ? `
            <div class="section-heading">Key Outcomes & Learning Impact</div>
            <div class="text-box">
              <ol style="margin: 0; padding-left: 18pt; font-size: 10pt; line-height: 1.6; color: #0f172a;">
                ${outcomeList.map((pt) => `<li style="margin-bottom: 4pt; font-weight: 500;">${pt}</li>`).join('')}
              </ol>
            </div>
          `
              : ''
          }

          ${photosHTML}

          <table style="width: 100%; border: none; margin-top: 35pt; page-break-inside: avoid;" class="no-border">
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

  const handlePrintReport = (req: any) => {
    const printElement = document.getElementById('printable-report-body');
    if (!printElement) {
      toast.error('Printable report content not found');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (!printWin) {
      toast.error('Pop-up blocker prevented opening print window. Please allow pop-ups.');
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${req?.title || 'Post-Event Outcome Report'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 15px;
              color: #0f172a;
              background: #ffffff;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 100%;">
            ${printElement.outerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintApplication = (req: any) => {
    const printElement = document.getElementById('printable-application-body');
    if (!printElement) {
      toast.error('Printable application content not found');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (!printWin) {
      toast.error('Pop-up blocker prevented opening print window. Please allow pop-ups.');
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${req?.title || 'Financial Assistance Application'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 15px;
              color: #0f172a;
              background: #ffffff;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 100%;">
            ${printElement.outerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
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
            margin: 10mm;
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

                {/* Submit / Edit Post-Event Outcome Report Button */}
                {(selectedRequest.submitted_by_id === user?.id || isSuperAdmin) && (
                  <button
                    onClick={() => openReportModal(selectedRequest)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    <Camera className="w-4 h-4" /> {selectedRequest.report_summary ? 'Edit Post-Event Report & Photos' : 'Submit Event Outcome Report & Photos'}
                  </button>
                )}

                {/* Print Post-Event Outcome Report (with Photos) */}
                {(selectedRequest.report_summary || selectedRequest.report_submitted_at) && (
                  <button
                    onClick={() => setShowPrintReportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs transition-all border border-teal-500 shadow-md"
                  >
                    <Printer className="w-4 h-4 text-teal-300" /> Print Outcome Report (with Photos)
                  </button>
                )}

                {/* Export Outcome Report to Word (.doc) */}
                {(selectedRequest.report_summary || selectedRequest.report_submitted_at) && (
                  <button
                    onClick={() => exportReportToWord(selectedRequest)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-all border border-blue-500 shadow-md"
                  >
                    <FileDown className="w-4 h-4 text-blue-200" /> Export Outcome Report (Word .doc)
                  </button>
                )}

                {/* Print Official Format */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20"
                >
                  <Printer className="w-4 h-4" /> Print Formal Application
                </button>

                {/* Export Application to Word (.doc) */}
                <button
                  onClick={() => exportApplicationToWord(selectedRequest)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-600 shadow-md"
                >
                  <FileDown className="w-4 h-4 text-amber-400" /> Export Application (Word .doc)
                </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-auto overflow-y-auto flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-bold text-sm text-slate-800">Official Financial Assistance Application (14-Point SSE Format)</span>
              </div>
              <div className="flex gap-2">
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
                  <Printer className="w-4 h-4" /> Print Form
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Printable Form Body - Word-for-Word SSE Layout */}
            <div id="printable-application-body" className="space-y-6 text-slate-900 text-xs font-sans p-6 sm:p-8 border border-slate-300 rounded-2xl bg-white leading-relaxed shadow-sm">
              {/* Header with College Logo */}
              <div className="flex flex-col items-center justify-center text-center pb-4 border-b-2 border-slate-900 space-y-2">
                <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-14 sm:h-16 w-auto object-contain max-w-full" />
                <p className="text-[11px] sm:text-xs text-slate-700 font-semibold">Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                <p className="text-[10px] sm:text-[11px] text-slate-600 italic">Affiliated to JNTUA & Approved by AICTE | Accredited by NAAC | www.sseptp.org</p>
              </div>

              {/* Title */}
              <div className="text-center font-bold uppercase text-xs sm:text-sm tracking-wider py-3 bg-slate-50 border-y border-slate-300 rounded-lg">
                {selectedRequest.title || 'APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING GUEST PROGRAM'}
              </div>

              {/* 14-Point Table Format */}
              <table className="w-full border-collapse border border-slate-400 text-xs my-4">
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
              <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold pt-12 mt-8 font-sans border-t border-slate-300">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className="block font-bold text-slate-800 mb-1">Executive Summary & Highlights</label>
                <textarea
                  rows={4}
                  required
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Provide a detailed overview of the program execution, guest sessions, and student participation..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Key Outcomes & Feedback Received</label>
                <textarea
                  rows={3}
                  value={reportOutcomes}
                  onChange={(e) => setReportOutcomes(e.target.value)}
                  placeholder="List key learning takeaways, feedback ratings, or follow-up actions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 leading-relaxed"
                />
              </div>

              {/* Event Photos Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-emerald-600" /> Event Photos Gallery ({reportPhotos.length})
                  </label>
                  <span className="text-[10px] text-slate-500">Upload photos or paste URLs</span>
                </div>

                {/* Photo Inputs */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upload Photo File</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Paste Image URL</label>
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photoCaptionInput}
                      onChange={(e) => setPhotoCaptionInput(e.target.value)}
                      placeholder="Photo caption (e.g. Chief guest addressing students)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoFromUrl}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add URL Photo
                    </button>
                  </div>
                </div>

                {/* Attached Photos Thumbnail List with Neat Borders */}
                {reportPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {reportPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative border-2 border-slate-800 bg-white p-2 rounded-xl shadow-md flex flex-col items-center justify-between text-center"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 shadow transition-all z-10"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                        <p className="mt-1.5 text-[10px] font-bold text-slate-800 line-clamp-1 w-full italic">
                          {photo.caption || `Photo ${index + 1}`}
                        </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-auto overflow-y-auto flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm text-slate-800">Official Post-Event Outcome Report (with Photos)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReportToWord(selectedRequest)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                >
                  <FileDown className="w-4 h-4" /> Export Word (.doc)
                </button>
                <button
                  onClick={() => handlePrintReport(selectedRequest)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Event Report
                </button>
                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div id="printable-report-body" className="space-y-6 text-slate-900 text-xs font-sans p-6 sm:p-8 border border-slate-300 rounded-2xl bg-white leading-relaxed shadow-sm">
              {/* Header with College Logo */}
              <div className="flex flex-col items-center justify-center text-center pb-4 border-b-2 border-slate-900 space-y-2">
                <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-14 sm:h-16 w-auto object-contain max-w-full" />
                <p className="text-[11px] sm:text-xs text-slate-700 font-semibold">Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                <p className="text-[10px] sm:text-[11px] text-slate-600 italic">Affiliated to JNTUA & Approved by AICTE | Accredited by NAAC | www.sseptp.org</p>
              </div>

              {/* Document Title Banner */}
              <div className="bg-slate-100 py-2.5 px-4 text-center font-extrabold uppercase text-xs sm:text-sm tracking-wider border-y border-slate-400 rounded-lg">
                POST-EVENT OUTCOME & COMPLETION REPORT
              </div>

              {/* Event & Requisition Summary Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs my-4">
                <tbody>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <td className="w-1/3 p-2.5 font-bold border-r border-slate-300 text-slate-700">Program / Event Title:</td>
                    <td className="w-2/3 p-2.5 font-bold text-slate-900">{selectedRequest.title}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold border-r border-slate-300 text-slate-700">Organizing Department & Secretary:</td>
                    <td className="p-2.5 font-semibold text-slate-800">{selectedRequest.submitted_by_name} ({selectedRequest.department} Dept)</td>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-slate-300 text-slate-700">Event Execution Date:</td>
                    <td className="p-2.5 font-semibold text-slate-800">{selectedRequest.report_event_date || '22 March 2024'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold border-r border-slate-300 text-slate-700">Total Participants / Beneficiaries:</td>
                    <td className="p-2.5 font-semibold text-slate-800">{selectedRequest.report_participants_count || '145 Students & 12 Faculty'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Executive Summary */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1">
                  Executive Summary & Highlights of the Program
                </h4>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedRequest.report_summary || 'The program was executed successfully as per approved requisition schedule. All planned guest lectures and interactive sessions were conducted smoothly with active participant engagement.'}
                </p>
              </div>

              {/* Key Outcomes - Point by Point Numbered List */}
              {selectedRequest.report_outcomes && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1">
                    Key Outcomes & Learning Impact
                  </h4>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800 font-semibold leading-relaxed">
                      {parseOutcomePoints(selectedRequest.report_outcomes).map((pt: string, idx: number) => (
                        <li key={idx} className="pl-1">
                          <span className="font-normal text-slate-900">{pt}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Event Photos Gallery with Neat Borders */}
              {(() => {
                let photos: any[] = [];
                try {
                  photos = typeof selectedRequest.report_photos === 'string' ? JSON.parse(selectedRequest.report_photos) : selectedRequest.report_photos;
                } catch (e) {
                  photos = [];
                }
                if (!photos || photos.length === 0) return null;

                return (
                  <div className="space-y-3 pt-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                      Event Photographs & Visual Evidence
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {photos.map((photo: any, index: number) => (
                        <div
                          key={index}
                          className="border-2 border-slate-900 bg-white p-3 rounded-2xl shadow-md flex flex-col items-center justify-between transition-all"
                          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                        >
                          <div className="w-full h-40 overflow-hidden rounded-xl border border-slate-300 shadow-inner bg-slate-100 flex items-center justify-center">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Event Photo ${index + 1}`}
                              className="w-full h-full object-contain p-1 rounded-xl bg-slate-900/5"
                            />
                          </div>
                          <div className="mt-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-300 font-sans text-xs font-bold text-slate-800 italic text-center w-full">
                            {photo.caption || `Photo ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Signature Line Blocks */}
              <div className="grid grid-cols-4 gap-4 text-center text-xs font-bold pt-12 mt-6 font-sans border-t border-slate-300" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div>
                  <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">Signed digitally</div>
                  <p className="pt-2">Organizing Secretary</p>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">Verified & Signed</div>
                  <p className="pt-2">Head of Department (HOD)</p>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">
                    {selectedRequest.principal_action_at ? `Approved ${new Date(selectedRequest.principal_action_at).toLocaleDateString()}` : 'Principal Sign'}
                  </div>
                  <p className="pt-2">Principal</p>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-8 text-slate-400 font-normal italic">Approved</div>
                  <p className="pt-2">Chairman</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
