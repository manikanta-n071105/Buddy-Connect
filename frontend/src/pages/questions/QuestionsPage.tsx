import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Question } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { FileQuestion, PlusCircle, X, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const QuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [overallQuestionsPercent, setOverallQuestionsPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Senior assigned juniors selection
  const [juniorsList, setJuniorsList] = useState<any[]>([]);
  const [selectedJuniorId, setSelectedJuniorId] = useState<string>('');

  // Add Question Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('TEXT');
  const [qCategory, setQCategory] = useState('GENERAL');
  const [qAnswerGuide, setQAnswerGuide] = useState('');

  const canManageQuestions = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') || (user?.permissions?.includes('MANAGE_QUESTIONS') ?? false);
  const isSenior = user?.role === 'SENIOR';

  // Fetch Assigned Juniors for Senior Mentor
  useEffect(() => {
    if (isSenior) {
      api.get('/users?role=JUNIOR').then((res) => {
        const junArr = res.data.data;
        setJuniorsList(junArr);
        if (junArr.length > 0) {
          setSelectedJuniorId(junArr[0].junior_id || junArr[0].id);
        }
      }).catch(console.error);
    }
  }, [isSenior]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      let url = '/onboarding/questions';
      if (isSenior && selectedJuniorId) {
        url += `?juniorId=${selectedJuniorId}`;
      }
      const res = await api.get(url);
      setQuestions(res.data.data.questions);
      setResponses(res.data.data.responses || {});
      setOverallQuestionsPercent(res.data.data.overallQuestionsPercent || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedJuniorId]);

  const handleChange = (questionId: string, val: any) => {
    if (isSenior) return;
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], text: val }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSenior) return;

    setIsSubmitting(true);
    try {
      const payload = Object.entries(responses).map(([qId, val]) => ({
        questionId: qId,
        responseText: typeof val === 'object' ? val.text : val
      }));
      await api.post('/onboarding/questions', { responses: payload });
      toast.success('Question responses saved successfully');
    } catch (err) {
      toast.error('Failed to submit responses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText) {
      toast.error('Question text is required');
      return;
    }

    try {
      await api.post('/onboarding/questions/create', {
        questionText: qText.trim(),
        questionType: qType,
        category: qCategory.trim(),
        answerGuide: qAnswerGuide.trim()
      });

      toast.success('Common question / FAQ added!');
      setShowAddModal(false);
      setQText('');
      setQAnswerGuide('');
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add question');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sleek Banner Header - Matching Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <FileQuestion className="w-3 h-3" /> FAQs & Knowledgebase
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Common Questions</h1>
            <p className="text-xs text-slate-300 font-medium">Standard FAQs and orientation guidelines curated by mentors.</p>
          </div>

          {canManageQuestions && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Question
            </button>
          )}
        </div>
      </div>

      {/* Senior / Director Mentor Aggregated Questions Average Banner */}
      {['SENIOR', 'DIRECTOR'].includes(user?.role || '') && (
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-emerald-800/80">
          <div className="space-y-1">
            <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-emerald-400" /> Assigned Juniors Questionnaire Completion Rate
            </h3>
            <p className="text-xs text-emerald-200 font-medium">Aggregated response completion rate across all your assigned student mentees</p>
          </div>
          <div className="bg-emerald-900/90 border border-emerald-700/80 px-5 py-2.5 rounded-xl text-right shrink-0 shadow-inner">
            <span className="text-3xl font-black text-emerald-300">{overallQuestionsPercent}%</span>
            <span className="block text-[10px] text-emerald-200 font-extrabold uppercase tracking-wider">Assigned Avg</span>
          </div>
        </div>
      )}

      {/* Senior Selector Bar */}
      {isSenior && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-indigo-950">Inspect Individual Assigned Junior Question Answers:</span>
          </div>
          <select
            value={selectedJuniorId}
            onChange={(e) => setSelectedJuniorId(e.target.value)}
            className="p-2.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 outline-hidden"
          >
            {juniorsList.map((j) => (
              <option key={j.junior_id || j.id} value={j.junior_id || j.id}>
                {j.name} ({j.register_number || 'Junior'})
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading Common Questions & FAQs..." />
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2.5 pb-5 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-900">
                  {idx + 1}. {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                </label>
                {q.category && (
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                    {q.category}
                  </span>
                )}
              </div>

              {q.question_type === 'YES_NO' ? (
                <div className="flex gap-4 pt-1">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        disabled={isSenior}
                        checked={responses[q.id]?.text === opt}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={isSenior}
                  value={responses[q.id]?.text || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={isSenior ? 'Student response will appear here...' : 'Type your answer...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all"
                />
              )}

              {/* Standard Answer / Guide Banner if available */}
              {q.answer_guide && (
                <div className="mt-2.5 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-amber-900 block text-[11px] uppercase tracking-wider">Official Standard Answer Guide:</span>
                    <span className="text-slate-700 font-medium leading-relaxed">{q.answer_guide}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {user?.role === 'JUNIOR' && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving Responses...' : 'Save Questionnaire Responses'}
            </button>
          )}
        </form>
      )}

      {/* Add Question Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-orange-600" /> Super Admin: Create Question / FAQ
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <input
                  type="text"
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Where do I submit physical hardcopies of my certificates?"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Answer Type *</label>
                  <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden">
                    <option value="TEXT">Short Text</option>
                    <option value="YES_NO">Yes / No Radio</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                    placeholder="e.g. ADMISSIONS"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Answer Guide (Official FAQ Answer)</label>
                <textarea
                  rows={3}
                  value={qAnswerGuide}
                  onChange={(e) => setQAnswerGuide(e.target.value)}
                  placeholder="Provide the official answer so junior students get immediate guidance..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer">Create Common Question</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

