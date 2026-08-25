import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { Calendar, MapPin, Clock, PlusCircle, Pencil, Trash2, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Post / Edit Event
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timings, setTimings] = useState('');
  const [place, setPlace] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageEvents = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') || (user?.permissions?.includes('MANAGE_EVENTS') ?? false);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load college events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setTimings('');
    setPlace('');
    setPosterUrl('');
    setShowModal(true);
  };

  const openEditModal = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setTimings(ev.timings);
    setPlace(ev.place);
    setPosterUrl(ev.poster_url || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !timings || !place) {
      toast.error('Title, timings, and place are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, { title, description, timings, place, posterUrl });
        toast.success('College event updated');
      } else {
        await api.post('/events', { title, description, timings, place, posterUrl });
        toast.success('New college event published!');
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('College event deleted');
      fetchEvents();
    } catch (err: any) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Sleek Banner Header - Matching Polls Design */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <Calendar className="w-3 h-3" /> College Events
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Campus Events & Bulletin</h1>
            <p className="text-xs text-slate-300 font-medium">Official college workshops, cultural fests, orientations, and seminars.</p>
          </div>

          {canManageEvents && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Post New Event
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading campus events & schedules..." />
      ) : events.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
          <Calendar className="w-8 h-8 text-orange-500 mx-auto" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">No College Events Scheduled Currently</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {canManageEvents
              ? 'Click "Post New Event" to broadcast upcoming orientation workshops or campus meetings.'
              : 'Check back soon for upcoming campus hackathons and workshops.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md hover:border-orange-300">
              <div>
                {/* Poster image if provided */}
                {ev.poster_url ? (
                  <div className="h-40 w-full bg-slate-900 overflow-hidden relative border-b border-slate-100">
                    <img
                      src={ev.poster_url}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 p-3.5 flex items-center justify-between text-white border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-orange-400 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" /> OFFICIAL CAMPUS EVENT
                    </div>
                  </div>
                )}

                {/* Event Content */}
                <div className="p-4 space-y-2.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">{ev.title}</h3>

                  {/* Badges for Timings & Place */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200/80 text-orange-800 rounded-md">
                      <Clock className="w-3 h-3 text-orange-600" /> {ev.timings}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-md">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {ev.place}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3">{ev.description}</p>
                </div>
              </div>

              {/* Event Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium">
                <span>Posted by Administration</span>

                {canManageEvents && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="px-2 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 font-bold"
                    >
                      <Pencil className="w-3 h-3 text-orange-600" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="px-2 py-1 text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-600" /> {editingEvent ? 'Edit College Event' : 'Post New College Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Technical Fest & Hackathon 2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all text-xs"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Event Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief details about schedule, guidelines, and registration..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Date & Timings *</label>
                  <input
                    type="text"
                    required
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    placeholder="e.g. Oct 24, 10:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] outline-hidden"
                />
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
                  {isSubmitting ? 'Publishing...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
