import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, ArrowLeft, Zap, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CommonIssue {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  descriptionPlaceholder: string;
}

const COMMON_ISSUES_MAP: Record<string, CommonIssue[]> = {
  Academics: [
    { title: 'Need Academic Mentorship / Tutoring Support', priority: 'MEDIUM', descriptionPlaceholder: 'Specify subject name, topic, or area where you need senior mentor support...' },
    { title: 'Project / Lab Work Guidance Request', priority: 'MEDIUM', descriptionPlaceholder: 'Provide lab name, project title, and specific guidance needed...' },
    { title: 'Assignment Submission Moodle Portal Issue', priority: 'MEDIUM', descriptionPlaceholder: 'Mention assignment name, subject, and Moodle portal issue details...' },
    { title: 'Syllabus Notes / Study Material Request', priority: 'LOW', descriptionPlaceholder: 'Specify unit number and subject study materials required...' },
    { title: 'Attendance Percentage Shortage / Condonation Query', priority: 'MEDIUM', descriptionPlaceholder: 'Provide current attendance percentage and subject details...' },
  ],
  Hostel: [
    { title: 'Plumbing / Water Supply Disruption in Room', priority: 'HIGH', descriptionPlaceholder: 'Specify room number and exact plumbing issue (e.g. Block C, Room 304 - main tap leaking)...' },
    { title: 'Electrical Failure / Power Cut in Hostel Block', priority: 'HIGH', descriptionPlaceholder: 'Specify hostel block and room number affected...' },
    { title: 'Hostel Wi-Fi / Internet Network Down', priority: 'MEDIUM', descriptionPlaceholder: 'Mention block number and Wi-Fi SSID experiencing connection drops...' },
    { title: 'Furniture / Bed / Door Maintenance Repair', priority: 'LOW', descriptionPlaceholder: 'Specify damaged item in room and requested maintenance repair...' },
  ],
  Safety: [
    { title: 'Campus Security & Safety Concern', priority: 'HIGH', descriptionPlaceholder: 'Specify campus location and security concern...' },
    { title: 'Student Harassment / Bullying Complaint', priority: 'HIGH', descriptionPlaceholder: 'Provide details regarding harassment or safety concern...' },
    { title: 'Emergency First Aid / Medical Assistance Need', priority: 'CRITICAL', descriptionPlaceholder: 'Provide location and urgent medical requirement...' },
  ],
  Transport: [
    { title: 'Bus Route / Timing Delay Complaint', priority: 'MEDIUM', descriptionPlaceholder: 'Specify bus route number, stop name, and delay time...' },
    { title: 'Bus Driver / Transport Staff Conduct Issue', priority: 'HIGH', descriptionPlaceholder: 'Mention bus number, date, time, and conduct complaint details...' },
  ],
  Technical: [
    { title: 'Moodle Issue', priority: 'MEDIUM', descriptionPlaceholder: 'Provide Moodle account, course name, and specific error details...' },
    { title: 'College Email / Wi-Fi Credentials Reset', priority: 'MEDIUM', descriptionPlaceholder: 'Specify registered college email or user handle needing password reset...' },
  ],
  'ID Card': [
    { title: 'Lost / Damaged Physical ID Card Reissuance', priority: 'LOW', descriptionPlaceholder: 'Mention student roll number, department, and reason for replacement ID...' },
  ],
  Accommodation: [
    { title: 'Hostel Room Change / Allocation Request', priority: 'MEDIUM', descriptionPlaceholder: 'Provide current room number, preferred block, and reason for room change request...' },
  ],
  Other: [
    { title: 'General Support / Custom Query', priority: 'MEDIUM', descriptionPlaceholder: 'Describe your custom query or request in detail...' },
  ]
};

export const CreateIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedCommonIssueTitle, setSelectedCommonIssueTitle] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [autoPrioritySet, setAutoPrioritySet] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('Provide complete details, room number, date, or specific guidance needed...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/issues/categories');
        const catList = res.data.data || [];
        setCategories(catList);
        if (catList.length > 0) {
          setCategoryId(catList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const selectedCategoryObj = categories.find(c => c.id === categoryId);
  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : '';
  const availableCommonIssues = COMMON_ISSUES_MAP[selectedCategoryName] || [];

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSelectedCommonIssueTitle('');
    setTitle('');
    setAutoPrioritySet(false);
    setPlaceholderText('Provide complete details, room number, date, or specific guidance needed...');
  };

  const handleCommonIssueSelect = (selectedTitle: string) => {
    setSelectedCommonIssueTitle(selectedTitle);
    if (!selectedTitle || selectedTitle === 'CUSTOM') {
      setTitle('');
      setAutoPrioritySet(false);
      setPlaceholderText('Provide complete details, room number, date, or specific guidance needed...');
      return;
    }

    const matchedIssue = availableCommonIssues.find(i => i.title === selectedTitle);
    if (matchedIssue) {
      setTitle(matchedIssue.title);
      setPriority(matchedIssue.priority);
      setAutoPrioritySet(true);
      if (matchedIssue.descriptionPlaceholder) {
        setPlaceholderText(matchedIssue.descriptionPlaceholder);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      toast.error('Please complete all required issue fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/issues', {
        title,
        description,
        categoryId,
        priority
      });
      toast.success(`Issue #${res.data.data.issue_number} raised successfully!`);
      navigate(`/issues/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to raise issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-orange-600" /> Back to Issues Hub
      </button>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-600" /> Raise New Support Issue Ticket
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Select a category and common issue template for instant auto-prioritization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              1. Issue Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Common Issues Predefined Selector */}
          {availableCommonIssues.length > 0 && (
            <div className="bg-orange-50/60 border border-orange-200/70 p-3.5 rounded-xl space-y-2">
              <label className="block text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" /> 2. Select Common Issue Type (Auto-Sets Priority)
              </label>
              <select
                value={selectedCommonIssueTitle}
                onChange={(e) => handleCommonIssueSelect(e.target.value)}
                className="w-full p-2.5 bg-white border border-orange-300/80 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="">-- Choose Common {selectedCategoryName} Issue --</option>
                {availableCommonIssues.map((ci) => (
                  <option key={ci.title} value={ci.title}>
                    [{ci.priority}] {ci.title}
                  </option>
                ))}
                <option value="CUSTOM">✏️ Custom Title (Type Manually)</option>
              </select>
            </div>
          )}

          {/* Issue Title Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              3. Issue Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSelectedCommonIssueTitle('CUSTOM');
                setAutoPrioritySet(false);
              }}
              placeholder="Brief summary of the issue (e.g., Library access error)..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
            />
          </div>

          {/* Priority Selector with Auto-Set Badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                4. Priority Level *
              </label>
              {autoPrioritySet ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                  <Lock className="w-3 h-3 text-indigo-600" /> Preset Priority by Standard
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">Custom priority selection active</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={autoPrioritySet}
                  onClick={() => setPriority(p)}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                    priority === p
                      ? p === 'CRITICAL'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : p === 'HIGH'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : p === 'MEDIUM'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-700 text-white border-slate-700 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50'
                  } ${autoPrioritySet ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Description Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              5. Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={placeholderText}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            {isSubmitting ? 'Submitting Issue Ticket...' : 'Submit Support Issue Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};
