import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { Megaphone, PlusCircle, Pencil, Trash2, X, AlertTriangle, Info, BellRing, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageAnnouncements = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') || (user?.permissions?.includes('MANAGE_ANNOUNCEMENTS') ?? false);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setPriority('NORMAL');
    setTargetAudience('ALL');
    setShowModal(true);
  };

  const openEditModal = (anc: any) => {
    setEditingItem(anc);
    setTitle(anc.title);
    setDescription(anc.description || '');
    setPriority(anc.priority || 'NORMAL');
    setTargetAudience(anc.target_audience || 'ALL');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/announcements/${editingItem.id}`, { title, description, priority, targetAudience });
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', { title, description, priority, targetAudience });
        toast.success('Announcement published successfully!');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Sleek Banner Header - Matching Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <Megaphone className="w-3 h-3" /> Circulars & News
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Campus Announcements</h1>
            <p className="text-xs text-slate-300 font-medium">Official college notifications, emergency alerts, and circulars.</p>
          </div>

          {canManageAnnouncements && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Post Announcement
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading official announcements..." />
      ) : announcements.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
          <Megaphone className="w-8 h-8 text-orange-500 mx-auto" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">No Active Announcements</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {canManageAnnouncements
              ? 'Click "Post Announcement" to broadcast official notifications to students and mentors.'
              : 'Check back soon for official college circulars and notifications.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {announcements.map((anc) => (
            <div
              key={anc.id}
              className={`bg-white rounded-2xl border shadow-2xs p-4 space-y-3 transition-all hover:shadow-md hover:border-orange-300 flex flex-col justify-between ${
                anc.priority === 'URGENT'
                  ? 'border-rose-300/80 bg-rose-50/20'
                  : anc.priority === 'IMPORTANT'
                  ? 'border-amber-300/80 bg-amber-50/20'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md border uppercase tracking-wider ${
                        anc.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : anc.priority === 'IMPORTANT'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-orange-50 text-orange-800 border-orange-200'
                      }`}
                    >
                      {anc.priority}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-md">
                      {anc.target_audience}
                    </span>
                  </div>

                  {canManageAnnouncements && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(anc)}
                        className="p-1 text-slate-600 hover:text-orange-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(anc.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">{anc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mt-1 line-clamp-4">{anc.description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium mt-2">
                <span>Broadcasted by Administration</span>
                <span>{new Date(anc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-orange-600" /> {editingItem ? 'Edit Announcement' : 'Post New Announcement'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campus Holiday Schedule & Semester Exam Timetable"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all text-xs"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write clear instructions for students and mentors..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Priority Level *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Target Audience *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  >
                    <option value="ALL">All Students & Mentors</option>
                    <option value="JUNIOR">Juniors Only</option>
                    <option value="SENIOR">Senior Mentors Only</option>
                    <option value="DIRECTOR">Directors Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                >
                  {isSubmitting ? 'Publishing...' : editingItem ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
