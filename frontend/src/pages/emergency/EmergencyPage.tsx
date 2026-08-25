import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { Phone, ShieldAlert, Clock, MapPin, PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export const EmergencyPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState('SECURITY');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('24/7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'SUPER_ADMIN' || hasPermission('MANAGE_EMERGENCY');

  const fetchEmergency = async () => {
    try {
      const res = await api.get('/info/emergency');
      setContacts(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergency();
  }, []);

  const openCreateModal = () => {
    setEditingContact(null);
    setName('');
    setContactType('SECURITY');
    setPhone('');
    setLocation('Campus Main');
    setAvailability('24/7');
    setShowModal(true);
  };

  const openEditModal = (c: any) => {
    setEditingContact(c);
    setName(c.name || '');
    setContactType(c.contact_type || 'SECURITY');
    setPhone(c.phone || '');
    setLocation(c.location || '');
    setAvailability(c.availability || '24/7');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactType.trim() || !phone.trim()) {
      toast.error('Name, contact type, and phone number are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        contactType: contactType.trim(),
        phone: phone.trim(),
        location: location.trim() || 'Campus Main',
        availability: availability.trim() || '24/7'
      };

      if (editingContact) {
        await api.put(`/info/emergency/${editingContact.id}`, payload);
        toast.success('Emergency contact updated successfully!');
      } else {
        await api.post('/info/emergency', payload);
        toast.success('New emergency contact added successfully!');
      }

      setShowModal(false);
      fetchEmergency();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save emergency contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, contactName: string) => {
    if (!window.confirm(`Are you sure you want to delete emergency contact "${contactName}"?`)) return;

    try {
      await api.delete(`/info/emergency/${id}`);
      toast.success('Emergency contact deleted');
      fetchEmergency();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  if (isLoading) return <LoadingState message="Loading Emergency Contacts Directory..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-extrabold uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3" /> Urgent Response
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Campus Emergency Directory</h1>
          <p className="text-xs text-rose-200">Immediate campus security, medical desk, warden office, and safety helplines</p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" /> Add Emergency Contact
          </button>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3 shadow-2xs">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">No Emergency Contacts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            {canManage
              ? 'Click "Add Emergency Contact" to add official helplines to the campus directory.'
              : 'Emergency contacts directory is currently empty.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all space-y-3.5 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {c.contact_type}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.availability}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900">{c.name}</h3>

              <div className="flex items-center gap-2.5 text-orange-700 bg-orange-50 border border-orange-200/80 p-3 rounded-xl font-black text-base shadow-2xs">
                <Phone className="w-4.5 h-4.5 shrink-0 text-orange-600" />
                <span>{c.phone}</span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                <MapPin className="w-4 h-4 text-slate-400" /> Location: {c.location}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                {editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Gate Security Desk"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Type / Category *</label>
                  <input
                    type="text"
                    required
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value.toUpperCase())}
                    placeholder="e.g. SECURITY, MEDICAL, WARDEN"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 uppercase outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone / Helpline *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Campus Main Gate Block A"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Availability / Working Hours</label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. 24/7 or 8:00 AM - 8:00 PM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold rounded-xl shadow-md shadow-rose-600/30 hover:from-rose-500 hover:to-pink-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Add Contact'}
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


