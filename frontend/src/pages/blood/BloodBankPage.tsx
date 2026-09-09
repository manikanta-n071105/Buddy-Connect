import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BloodRequest, BloodDonor } from '../../types';
import {
  Heart,
  Droplet,
  HeartHandshake,
  AlertCircle,
  PlusCircle,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  User,
  ShieldAlert,
  Flame,
  Search,
  Sparkles,
  Share2,
  Info,
  XCircle,
  ArrowRight,
  ListFilter
} from 'lucide-react';
import { toast } from 'sonner';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const BloodBankPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'post' | 'my-activity'>('browse');

  // Filters
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<string>('ALL');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Blood group quick edit
  const [isEditingBloodGroup, setIsEditingBloodGroup] = useState(false);
  const [userBloodGroup, setUserBloodGroup] = useState(user?.blood_group || '');
  const [isSavingBloodGroup, setIsSavingBloodGroup] = useState(false);

  // New Request Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    contact_number: '',
    blood_group: 'O+',
    units_needed: 1,
    urgency: 'NORMAL',
    hospital_name: '',
    additional_notes: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const [reqRes, donRes, myReqRes] = await Promise.all([
        api.get('/blood/requests'),
        api.get('/blood/my-donations'),
        api.get('/blood/my-requests')
      ]);

      if (reqRes.data?.success) setRequests(reqRes.data.data);
      if (donRes.data?.success) setMyDonations(donRes.data.data);
      if (myReqRes.data?.success) setMyRequests(myReqRes.data.data);
    } catch (err: any) {
      toast.error('Failed to load blood requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateBloodGroup = async () => {
    if (!userBloodGroup) {
      toast.error('Please select a valid blood group');
      return;
    }
    setIsSavingBloodGroup(true);
    try {
      const res = await api.put('/blood/user/blood-group', { blood_group: userBloodGroup });
      if (res.data?.success) {
        toast.success(`Blood group updated to ${userBloodGroup}!`);
        setIsEditingBloodGroup(false);
        if (refreshUser) await refreshUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update blood group');
    } finally {
      setIsSavingBloodGroup(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name.trim() || !formData.contact_number.trim() || !formData.blood_group) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await api.post('/blood/requests', formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Blood request posted! Matching donors have been notified.');
        setFormData({
          patient_name: '',
          contact_number: '',
          blood_group: 'O+',
          units_needed: 1,
          urgency: 'NORMAL',
          hospital_name: '',
          additional_notes: ''
        });
        setActiveTab('browse');
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post blood request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleVolunteer = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.post(`/blood/requests/${requestId}/volunteer`);
      if (res.data?.success) {
        toast.success(res.data.message || "Thank you for volunteering! You've pledged to donate blood.");
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register volunteer pledge');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelVolunteer = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to withdraw your donation pledge?')) return;
    setActionLoadingId(requestId);
    try {
      const res = await api.delete(`/blood/requests/${requestId}/volunteer`);
      if (res.data?.success) {
        toast.info('Donation pledge withdrawn.');
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel pledge');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this blood request?')) return;
    setActionLoadingId(requestId);
    try {
      const res = await api.patch(`/blood/requests/${requestId}/cancel`);
      if (res.data?.success) {
        toast.success('Blood request cancelled.');
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesBloodGroup = selectedBloodGroupFilter === 'ALL' || req.blood_group === selectedBloodGroupFilter;
    const matchesUrgency = selectedUrgencyFilter === 'ALL' || req.urgency === selectedUrgencyFilter;
    const matchesSearch =
      !searchQuery ||
      req.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.hospital_name && req.hospital_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.additional_notes && req.additional_notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesBloodGroup && matchesUrgency && matchesSearch;
  });

  const matchingYourBloodCount = requests.filter(
    (r) => user?.blood_group && r.blood_group === user.blood_group && r.status === 'OPEN'
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Hero Banner with Modern Blood Bank Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-rose-700/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/30 border border-rose-400/40 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md text-rose-200">
              <Droplet className="w-3.5 h-3.5 fill-rose-300 text-rose-200 animate-pulse" />
              Campus Emergency Lifesaver Network
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              🩸 Blood Donation Bank
            </h1>
            <p className="text-sm sm:text-base text-rose-100/90 font-medium leading-relaxed">
              Connect donors with patients in urgent medical need. Instant notifications match your blood group to help save lives across our college campus.
            </p>
          </div>

          {/* User Blood Group Profile Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-xl flex flex-col gap-3 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-rose-200 font-bold">
              <span>Your Blood Group</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {isEditingBloodGroup ? (
              <div className="space-y-2">
                <select
                  value={userBloodGroup}
                  onChange={(e) => setUserBloodGroup(e.target.value)}
                  className="w-full p-2 bg-slate-900 text-white border border-rose-400/60 rounded-xl font-black text-sm outline-hidden focus:ring-2 focus:ring-rose-400"
                >
                  <option value="">Select Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateBloodGroup}
                    disabled={isSavingBloodGroup}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    {isSavingBloodGroup ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditingBloodGroup(false)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shadow-lg border border-rose-400/50">
                    {user?.blood_group || '—'}
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">
                      {user?.blood_group ? `${user.blood_group} Donor` : 'Not Set Yet'}
                    </p>
                    <p className="text-[11px] text-rose-200">
                      {user?.blood_group ? 'Active in notification pool' : 'Set to receive matching alerts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserBloodGroup(user?.blood_group || '');
                    setIsEditingBloodGroup(true);
                  }}
                  className="text-xs px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg font-bold text-white transition-all cursor-pointer"
                >
                  {user?.blood_group ? 'Edit' : 'Set'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-rose-700/40">
          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-600/30">
            <p className="text-xs text-rose-200 font-semibold">Active Requests</p>
            <p className="text-2xl font-black text-white">{requests.filter((r) => r.status === 'OPEN').length}</p>
          </div>
          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-600/30">
            <p className="text-xs text-rose-200 font-semibold">Matching Your Group</p>
            <p className="text-2xl font-black text-rose-300">{matchingYourBloodCount}</p>
          </div>
          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-600/30">
            <p className="text-xs text-rose-200 font-semibold">Your Pledges</p>
            <p className="text-2xl font-black text-emerald-300">{myDonations.length}</p>
          </div>
          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-600/30">
            <p className="text-xs text-rose-200 font-semibold">Fulfilled Requests</p>
            <p className="text-2xl font-black text-amber-300">{requests.filter((r) => r.status === 'FULFILLED').length}</p>
          </div>
        </div>
      </div>

      {/* Matching Blood Group Alert Box if user has matching urgent requests */}
      {matchingYourBloodCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-50 via-rose-100/70 to-amber-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between gap-4 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-black text-rose-950 text-sm">
                Urgent: {matchingYourBloodCount} request(s) match your blood group ({user?.blood_group})!
              </p>
              <p className="text-xs text-rose-800 font-medium">
                Your prompt donation pledge could save a life today. Please review the requests below.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedBloodGroupFilter(user?.blood_group || 'ALL');
              setActiveTab('browse');
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            View Matching
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            All Blood Requests ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab('post')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'post'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Post Blood Request
          </button>

          <button
            onClick={() => setActiveTab('my-activity')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-activity'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            My Activity ({myDonations.length + myRequests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE REQUESTS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, hospital, notes..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
              />
            </div>

            {/* Blood Group Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Group:
              </span>
              <button
                onClick={() => setSelectedBloodGroupFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedBloodGroupFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All
              </button>
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedBloodGroupFilter(bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedBloodGroupFilter === bg
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            {/* Urgency Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Urgency:</span>
              <select
                value={selectedUrgencyFilter}
                onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-hidden"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">🚨 Critical Only</option>
                <option value="URGENT">⚠️ Urgent Only</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
          </div>

          {/* Requests Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Droplet className="w-8 h-8 animate-bounce mx-auto text-rose-500" />
              <p className="font-bold text-sm">Loading blood donation requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No Blood Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {selectedBloodGroupFilter !== 'ALL'
                  ? `No active requests found for blood group ${selectedBloodGroupFilter}. Try selecting 'All'.`
                  : 'There are currently no active blood donation requests. If someone is in need, click "Post Blood Request".'}
              </p>
              <button
                onClick={() => setActiveTab('post')}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Post New Blood Request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req) => {
                const isGroupMatch = user?.blood_group && req.blood_group === user.blood_group;
                const isFulfilled = req.volunteer_count >= req.units_needed;
                const isCritical = req.urgency === 'CRITICAL';
                const isUrgent = req.urgency === 'URGENT';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-xl ${
                      isCritical
                        ? 'border-rose-400/80 shadow-rose-500/10 ring-2 ring-rose-500/20'
                        : isGroupMatch
                        ? 'border-rose-300 shadow-rose-200/50'
                        : 'border-slate-200 hover:border-rose-200'
                    }`}
                  >
                    {/* Urgency Highlight Top Stripe */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isCritical
                          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 animate-pulse'
                          : isUrgent
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div className="space-y-4">
                      {/* Card Top: Blood Group Badge & Urgency Tag */}
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-rose-600/30 border border-rose-400">
                            {req.blood_group}
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Target Units
                            </span>
                            <p className="text-lg font-black text-slate-900 leading-none">
                              {req.units_needed} Unit{req.units_needed > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {isCritical ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <ShieldAlert className="w-3.5 h-3.5" /> Critical
                            </span>
                          ) : isUrgent ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" /> Urgent
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px] uppercase">
                              Normal
                            </span>
                          )}

                          {req.status === 'FULFILLED' && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Target Met
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matching Blood Group Notice */}
                      {isGroupMatch && req.status === 'OPEN' && (
                        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 font-bold flex items-center gap-2">
                          <Droplet className="w-4 h-4 fill-rose-600 text-rose-600 shrink-0" />
                          <span>Your blood group matches this emergency!</span>
                        </div>
                      )}

                      {/* Patient & Hospital Info */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Patient Name</span>
                          <p className="font-black text-slate-900 text-base">{req.patient_name}</p>
                        </div>

                        {req.hospital_name && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.hospital_name}</span>
                          </div>
                        )}

                        {req.additional_notes && (
                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs italic font-medium leading-relaxed">
                            "{req.additional_notes}"
                          </p>
                        )}
                      </div>

                      {/* Units Progress Bar */}
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Volunteers Pledged:</span>
                          <span className={req.volunteer_count >= req.units_needed ? 'text-emerald-600 font-black' : 'text-slate-900'}>
                            {req.volunteer_count} / {req.units_needed} Donors
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              req.volunteer_count >= req.units_needed
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-rose-500 to-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (req.volunteer_count / req.units_needed) * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Contact Details Box (Unlocked when requirements met or user is owner/pledged) */}
                      {req.can_view_contact ? (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 animate-in fade-in">
                          <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            Contact Person / Hospital Details:
                          </p>
                          <p className="font-bold text-slate-900 text-sm">{req.patient_name}</p>
                          <a
                            href={`tel:${req.contact_number}`}
                            className="inline-flex items-center gap-1.5 text-emerald-700 font-mono font-black text-sm hover:underline"
                          >
                            📞 {req.contact_number}
                          </a>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Contact number reveals once required units ({req.units_needed}) are pledged by donors.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>By {req.requester_name}</span>
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>

                      {req.is_owner ? (
                        <div className="flex gap-2 pt-1">
                          {req.status === 'OPEN' && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="pt-1">
                          {req.has_pledged ? (
                            <div className="flex gap-2">
                              <div className="flex-1 py-2.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                You Pledged to Donate
                              </div>
                              <button
                                onClick={() => handleCancelVolunteer(req.id)}
                                disabled={actionLoadingId === req.id}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                                title="Withdraw Pledge"
                              >
                                Withdraw
                              </button>
                            </div>
                          ) : req.status === 'OPEN' ? (
                            <button
                              onClick={() => handleVolunteer(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                              <Heart className="w-4 h-4 fill-white" />
                              🩸 I'm Ready to Give Blood
                            </button>
                          ) : (
                            <div className="py-2.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl text-center">
                              Requirement Fulfilled
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POST NEW REQUEST */}
      {activeTab === 'post' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2 text-center pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-md">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Post a Blood Donation Request</h2>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Broadcast an emergency blood requirement. All students and staff members with matching blood groups will receive an instant notification.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Contact Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Required Blood Group *</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full p-3 bg-rose-50/50 border border-rose-200 rounded-xl font-black text-sm text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg} Blood Group
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Units Needed *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={formData.units_needed}
                  onChange={(e) => setFormData({ ...formData, units_needed: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Urgency Level *</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">⚠️ Urgent (Within 24 Hours)</option>
                  <option value="CRITICAL">🚨 Critical Emergency (Immediate)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Hospital / Location</label>
              <input
                type="text"
                value={formData.hospital_name}
                onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                placeholder="e.g. Apollo Hospital, Anantapur / Campus Medical Center"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Additional Notes / Patient Condition</label>
              <textarea
                rows={3}
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Specify any relevant details (e.g., Surgery scheduled tomorrow at 9 AM, attendants present in room 302)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden"
              />
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Automated Matching Notification System</p>
                <p className="text-[11px] text-rose-800">
                  When you submit, all campus members with blood group <strong>{formData.blood_group}</strong> will instantly receive a notification on their device.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              {isSubmittingRequest ? (
                'Broadcasting Request...'
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  Post Blood Request & Notify Matching Donors
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY ACTIVITY */}
      {activeTab === 'my-activity' && (
        <div className="space-y-8">
          {/* Section A: Requests I've Volunteered For */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
              Requests You Volunteered For ({myDonations.length})
            </h3>

            {myDonations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-bold">
                You haven't volunteered for any blood donation requests yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myDonations.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-black text-xs">
                        {item.blood_group} Blood
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Pledged on {new Date(item.pledged_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">{item.patient_name}</p>
                      <p className="text-xs text-slate-500">{item.hospital_name || 'Hospital location'}</p>
                    </div>

                    {/* Contact details */}
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between">
                      <span>Contact: {item.patient_name}</span>
                      <a href={`tel:${item.contact_number}`} className="text-emerald-700 underline font-mono">
                        {item.contact_number}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Requests Created By Me */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-rose-600" />
              Blood Requests Posted By You ({myRequests.length})
            </h3>

            {myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-bold">
                You haven't posted any blood requests yet.
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-rose-600 text-white rounded-xl font-black text-sm">
                          {req.blood_group}
                        </span>
                        <div>
                          <p className="font-black text-slate-900 text-base">{req.patient_name}</p>
                          <p className="text-xs text-slate-500">
                            {req.units_needed} Units Needed • Status: <span className="font-bold">{req.status}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        {req.volunteer_count} / {req.units_needed} Donors Pledged
                      </span>
                    </div>

                    {/* Donors List */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Volunteer Donors Who Stepped Forward:</p>
                      {(!req.donors || req.donors.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No donors have pledged yet. Notifications have been dispatched.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {req.donors.map((donor: any) => (
                            <div key={donor.donor_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900">{donor.donor_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{donor.donor_email}</p>
                              </div>
                              {donor.donor_phone && (
                                <a href={`tel:${donor.donor_phone}`} className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs">
                                  Call
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
