import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Calendar, Clock, MapPin, Link2, Users, X, Check, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated?: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingCreated
}) => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [targetJuniorId, setTargetJuniorId] = useState('');
  const [assignedJuniors, setAssignedJuniors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default meeting time to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setMeetingDate(tomorrow.toISOString().slice(0, 16));

      // Fetch assigned juniors list for selector
      const fetchJuniors = async () => {
        try {
          const res = await api.get('/users');
          const users = res.data.data || [];
          setAssignedJuniors(users.filter((u: any) => u.role === 'JUNIOR'));
        } catch (err) {
          console.error(err);
        }
      };
      fetchJuniors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetingDate || !location.trim()) {
      toast.error('Please fill in meeting title, date/time, and location.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/meetings', {
        title: title.trim(),
        meetingDate,
        location: location.trim(),
        meetingLink: meetingLink.trim() || null,
        agenda: agenda.trim() || null,
        targetJuniorId: targetJuniorId || null
      });

      toast.success('Mentorship meeting scheduled successfully!');
      // Reset form
      setTitle('');
      setLocation('');
      setMeetingLink('');
      setAgenda('');
      setTargetJuniorId('');
      onClose();
      if (onMeetingCreated) onMeetingCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Schedule Mentorship Meeting
            </h3>
            <p className="text-xs text-slate-500">
              Set time & place for student mentorship review. Visible to assigned juniors.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-black text-slate-700 mb-1">
              Meeting Title / Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Academic Progress Review & Project Check-in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" /> Date & Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" /> Location / Room *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lab 302 / Faculty Cabin 12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-black text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-600" /> Invite Student Target Scope
            </label>
            <select
              value={targetJuniorId}
              onChange={(e) => setTargetJuniorId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- All Assigned Juniors --</option>
              {assignedJuniors.map((j) => (
                <option key={j.junior_id || j.id} value={j.junior_id || j.id}>
                  {j.name} ({j.register_number || 'Junior'}) - {j.department || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-black text-slate-700 mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-orange-600" /> Online Meeting Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-abc or Zoom link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-black text-slate-700 mb-1">
              Agenda Notes & Discussion Topics (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief notes on what students should prepare or bring for the meeting..."
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
