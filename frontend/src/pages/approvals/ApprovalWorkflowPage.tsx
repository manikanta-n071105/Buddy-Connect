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
  ArrowRight
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

  // Form States for 14-Point SSE Financial Assistance Application
  const [newTitle, setNewTitle] = useState('APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING ONE DAY GUEST PROGRAM ON 22 MARCH 2024');
  const [newCategory, setNewCategory] = useState('Guest Program / Lecture');
  const [newDept, setNewDept] = useState(user?.department || 'HAS');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('6000');

  // 14 Individual Points State
  const [f1OrgSecretary, setF1OrgSecretary] = useState('Dr. R. Nithya, Associate Professor');
  const [f2Dept, setF2Dept] = useState('HAS');
  const [f3Theme, setF3Theme] = useState('Guest Lecture');
  const [f4TargetGroup, setF4TargetGroup] = useState('HAS Faculties, all First Year Students');
  const [f5ResourcePerson, setF5ResourcePerson] = useState('Dr. Padmasuvarna');
  const [f6Affiliation, setF6Affiliation] = useState('Professor, Department of Physics, Jawaharlal Nehru Technological University Anantapur, Andhra Pradesh');
  const [f7Level, setF7Level] = useState('State Level');
  const [f8Duration, setF8Duration] = useState('Half Day');
  const [f9PastPrograms, setF9PastPrograms] = useState('Organized 2 FDPs and 1 National Seminar in the last academic year');
  const [f10LocalPart, setF10LocalPart] = useState('First Year Students & HAS Faculty');
  const [f10OutstationPart, setF10OutstationPart] = useState('NIL');
  
  // Expenditure
  const [f11TaDa, setF11TaDa] = useState('NIL');
  const [f11Honorarium, setF11Honorarium] = useState('5000');
  const [f11Misc, setF11Misc] = useState('1000');
  const [f11Total, setF11Total] = useState('6000');
  
  const [f12AssistanceSought, setF12AssistanceSought] = useState('6000');
  const [f13OtherSources, setF13OtherSources] = useState('NIL (External Sponsors: NIL, Registration Fees: NIL)');
  const [f14ImportanceNote, setF14ImportanceNote] = useState('Guest Lecture on Physics & Engineering applications essential for first-year students foundational growth.');

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

  const specialRole = (user?.special_role || user?.specialRole || '').toUpperCase();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || specialRole.includes('PRINCIPAL');
  const isHR = specialRole.includes('HR') || isSuperAdmin;
  const isDirector = specialRole.includes('DIRECTOR') || isSuperAdmin;
  const isAccounts = specialRole.includes('ACCOUNTS') || isSuperAdmin;
  const isHOD = specialRole.includes('HOD') || user?.role === 'FACULTY' || isSuperAdmin;

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
  }, []);

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
                {selectedRequest.submitted_by_id === user?.id && selectedRequest.status === 'CHANGES_REQUESTED' && (
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
                    <Edit3 className="w-4 h-4" /> Revise & Resubmit to Principal
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

                {/* Print Official Format */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20"
                >
                  <Printer className="w-4 h-4" /> Print Formal Application
                </button>
              </div>

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
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="font-bold text-sm text-slate-700">Official Financial Assistance Application (14-Point SSE Format)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Print Form
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Form Body - Word-for-Word SSE Layout */}
            <div className="space-y-6 text-slate-900 text-xs font-serif p-8 border border-slate-300 rounded-xl bg-white leading-relaxed">
              {/* Header */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wider uppercase font-sans">SANSKRITHI SCHOOL OF ENGINEERING</h2>
                <p className="text-[11px] text-slate-700 font-sans">Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                <p className="text-[10px] text-slate-600 italic font-sans">Affiliated to JNTUA & Approved by AICTE, www.sseptp.org</p>
              </div>

              {/* Title */}
              <div className="text-center font-bold uppercase text-xs tracking-wider py-3 underline font-sans">
                {selectedRequest.title || 'APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING GUEST PROGRAM'}
              </div>

              {/* 14-Point Table Format */}
              <table className="w-full border-collapse border border-slate-400 text-xs my-4">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/2 p-2 font-semibold border-r border-slate-300">1. Name and address of the Organizing Secretary of the FDP/Program:</td>
                    <td className="w-1/2 p-2">{selectedRequest.submitted_by_name} ({selectedRequest.department})</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">2. Department under the auspices of which Expert lecture is proposed:</td>
                    <td className="p-2">{selectedRequest.department}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">3. Theme(s) of the FDP/Program:</td>
                    <td className="p-2">{selectedRequest.category}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">4. Target Group:</td>
                    <td className="p-2">HAS Faculties, all First Year Students</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">5. Name(s) & Affiliation of the Resource Person(s):</td>
                    <td className="p-2">Dr. Padmasuvarna, Professor, Dept of Physics, JNTU Anantapur</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">6. Level of the Expert Lecture:</td>
                    <td className="p-2">State / Regional Level</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">7. Duration of the Programme:</td>
                    <td className="p-2">Half Day</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">8. Estimated Expenditure Breakdown:</td>
                    <td className="p-2 font-mono">
                      Honorarium: Rs. 5000<br />
                      Miscellaneous: Rs. 1000<br />
                      <strong className="text-slate-900">Total Expenditure: Rs. {selectedRequest.amount || 6000}</strong>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">9. Requisition Description & Details:</td>
                    <td className="p-2 whitespace-pre-wrap">{selectedRequest.description}</td>
                  </tr>

                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-semibold border-r border-slate-300">10. Principal Review Status:</td>
                    <td className="p-2 font-bold text-slate-800">
                      {selectedRequest.status} {selectedRequest.principal_comments ? `(${selectedRequest.principal_comments})` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signature Line Blocks */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold pt-16 mt-8 font-sans">
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
    </div>
  );
};
