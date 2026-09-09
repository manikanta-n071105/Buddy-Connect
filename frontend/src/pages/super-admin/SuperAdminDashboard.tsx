import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { SpotlightCard, AnimatedCounter, AcademicGridPattern, ShinyText, GradientBorder } from '../../components/bits';
import {
  Building2, Users, CircleAlert, CheckCircle2, Flame, BarChart3, ShieldCheck, Activity,
  FileSpreadsheet, Download, Printer, X, Search, Filter, Clock, Sparkles, AlertTriangle,
  FileText, CheckCircle, RefreshCw, Mic, MicOff, Save, Copy, Plus, BookOpen, ChevronRight,
  Gavel, Trash2, Zap, CheckSquare, Layers, Award, LayoutDashboard, Calendar, Eye, MessageSquare
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Main Tab: 'OVERVIEW' | 'MOM_STUDIO' | 'ISSUES_REPORT'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MOM_STUDIO' | 'ISSUES_REPORT'>('OVERVIEW');

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Issues Report State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportTabFilter, setReportTabFilter] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Minutes of Meeting (MoM) & Hearing Session State
  const [isSummarizingMom, setIsSummarizingMom] = useState(false);
  const [isSavingMom, setIsSavingMom] = useState(false);
  const [momArchive, setMomArchive] = useState<any[]>([]);
  const [selectedMomDetail, setSelectedMomDetail] = useState<any | null>(null);

  // Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // MoM Form Data
  const [momForm, setMomForm] = useState({
    title: '',
    meetingType: 'HEARING',
    location: 'Super Admin Boardroom',
    chairpersonName: user?.name || 'Super Administrator',
    attendees: 'Super Admin, Department Directors, Mentors',
    hearingNotes: '',
    customDecisions: ''
  });

  // Generated MoM Output Result
  const [generatedMom, setGeneratedMom] = useState<any | null>(null);

  const fetchStatsAndMom = async () => {
    try {
      const [statsRes, momRes] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get('/meetings/mom').catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data.data);
      setMomArchive(momRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndMom();
  }, []);

  // Generate Issues Report Handler
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const res = await api.get('/reports/issues-report');
      setReportData(res.data.data);
      setActiveTab('ISSUES_REPORT');
      toast.success('Issues audit report generated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate issues report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Switch to Issues Report Tab with Auto Generation
  const handleOpenIssuesReportTab = () => {
    setActiveTab('ISSUES_REPORT');
    if (!reportData) {
      handleGenerateReport();
    }
  };

  // Export Report to CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.allIssues) return;

    const headers = [
      'Issue Number',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Escalation Level',
      'Reporter (Junior)',
      'Department',
      'Assigned Senior',
      'Director',
      'Resolution Notes',
      'Date Reported',
      'Last Updated'
    ];

    const rows = reportData.allIssues.map((i: any) => [
      `"${i.issue_number || ''}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${i.category_name || 'General'}"`,
      `"${i.status || ''}"`,
      `"${i.priority || ''}"`,
      `"${i.escalation_level || 0}"`,
      `"${i.junior_name || ''} (@${i.junior_username || ''})"`,
      `"${i.junior_department || ''}"`,
      `"${i.senior_name || ''}"`,
      `"${i.director_name || ''}"`,
      `"${(i.resolution || '').replace(/"/g, '""')}"`,
      `"${i.created_at ? new Date(i.created_at).toLocaleDateString() : ''}"`,
      `"${i.updated_at ? new Date(i.updated_at).toLocaleDateString() : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campus_issues_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Issues report exported to CSV file successfully!');
  };

  // Filter report issues
  const getFilteredReportIssues = () => {
    if (!reportData) return [];
    let list = reportData.allIssues || [];

    if (reportTabFilter === 'SOLVED') {
      list = reportData.solvedIssues || [];
    } else if (reportTabFilter === 'UNSOLVED') {
      list = reportData.unsolvedIssues || [];
    }

    if (reportSearchTerm.trim()) {
      const term = reportSearchTerm.toLowerCase();
      list = list.filter((i: any) =>
        (i.issue_number && i.issue_number.toLowerCase().includes(term)) ||
        (i.title && i.title.toLowerCase().includes(term)) ||
        (i.category_name && i.category_name.toLowerCase().includes(term)) ||
        (i.junior_name && i.junior_name.toLowerCase().includes(term)) ||
        (i.senior_name && i.senior_name.toLowerCase().includes(term)) ||
        (i.status && i.status.toLowerCase().includes(term))
      );
    }

    return list;
  };

  // VOICE DICTATION HANDLER (Web Speech API)
  const toggleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Browser speech recognition is not supported in this browser. Please type directly.');
      return;
    }

    if (isListening && recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
      toast.info('Voice dictation paused');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript.trim()) {
          setMomForm(prev => ({
            ...prev,
            hearingNotes: prev.hearingNotes ? `${prev.hearingNotes}\n${transcript.trim()}` : transcript.trim()
          }));
        }
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      setRecognitionInstance(rec);
      setIsListening(true);
      toast.success('Voice dictation active! Speak into microphone...');
    } catch (err) {
      toast.error('Failed to start voice dictation');
    }
  };

  // INSERT STATEMENT PRESETS
  const insertNotePreset = (prefix: string) => {
    setMomForm(prev => ({
      ...prev,
      hearingNotes: prev.hearingNotes ? `${prev.hearingNotes}\n\n${prefix}: ` : `${prefix}: `
    }));
  };

  // SUMMARIZE MoM HEARING USING AI
  const handleSummarizeMom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momForm.title.trim() || !momForm.hearingNotes.trim()) {
      toast.error('Please provide a meeting title and hearing transcript notes.');
      return;
    }

    try {
      setIsSummarizingMom(true);
      const res = await api.post('/meetings/mom/summarize', momForm);
      setGeneratedMom(res.data.data);
      toast.success('AI Minutes of Meeting (MoM) summary synthesized!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to summarize meeting notes');
    } finally {
      setIsSummarizingMom(false);
    }
  };

  // SAVE MoM TO ARCHIVE
  const handleSaveMom = async () => {
    if (!generatedMom) return;
    try {
      setIsSavingMom(true);
      const res = await api.post('/meetings/mom', generatedMom);
      toast.success('Minutes of Meeting saved to official archive!');
      setMomArchive(prev => [res.data.data, ...prev]);
      setGeneratedMom(null);
      setMomForm({
        title: '',
        meetingType: 'HEARING',
        location: 'Super Admin Boardroom',
        chairpersonName: user?.name || 'Super Administrator',
        attendees: 'Super Admin, Department Directors, Mentors',
        hearingNotes: '',
        customDecisions: ''
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save MoM record');
    } finally {
      setIsSavingMom(false);
    }
  };

  // DELETE MoM RECORD
  const handleDeleteMom = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Minutes of Meeting record?')) return;
    try {
      await api.delete(`/meetings/mom/${id}`);
      setMomArchive(prev => prev.filter(m => m.id !== id));
      if (selectedMomDetail?.id === id) setSelectedMomDetail(null);
      toast.success('Minutes of Meeting record deleted.');
    } catch (err: any) {
      toast.error('Failed to delete MoM record');
    }
  };

  // COPY FORMATTED MoM TEXT
  const handleCopyMomText = (mom: any) => {
    const text = `
==================================================
MINUTES OF MEETING (MoM) / AI HEARING SUMMARY
==================================================
Meeting Title: ${mom.title}
Meeting Type: ${mom.meeting_type || mom.meetingType}
Date: ${new Date(mom.created_at || mom.meetingDate).toLocaleString()}
Location: ${mom.location}
Chairperson: ${mom.chairperson_name || mom.chairpersonName}
Attendees: ${mom.attendees}

1. EXECUTIVE AI SUMMARY:
${mom.executive_summary || mom.executiveSummary}

2. KEY HEARING HIGHLIGHTS:
${mom.key_highlights || mom.keyHighlights || 'N/A'}

3. ACTION ITEMS & RESPONSIBILITIES:
${mom.action_items || mom.actionItems || 'N/A'}

4. FINAL DECISION & VERDICT:
${mom.decisions_reached || mom.decisionsReached}
==================================================
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Formatted MoM text copied to clipboard!');
  };

  // RELIABLE DEDICATED PRINT HTML GENERATOR FOR CORPORATE MoM PDF (100% Formal Corporate/Academic Layout)
  const handlePrintPdfDocument = (mom: any) => {
    if (!mom) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      toast.error('Pop-up blocker prevented opening print window. Please allow pop-ups.');
      return;
    }

    const actionItemsText = mom.action_items || mom.actionItems || '';
    let actionItemsHtml = '';

    const lines = String(actionItemsText).split('\n').map(l => l.trim()).filter(Boolean);
    const tableRows = lines.filter(l => l.includes('|') && !l.toLowerCase().includes('s.no') && !l.includes('---'));

    if (tableRows.length > 0) {
      const rowsHtml = tableRows.map(row => {
        const parts = row.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          const sno = parts[0] || '1';
          const task = parts[1] || 'Task';
          const assignedTo = parts[2] || 'Unassigned';
          const deadline = parts[3] || 'TBD';
          const priority = parts[4] || 'Normal';
          const status = parts[5] || 'Pending';
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: bold; font-family: monospace;">${sno}</td>
              <td style="padding: 8px; font-weight: 600;">${task}</td>
              <td style="padding: 8px;">${assignedTo}</td>
              <td style="padding: 8px; font-family: monospace;">${deadline}</td>
              <td style="padding: 8px; font-weight: bold;">${priority}</td>
              <td style="padding: 8px;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">${status}</span></td>
            </tr>
          `;
        }
        return '';
      }).join('');

      actionItemsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px;">
              <th style="padding: 8px;">S.No</th>
              <th style="padding: 8px;">Task</th>
              <th style="padding: 8px;">Assigned To</th>
              <th style="padding: 8px;">Deadline</th>
              <th style="padding: 8px;">Priority</th>
              <th style="padding: 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } else {
      actionItemsHtml = `<pre style="font-family: inherit; white-space: pre-wrap; margin: 0; line-height: 1.6;">${actionItemsText || 'N/A'}</pre>`;
    }

    const documentHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Minutes of Meeting - ${mom.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              margin: 40px 50px;
              color: #0f172a;
              background: #ffffff;
              line-height: 1.6;
              font-size: 13px;
            }
            .header-banner {
              border-bottom: 3px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header-banner h1 {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: -0.01em;
            }
            .header-banner .subtext {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
            }
            .section-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 4px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 24px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px;
              font-size: 12px;
            }
            .details-grid div strong {
              color: #0f172a;
            }
            .box-styled {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px;
              margin-bottom: 12px;
            }
            .closure-bar {
              margin-top: 30px;
              border-top: 1px solid #cbd5e1;
              padding-top: 12px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <h1>MINUTES OF MEETING (MoM)</h1>
              <div class="subtext">JuniorConnect Executive & Academic Management Platform</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b; font-weight: 600;">
              Doc Ref: MoM-${new Date(mom.created_at || mom.meetingDate).getTime().toString().slice(-6)}
            </div>
          </div>

          <div class="section-title">MEETING DETAILS</div>
          <div class="details-grid">
            <div><strong>Meeting Title:</strong> ${mom.title}</div>
            <div><strong>Meeting Type:</strong> ${mom.meeting_type || mom.meetingType || 'HEARING'}</div>
            <div><strong>Date & Time:</strong> ${new Date(mom.created_at || mom.meetingDate).toLocaleString()}</div>
            <div><strong>Venue / Location:</strong> ${mom.location}</div>
            <div><strong>Conducted By / Chair:</strong> ${mom.chairperson_name || mom.chairpersonName}</div>
            <div><strong>Attendees:</strong> ${mom.attendees}</div>
          </div>

          <div class="section-title">1. EXECUTIVE SUMMARY & OBJECTIVES</div>
          <div class="box-styled">
            ${mom.executive_summary || mom.executiveSummary}
          </div>

          <div class="section-title">2. DISCUSSION NOTES & HIGHLIGHTS</div>
          <div class="box-styled">
            <pre style="font-family: inherit; white-space: pre-wrap; margin: 0; line-height: 1.6;">${mom.key_highlights || mom.keyHighlights || 'N/A'}</pre>
          </div>

          <div class="section-title">3. KEY DECISIONS & VERDICT</div>
          <div class="box-styled" style="background: #eef2ff; border-color: #c7d2fe;">
            <strong>${mom.decisions_reached || mom.decisionsReached}</strong>
          </div>

          <div class="section-title">4. ACTION ITEMS & RESPONSIBILITIES</div>
          ${actionItemsHtml}

          <div class="closure-bar">
            <span>Prepared By: ${mom.chairperson_name || 'Administrator'}</span>
            <span>Document Approved & Verified</span>
            <span>Printed: ${new Date().toLocaleDateString()}</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
  };

  // RELIABLE DEDICATED PRINT HTML GENERATOR FOR ISSUES REPORT PDF
  const handlePrintIssuesReport = (report: any) => {
    if (!report || !report.allIssues) return;
    const printWindow = window.open('', '_blank', 'width=950,height=1100');
    if (!printWindow) {
      toast.error('Pop-up blocker prevented opening print window. Please allow pop-ups.');
      return;
    }

    const rowsHtml = report.allIssues.map((issue: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-family: monospace; font-weight: bold;">${issue.issue_number || 'ISS-00'}</td>
        <td style="padding: 8px;"><strong>${issue.title}</strong><br/><small style="color: #64748b;">${issue.category_name || 'General'}</small></td>
        <td style="padding: 8px;">${issue.junior_name || 'Student'}<br/><small style="color: #64748b;">(${issue.junior_department})</small></td>
        <td style="padding: 8px;">${issue.senior_name || 'Unassigned'}</td>
        <td style="padding: 8px; font-weight: bold;">${issue.priority || 'NORMAL'}</td>
        <td style="padding: 8px; font-weight: bold;">${issue.status}</td>
        <td style="padding: 8px; font-size: 11px;">${issue.resolution || issue.status}</td>
      </tr>
    `).join('');

    const documentHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Campus Issues Status & Resolution Audit Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 30px; color: #0f172a; background: #ffffff; }
            .header { border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; margin: 0; }
            .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
            .stats-grid { display: flex; gap: 12px; margin-bottom: 20px; }
            .stat-card { flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
            .stat-card strong { font-size: 18px; display: block; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
            th { background: #0f172a; color: #ffffff; padding: 8px; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Campus Issues Resolution & Status Report</h1>
            <div class="meta">Generated On: ${new Date(report.summary.generatedAt).toLocaleString()} | Total Issues Volume: ${report.summary.totalCount}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">Total Reported Issues: <strong>${report.summary.totalCount}</strong></div>
            <div class="stat-card">Solved / Resolved: <strong style="color: #15803d;">${report.summary.solvedCount} (${report.summary.resolutionRate}%)</strong></div>
            <div class="stat-card">Not Solved / Pending: <strong style="color: #b45309;">${report.summary.unsolvedCount}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Issue #</th>
                <th>Title & Category</th>
                <th>Reporter</th>
                <th>Assigned Senior</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Resolution / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
  };

  if (isLoading) return <LoadingState message="Loading Super Admin Command Center..." />;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const rawPieData = [
    { name: 'Solved Issues', value: stats?.satisfactionBreakdown?.satisfied ?? stats?.resolvedIssues ?? 0 },
    { name: 'Pending / In-Progress', value: stats?.satisfactionBreakdown?.partiallySatisfied ?? stats?.openIssues ?? 0 },
    { name: 'Escalated / Reopened', value: stats?.satisfactionBreakdown?.notSatisfied ?? ((stats?.escalatedIssues || 0) + (stats?.reopenedIssues || 0)) }
  ];
  const activePieData = rawPieData.filter(item => item.value > 0);
  const votePieData = activePieData.length > 0 ? activePieData : [{ name: 'No Active Issues', value: 1 }];

  const filteredReportList = getFilteredReportIssues();

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER WITH TAB CONTROLS */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Super Admin Command Center
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Management Hub</h1>
            <p className="text-xs text-slate-300">
              Campus hierarchy metrics, AI Minutes of Meetings (MoM) Studio, and comprehensive issues resolution reports.
            </p>
          </div>

          {/* TAB BUTTON NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview & Scorecards
            </button>

            <button
              onClick={() => setActiveTab('MOM_STUDIO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'MOM_STUDIO'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" /> AI MoM Hearing Studio
            </button>

            <button
              onClick={handleOpenIssuesReportTab}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ISSUES_REPORT'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Issues Audit Report
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & SCORECARDS */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Cards with React Bits Spotlight & Animated Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SpotlightCard spotlightColor="rgba(79, 70, 229, 0.15)" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Directors</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center transition-transform hover:scale-110">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
                <AnimatedCounter value={stats.totalDirectors} />
              </p>
              <div className="mt-2 text-[11px] font-semibold text-slate-400">Department Heads</div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(37, 99, 235, 0.15)" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Seniors & Juniors</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center transition-transform hover:scale-110">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-3 tracking-tight flex items-baseline gap-1">
                <AnimatedCounter value={stats.totalSeniors} /> <span className="text-xs font-bold text-slate-400">S</span> / <AnimatedCounter value={stats.totalJuniors} /> <span className="text-xs font-bold text-slate-400">J</span>
              </p>
              <div className="mt-2 text-[11px] font-semibold text-slate-400">Active Student Hierarchy</div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Open Issues</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center transition-transform hover:scale-110">
                  <CircleAlert className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 mt-3 tracking-tight">
                <AnimatedCounter value={stats.openIssues} />
              </p>
              <div className="mt-2 text-[11px] font-semibold text-slate-400">Pending Resolution</div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Satisfaction Rate</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-transform hover:scale-110">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 mt-3 tracking-tight">
                <AnimatedCounter value={stats.satisfactionRate} suffix="%" />
              </p>
              <div className="mt-2 text-[11px] font-semibold text-slate-400">Feedback Score</div>
            </SpotlightCard>
          </div>

          {/* Quick Action Hubs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-3xl border border-indigo-800 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <Gavel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">AI MoM Hearing Studio</h3>
                  <p className="text-xs text-indigo-200/80">Record transcripts & generate AI MoM summaries</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('MOM_STUDIO')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-all flex items-center gap-1 shrink-0"
              >
                Launch Studio <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-5 rounded-3xl border border-teal-800 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-2xl text-teal-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Issues Audit Report</h3>
                  <p className="text-xs text-teal-200/80">Generate full Solved vs Unsolved issues audit report</p>
                </div>
              </div>

              <button
                onClick={handleOpenIssuesReportTab}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-md transition-all flex items-center gap-1 shrink-0"
              >
                View Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" /> Issues by Category
                </h3>
                <span
                  onClick={() => navigate('/issues')}
                  className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full cursor-pointer"
                >
                  Filter View
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="category" interval={0} tick={{ fontSize: 10, fill: '#0f172a', fontWeight: 800 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" /> Resolution Satisfaction
                </h3>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={votePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={4} label>
                      {votePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Senior Performance Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 overflow-hidden">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" /> Senior Performance Scorecards
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Senior Mentor</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Assigned Juniors</th>
                    <th className="p-3.5">Total Issues</th>
                    <th className="p-3.5">Open</th>
                    <th className="p-3.5">Resolved</th>
                    <th className="p-3.5">Escalated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {stats.seniorPerformance.map((sen: any) => (
                    <tr key={sen.senior_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{sen.senior_name}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{sen.senior_code}</td>
                      <td className="p-3.5 font-semibold">{sen.junior_count}</td>
                      <td className="p-3.5 font-semibold">{sen.total_issues}</td>
                      <td className="p-3.5 font-bold text-amber-600">{sen.open_issues}</td>
                      <td className="p-3.5 font-bold text-emerald-600">{sen.resolved_issues}</td>
                      <td className="p-3.5 text-rose-600 font-extrabold">{sen.escalated_issues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI MoM & HEARING STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'MOM_STUDIO' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Studio Workspace Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <Gavel className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> Executive AI Hearing Studio
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Minutes of Meeting (MoM) & AI Summarizer Studio
                  </h2>
                </div>
              </div>

              {generatedMom && (
                <button
                  onClick={() => handlePrintPdfDocument(generatedMom)}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-600" /> Print PDF Report
                </button>
              )}
            </div>

            {/* SPLIT STUDIO WORKSPACE (Left: Inputs & Dictation | Right: Live AI MoM Document Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: SETUP & TRANSCRIPT INPUTS (Lg: 6 cols) */}
              <form onSubmit={handleSummarizeMom} className="lg:col-span-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-300 block mb-1">Meeting / Hearing Title *</label>
                    <input
                      type="text"
                      required
                      value={momForm.title}
                      onChange={(e) => setMomForm({ ...momForm, title: e.target.value })}
                      placeholder="e.g. Disciplinary Hearing: Campus Protocol Review #108"
                      className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs font-semibold outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1">Meeting Category</label>
                    <select
                      value={momForm.meetingType}
                      onChange={(e) => setMomForm({ ...momForm, meetingType: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs font-extrabold outline-hidden focus:border-indigo-500"
                    >
                      <option value="HEARING">HEARING / VERDICT</option>
                      <option value="DISCIPLINARY">DISCIPLINARY COMMITTEE</option>
                      <option value="GRIEVANCE_COMMITTEE">GRIEVANCE COMMITTEE</option>
                      <option value="COUNCIL_MEETING">COUNCIL MEETING</option>
                      <option value="FACULTY_REVIEW">FACULTY & MENTOR REVIEW</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1">Chairperson / Presiding Officer</label>
                    <input
                      type="text"
                      value={momForm.chairpersonName}
                      onChange={(e) => setMomForm({ ...momForm, chairpersonName: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs font-semibold outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-300 block mb-1">Attendees / Participants</label>
                    <input
                      type="text"
                      value={momForm.attendees}
                      onChange={(e) => setMomForm({ ...momForm, attendees: e.target.value })}
                      placeholder="Super Admin, CSE Director, Faculty Advisor, Junior Student"
                      className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs font-semibold outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Hearing Transcript Recorder with Live Dictation & Equalizer Animation */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" /> Hearing Transcript & Live Notes *
                    </label>

                    {/* Dictation & Preset Chips */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleVoiceDictation}
                        className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isListening
                            ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40 border border-rose-400'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                        }`}
                      >
                        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-400" />}
                        {isListening ? 'Stop Dictation' : 'Voice Dictation'}
                      </button>

                      <button
                        type="button"
                        onClick={() => insertNotePreset('Junior Statement')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                      >
                        + Junior
                      </button>

                      <button
                        type="button"
                        onClick={() => insertNotePreset('Director Input')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                      >
                        + Director
                      </button>
                    </div>
                  </div>

                  {/* Equalizer Bar Animation when Dictation Active */}
                  {isListening && (
                    <div className="bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in">
                      <span className="font-extrabold flex items-center gap-2 text-rose-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        Voice Dictation Active - Listening to speech...
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-5 bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-4 bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-1 h-6 bg-rose-400 animate-bounce" style={{ animationDelay: '450ms' }} />
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={9}
                    required
                    value={momForm.hearingNotes}
                    onChange={(e) => setMomForm({ ...momForm, hearingNotes: e.target.value })}
                    placeholder="Type or dictate hearing notes, statements made by parties, evidence submitted, arguments raised..."
                    className="w-full p-3.5 bg-slate-950 text-indigo-300 font-mono text-xs rounded-2xl border border-slate-800 outline-hidden focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Custom Decisions / Verdict (Optional)</label>
                  <input
                    type="text"
                    value={momForm.customDecisions}
                    onChange={(e) => setMomForm({ ...momForm, customDecisions: e.target.value })}
                    placeholder="e.g. Warning issued; mentor assigned to monitor weekly progress."
                    className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl text-xs font-semibold outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSummarizingMom || !momForm.title.trim() || !momForm.hearingNotes.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  {isSummarizingMom ? 'AI Distilling & Synthesizing MoM...' : 'Summarize with AI Now'}
                </button>
              </form>

              {/* RIGHT COLUMN: REAL-TIME AI MoM DOCUMENT PREVIEW (Lg: 6 cols) */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" /> AI Executive MoM Document Preview
                    </h4>
                    {generatedMom && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" /> AI Synthesized
                      </span>
                    )}
                  </div>

                  {!generatedMom ? (
                    <div className="p-12 text-center text-slate-500 space-y-3 my-auto">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-300">No AI MoM Generated Yet</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Enter hearing title and notes on the left, then click <strong>"Summarize with AI Now"</strong> to synthesize executive MoM summary.
                      </p>
                    </div>
                  ) : (
                    /* AI GENERATED DOCUMENT CARD */
                    <div className="space-y-3.5 text-xs text-slate-200 animate-in fade-in">
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase rounded-md inline-block mb-1">
                          {generatedMom.meetingType}
                        </span>
                        <h3 className="text-sm font-black text-white tracking-tight">{generatedMom.title}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {new Date(generatedMom.meetingDate).toLocaleString()} • {generatedMom.location}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Chairperson: <strong>{generatedMom.chairpersonName}</strong> | Attendees: {generatedMom.attendees}
                        </p>
                      </div>

                      {/* 1. AI Executive Summary */}
                      <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/80 space-y-1">
                        <strong className="text-emerald-300 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> 1. EXECUTIVE AI SUMMARY:
                        </strong>
                        <p className="text-emerald-100 font-medium leading-relaxed">{generatedMom.executiveSummary}</p>
                      </div>

                      {/* 2. Key Highlights (Distilled) */}
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <strong className="text-slate-300 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> 2. CORE HEARING HIGHLIGHTS:
                        </strong>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300 font-medium leading-relaxed">{generatedMom.keyHighlights}</pre>
                      </div>

                      {/* 3. Action Items */}
                      <div className="bg-amber-950/60 p-4 rounded-2xl border border-amber-800/80 space-y-1">
                        <strong className="text-amber-300 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> 3. ACTION ITEMS & RESPONSIBILITIES:
                        </strong>
                        <pre className="whitespace-pre-wrap font-sans text-amber-100 font-medium leading-relaxed">{generatedMom.actionItems}</pre>
                      </div>

                      {/* 4. Final Verdict */}
                      <div className="bg-indigo-950/80 p-4 rounded-2xl border border-indigo-800/90 space-y-1">
                        <strong className="text-indigo-300 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5 text-indigo-400" /> 4. FINAL DECISIONS & RULING AGREED:
                        </strong>
                        <p className="text-indigo-100 font-bold leading-relaxed">{generatedMom.decisionsReached}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions for AI MoM */}
                {generatedMom && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopyMomText(generatedMom)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-800"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy Text
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintPdfDocument(generatedMom)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-800"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" /> Print PDF Report
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveMom}
                        disabled={isSavingMom}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> {isSavingMom ? 'Saving...' : 'Save MoM Archive'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SAVED MINUTES OF MEETING (MoM) ARCHIVE GALLERY */}
          {momArchive.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Saved Minutes of Meetings (MoM) Archive
                </h3>
                <span className="text-[11px] font-bold text-slate-500">Total Records: {momArchive.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {momArchive.map((mom: any) => (
                  <div key={mom.id} className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 space-y-3 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-black rounded-md uppercase tracking-wider inline-block mb-1">
                          {mom.meeting_type || 'HEARING'}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{mom.title}</h4>
                        <span className="text-[10px] text-slate-500 block font-medium">
                          {new Date(mom.created_at || mom.meeting_date).toLocaleDateString()} • {mom.chairperson_name}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteMom(mom.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 line-clamp-3">
                      <strong className="text-slate-900 block text-[10px] font-extrabold uppercase tracking-wider mb-0.5">AI Executive Summary:</strong>
                      {mom.executive_summary}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleCopyMomText(mom)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy Text
                      </button>

                      <button
                        onClick={() => setSelectedMomDetail(mom)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                      >
                        Inspect MoM <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ISSUES RESOLUTION AUDIT REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'ISSUES_REPORT' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Executive Audit Report
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Campus Issues Resolution & Status Report
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {reportData ? (
                    <>Report Generated on: <strong className="text-slate-900">{new Date(reportData.summary.generatedAt).toLocaleString()}</strong></>
                  ) : (
                    'Click "Generate Issues Report" to pull fresh campus issue metrics.'
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                  {isGeneratingReport ? 'Generating Report...' : 'Re-Generate Report'}
                </button>

                {reportData && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download CSV
                    </button>

                    <button
                      onClick={() => handlePrintIssuesReport(reportData)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print PDF Report
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Loading Spinner State */}
            {isGeneratingReport && (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900">Querying Campus Issues Database...</h4>
                <p className="text-xs text-slate-500">Aggregating Solved vs Unsolved issues, escalation metrics, and mentor responses.</p>
              </div>
            )}

            {!reportData && !isGeneratingReport && (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900">No Issues Report Data Loaded</h4>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Generate Issues Report Now
                </button>
              </div>
            )}

            {/* Summary Scorecard Metrics */}
            {reportData && !isGeneratingReport && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Reported Issues</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{reportData.summary.totalCount}</p>
                    <span className="text-[11px] font-bold text-slate-500">100% Total Volume</span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved / Resolved
                    </span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{reportData.summary.solvedCount}</p>
                    <span className="text-[11px] font-extrabold text-emerald-800">{reportData.summary.resolutionRate}% Solved Rate</span>
                  </div>

                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                      <CircleAlert className="w-3.5 h-3.5 text-amber-600" /> Not Solved / Pending
                    </span>
                    <p className="text-2xl font-black text-amber-700 mt-1">{reportData.summary.unsolvedCount}</p>
                    <span className="text-[11px] font-extrabold text-amber-800">
                      {reportData.summary.totalCount > 0 ? Math.round((reportData.summary.unsolvedCount / reportData.summary.totalCount) * 100) : 0}% Pending
                    </span>
                  </div>

                  <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Escalated to Director
                    </span>
                    <p className="text-2xl font-black text-rose-700 mt-1">
                      {reportData.unsolvedIssues.filter((i: any) => i.status === 'ESCALATED').length}
                    </p>
                    <span className="text-[11px] font-extrabold text-rose-800">Requires Urgent Action</span>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReportTabFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        reportTabFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Issues ({reportData.summary.totalCount})
                    </button>

                    <button
                      onClick={() => setReportTabFilter('SOLVED')}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        reportTabFilter === 'SOLVED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      Solved ({reportData.summary.solvedCount})
                    </button>

                    <button
                      onClick={() => setReportTabFilter('UNSOLVED')}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        reportTabFilter === 'UNSOLVED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      Not Solved ({reportData.summary.unsolvedCount})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      placeholder="Filter by issue #, title, student..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Detailed Issues List Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white sticky top-0 font-extrabold uppercase tracking-wider text-[10px] z-10">
                      <tr>
                        <th className="p-3">Issue #</th>
                        <th className="p-3">Title & Category</th>
                        <th className="p-3">Reporter</th>
                        <th className="p-3">Assigned Senior</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Resolution Details / Status Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredReportList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                            No matching issues found in campus database for selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredReportList.map((issue: any) => {
                          const isSolved = ['RESOLVED', 'CLOSED'].includes(issue.status);
                          return (
                            <tr key={issue.id} className={`hover:bg-slate-50 transition-colors ${isSolved ? 'bg-emerald-50/20' : 'bg-amber-50/20'}`}>
                              <td className="p-3 font-mono font-extrabold text-slate-900 text-[11px] whitespace-nowrap">
                                {issue.issue_number || 'ISS-00'}
                              </td>

                              <td className="p-3">
                                <strong className="text-slate-900 block font-extrabold">{issue.title}</strong>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                                  {issue.category_name || 'General'}
                                </span>
                              </td>

                              <td className="p-3">
                                <span className="font-bold text-slate-900 block">{issue.junior_name || 'Student'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">@{issue.junior_username || 'junior'} ({issue.junior_department})</span>
                              </td>

                              <td className="p-3 font-semibold">
                                {issue.senior_name ? (
                                  <span>{issue.senior_name} <span className="text-[10px] text-slate-400 font-mono">({issue.senior_code})</span></span>
                                ) : (
                                  <span className="text-slate-400 font-italic">Unassigned</span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                                  issue.priority === 'HIGH' || issue.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                                  issue.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {issue.priority || 'NORMAL'}
                                </span>
                              </td>

                              <td className="p-3">
                                <StatusBadge status={issue.status} />
                              </td>

                              <td className="p-3 max-w-xs">
                                {isSolved ? (
                                  <div className="bg-emerald-100/60 p-2 rounded-xl border border-emerald-200 text-emerald-950 text-[11px]">
                                    <strong className="font-extrabold text-emerald-900 block uppercase text-[9px] tracking-wider">Resolution Notes:</strong>
                                    "{issue.resolution || 'Resolved by mentor'}"
                                  </div>
                                ) : (
                                  <div className="bg-amber-100/60 p-2 rounded-xl border border-amber-200 text-amber-950 text-[11px]">
                                    <strong className="font-extrabold text-amber-900 block uppercase text-[9px] tracking-wider">Pending Action:</strong>
                                    {issue.status === 'ESCALATED' ? (
                                      <span className="text-rose-700 font-bold">Escalated to Department Director (Level {issue.escalation_level || 1})</span>
                                    ) : (
                                      <span>Pending mentor review & solution</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* INSPECT SAVED MoM DETAIL MODAL */}
      {selectedMomDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase rounded-full tracking-wider mb-1 inline-block">
                  {selectedMomDetail.meeting_type}
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{selectedMomDetail.title}</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(selectedMomDetail.created_at || selectedMomDetail.meeting_date).toLocaleString()} • {selectedMomDetail.location}
                </span>
              </div>

              <button onClick={() => setSelectedMomDetail(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-800">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900 font-extrabold block mb-0.5">Chairperson & Attendees:</strong>
                <p>Chair: <strong>{selectedMomDetail.chairperson_name}</strong> | Attendees: {selectedMomDetail.attendees}</p>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                <strong className="text-emerald-950 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> 1. EXECUTIVE AI SUMMARY:
                </strong>
                <p className="text-emerald-950 leading-relaxed font-medium">{selectedMomDetail.executive_summary}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> 2. CORE HEARING HIGHLIGHTS:
                </strong>
                <pre className="whitespace-pre-wrap font-sans text-slate-700 font-medium leading-relaxed">{selectedMomDetail.key_highlights || 'N/A'}</pre>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-1">
                <strong className="text-amber-950 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> 3. ACTION ITEMS & RESPONSIBILITIES:
                </strong>
                <pre className="whitespace-pre-wrap font-sans text-amber-950 font-medium leading-relaxed">{selectedMomDetail.action_items || 'N/A'}</pre>
              </div>

              <div className="bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200 space-y-1">
                <strong className="text-indigo-950 font-black uppercase text-[10px] tracking-wider block flex items-center gap-1">
                  <Gavel className="w-3.5 h-3.5 text-indigo-600" /> 4. FINAL DECISIONS & RULING AGREED:
                </strong>
                <p className="text-indigo-950 font-bold leading-relaxed">{selectedMomDetail.decisions_reached}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => handleCopyMomText(selectedMomDetail)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Copy Formatted Text
              </button>

              <button
                onClick={() => handlePrintPdfDocument(selectedMomDetail)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
