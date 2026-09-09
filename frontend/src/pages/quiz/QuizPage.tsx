import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { DEPARTMENT_OPTIONS } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  BarChart3,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  Users,
  AlertCircle,
  ChevronRight,
  FileText,
  Sparkles,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  Check,
  TrendingUp,
  GraduationCap,
  Download,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export const QuizPage: React.FC = () => {
  const { user } = useAuth();
  const isFacultyOrAdmin = ['FACULTY', 'SUPER_ADMIN', 'ADMIN', 'MENTOR'].includes(user?.role || '');

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Faculty Create Quiz Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState('15');
  const [quizDept, setQuizDept] = useState(user?.department || 'CSE-A');
  const [quizYear, setQuizYear] = useState(user?.year || '3rd Year');
  const [csvText, setCsvText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Faculty Results Analytics Modal & Performance Graph View
  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [rosterFilter, setRosterFilter] = useState<'ALL' | 'COMPLETED' | 'INVALIDATED' | 'PENDING'>('ALL');
  const [analyticsTab, setAnalyticsTab] = useState<'GRAPHS' | 'ROSTER'>('GRAPHS');

  // Student Quiz Player State
  const [activeQuizToTake, setActiveQuizToTake] = useState<any>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-conduct Quiz (Faculty resets attempt for single student or all assigned students)
  const handleReconductQuiz = async (quizId: string, juniorId?: string, studentName?: string) => {
    const confirmMsg = juniorId
      ? `Re-conduct quiz for ${studentName || 'this student'}?\n\nThis will clear their previous attempt and allow them to take the exam again.`
      : `Re-conduct quiz for ALL assigned students?\n\nThis will reset all student attempts and proctoring logs for this quiz.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post(`/quizzes/${quizId}/reconduct`, { juniorId });
      toast.success(res.data.message || 'Quiz attempt reset successfully.');
      fetchQuizzes();
      if (selectedQuizAnalytics && selectedQuizAnalytics.id === quizId) {
        handleOpenAnalytics(selectedQuizAnalytics);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reconduct quiz.');
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Anti-Cheating & Proctoring: Detect Tab Switching & Window Focus Loss
  useEffect(() => {
    if (!activeQuizToTake || quizResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            toast.error('⚠️ VIOLATION #1 DETECTED: You switched tabs / left the exam window! Repeating this will automatically invalidate your quiz.', { duration: 6000 });
          } else if (newCount >= 2) {
            toast.error('🚫 PROCTORING VIOLATION: Exam auto-submitted & invalidated due to multiple tab switches!', { duration: 8000 });
            handleStudentSubmitQuiz(true, newCount, 'EXAM AUTO-SUBMITTED & INVALIDATED: Tab switch / Window focus loss detected during active exam');
          }
          return newCount;
        });
      }
    };

    const handleKeySecurity = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
        (e.metaKey && (e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        toast.error('🚫 SCREENSHOT / PRINT BLOCKED: Taking screenshots or printing exam content is strictly prohibited!', { duration: 5000 });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeySecurity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeySecurity);
    };
  }, [activeQuizToTake, quizResult]);

  // Timer countdown for active student quiz player
  useEffect(() => {
    if (!activeQuizToTake || quizResult || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleStudentSubmitQuiz(false, tabSwitchCount, 'Time Expired'); // Auto submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuizToTake, quizResult, timeLeftSeconds]);

  // CSV Spreadsheet Parsing
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setParsedQuestions([]);
      return;
    }

    const lines = text.trim().split('\n');
    const questionsList: any[] = [];

    // Check if header exists
    const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV split
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');

      if (parts.length >= 3) {
        const clean = parts.map(p => p.replace(/^"|"$/g, '').trim());
        questionsList.push({
          questionText: clean[0] || `Question #${i}`,
          optionA: clean[1] || 'Option A',
          optionB: clean[2] || 'Option B',
          optionC: clean[3] || 'Option C',
          optionD: clean[4] || 'Option D',
          correctOption: (clean[5] || 'A').toUpperCase().replace('OPTION_', '')
        });
      }
    }
    setParsedQuestions(questionsList);
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Option
"What is the time complexity of Binary Search in a sorted array?","O(n)","O(log n)","O(n^2)","O(1)","B"
"Which data structure operates on a Last-In First-Out (LIFO) basis?","Queue","Stack","Linked List","Binary Tree","B"
"Which HTTP status code represents 'Created'?","200 OK","201 Created","404 Not Found","500 Internal Server Error","B"
"Which SQL clause is used to filter records based on a specified condition?","GROUP BY","ORDER BY","WHERE","JOIN","C"
"What is the primary function of CPU in a computer system?","Store persistent data","Execute instructions and process data","Render 3D graphics","Manage network connections","B"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'quiz_sample_format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded quiz_sample_format.csv template!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!quizTitle) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setQuizTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1) + ' Quiz');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseCsv(content);
      toast.success(`Spreadsheet loaded! Parsed rows ready for automatic quiz creation.`);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    const sample = `Question,Option A,Option B,Option C,Option D,Correct Option
"What is the time complexity of Binary Search in a sorted array?","O(n)","O(log n)","O(n^2)","O(1)","B"
"Which data structure follows the LIFO (Last In First Out) principle?","Queue","Stack","Linked List","Tree","B"
"Which HTTP status code represents 'Created'?","200 OK","201 Created","404 Not Found","500 Server Error","B"
"Which of the following is a primary key constraint in relational databases?","Uniquely identifies each record","Allows NULL values","Fills dummy text","Increases latency","A"`;
    if (!quizTitle) setQuizTitle('Automated Data Structures Quiz');
    handleParseCsv(sample);
    toast.success('Sample quiz spreadsheet loaded!');
  };

  const handleCreateQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    if (parsedQuestions.length === 0) {
      toast.error('Please upload a spreadsheet or load sample CSV questions');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/quizzes', {
        title: quizTitle.trim(),
        description: quizDesc.trim(),
        durationMinutes: parseInt(quizDuration) || 15,
        department: quizDept,
        year: quizYear,
        questions: parsedQuestions
      });

      toast.success(`Quiz "${quizTitle}" created successfully!`);
      setShowCreateModal(false);
      setQuizTitle('');
      setQuizDesc('');
      setCsvText('');
      setParsedQuestions([]);
      fetchQuizzes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Faculty Quiz Analytics & Performance Graph
  const handleOpenAnalytics = async (quiz: any) => {
    setSelectedQuizAnalytics(quiz);
    setIsLoadingAnalytics(true);
    try {
      const res = await api.get(`/quizzes/${quiz.id}/results`);
      setAnalyticsData(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load quiz performance analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Student Start Quiz
  const handleStartQuiz = async (quiz: any) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/quizzes/${quiz.id}`);
      const data = res.data.data;

      if (data.submission) {
        toast.info(`You have already completed this quiz. Score: ${data.submission.score}/${data.questions.length} (${data.submission.percentage}%)`);
        setIsLoading(false);
        return;
      }

      setActiveQuizToTake(data);
      setStudentAnswers({});
      setQuizResult(null);
      setTimeLeftSeconds((data.quiz.duration_minutes || 15) * 60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Student Submit Quiz (Handles normal submits and tab-switch auto-invalidation)
  const handleStudentSubmitQuiz = async (isViolation = false, switchesCount = tabSwitchCount, reason = '') => {
    if (!activeQuizToTake || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await api.post(`/quizzes/${activeQuizToTake.quiz.id}/submit`, {
        answers: studentAnswers,
        isViolation,
        tabSwitches: switchesCount,
        violationReason: reason || (isViolation ? 'Proctoring Violation: Tab switch / Window focus loss' : null)
      });
      setQuizResult(res.data.data);
      if (isViolation) {
        toast.error('Exam Auto-Submitted & Invalidated due to Tab Switch Violation!', { duration: 8000 });
      } else {
        toast.success('Quiz submitted successfully!');
      }
      fetchQuizzes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading Quizzes & Analytics..." />;

  // ----------------------------------------------------
  // STUDENT ACTIVE QUIZ PLAYER VIEW (Anti-Cheating Protected)
  // ----------------------------------------------------
  if (activeQuizToTake) {
    const questions = activeQuizToTake.questions || [];
    const minutesLeft = Math.floor(timeLeftSeconds / 60);
    const secondsLeft = timeLeftSeconds % 60;

    return (
      <div
        onCopy={(e) => { e.preventDefault(); toast.error('🚫 Copying text is prohibited during active exam!'); }}
        onCut={(e) => { e.preventDefault(); toast.error('🚫 Cut action is prohibited during active exam!'); }}
        onPaste={(e) => { e.preventDefault(); toast.error('🚫 Pasting text is prohibited during active exam!'); }}
        onContextMenu={(e) => { e.preventDefault(); toast.error('🚫 Right-click context menu disabled during exam!'); }}
        className="max-w-4xl mx-auto space-y-6 pb-12 select-none"
      >
        {/* Anti-Cheating Security Status Banner */}
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-950 font-bold">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>🔒 Exam Proctoring Active: Tab Switching & Screen Capture Blocked. Switching tabs will auto-submit & invalidate your exam.</span>
          </div>
          {tabSwitchCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shrink-0">
              {tabSwitchCount} Violation Warning(s)
            </span>
          )}
        </div>

        {/* Top Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4 border border-slate-800">
          <div className="space-y-1">
            <button
              onClick={() => setActiveQuizToTake(null)}
              className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 mb-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
            </button>
            <h1 className="text-xl font-black text-white">{activeQuizToTake.quiz.title}</h1>
            <p className="text-xs text-slate-300 font-medium">{activeQuizToTake.quiz.department} • {activeQuizToTake.quiz.year}</p>
          </div>

          {!quizResult && (
            <div className="bg-rose-500/20 border border-rose-500/30 px-4 py-2 rounded-2xl text-center shrink-0">
              <span className="text-[10px] uppercase font-black tracking-widest text-rose-300 block">Time Remaining</span>
              <span className="text-lg font-black text-rose-400 font-mono">
                {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Quiz Submission Result Card with Score Gauge Graph */}
        {quizResult ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Quiz Completed!</h2>
              <p className="text-xs text-slate-500 font-medium">Your submission has been auto-graded and recorded in the class roster.</p>
            </div>

            {/* SVG Circular Score Percentage Gauge / Graph */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={quizResult.percentage >= 75 ? "text-emerald-500" : quizResult.percentage >= 50 ? "text-indigo-500" : "text-rose-500"}
                  strokeDasharray={`${quizResult.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900">{quizResult.percentage}%</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Score</span>
              </div>
            </div>

            {/* Result Cards */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Score</span>
                <span className="text-lg font-bold text-slate-900">{quizResult.score} / {quizResult.total_points}</span>
              </div>
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl">
                <span className="text-[10px] uppercase font-semibold text-indigo-700 block">Grade Earned</span>
                <span className="text-lg font-bold text-indigo-950">
                  {quizResult.percentage >= 90 ? 'A+' : quizResult.percentage >= 75 ? 'A' : quizResult.percentage >= 50 ? 'B' : 'C'}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
                <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Result Status</span>
                <span className="text-lg font-bold text-emerald-950">
                  {quizResult.percentage >= 50 ? 'Passed' : 'Needs Work'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveQuizToTake(null)}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Return to Quizzes Dashboard
            </button>
          </div>
        ) : (
          /* Question Cards List */
          <div className="space-y-4">
            {questions.map((q: any, idx: number) => {
              const selected = studentAnswers[q.id];
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-start gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {q.question_text}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {q.points} pt
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {[
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setStudentAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          selected === opt.key
                            ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-bold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center shrink-0 ${
                          selected === opt.key ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="text-xs">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => handleStudentSubmitQuiz(false)}
              disabled={isSubmittingQuiz}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmittingQuiz ? 'Submitting Answers...' : 'Submit Quiz & View Score'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN QUIZZES DASHBOARD (Faculty & Students)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Class Quizzes & Analytics Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isFacultyOrAdmin ? 'Faculty Quiz Management & Performance' : 'Class Quizzes & Assessments'}
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-xl">
              {isFacultyOrAdmin
                ? 'Upload Excel/CSV spreadsheets to automatically generate class quizzes, monitor submissions, and analyze student performance graph.'
                : 'Take timed quizzes assigned by your class faculty members and view instant auto-graded scores.'}
            </p>
          </div>

          {isFacultyOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-98"
            >
              <Upload className="w-4 h-4" /> Upload Spreadsheet / Create Quiz
            </button>
          )}
        </div>
      </div>

      {/* Quizzes List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            {isFacultyOrAdmin ? 'My Created Quizzes' : 'Available Class Quizzes'} ({quizzes.length})
          </h2>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">No quizzes available</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              {isFacultyOrAdmin
                ? 'Click "Upload Spreadsheet / Create Quiz" to create your first class assessment.'
                : 'There are no active quizzes assigned to your class right now.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => {
              const isSubmitted = Boolean(quiz.submission_id);
              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-3 py-1 rounded-full bg-indigo-50/80 text-indigo-700 border border-indigo-200/60">
                        {quiz.department} • {quiz.year || 'All Years'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {quiz.duration_minutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">{quiz.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
                      <span className="font-extrabold text-slate-800 text-xs">{quiz.total_questions || 0} Questions</span>
                    </div>

                    {isFacultyOrAdmin ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAnalytics(quiz)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-xl border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Performance Graph
                        </button>
                        <button
                          onClick={() => handleReconductQuiz(quiz.id)}
                          className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-200/80 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                          title="Re-conduct Quiz for All Assigned Students"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      </div>
                    ) : isSubmitted ? (
                      <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {quiz.score}/{quiz.total_questions} ({quiz.percentage}%)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          FACULTY CREATE QUIZ SPREADSHEET MODAL
         ---------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Quiz Spreadsheet</h3>
                  <p className="text-xs text-slate-500 font-medium">Automatic Quiz Generation from Excel / CSV</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuizSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms Quiz #1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="180"
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Branch / Section *</label>
                  <select
                    value={quizDept}
                    onChange={(e) => setQuizDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 outline-hidden cursor-pointer"
                  >
                    {DEPARTMENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Academic Year *</label>
                  <select
                    value={quizYear}
                    onChange={(e) => setQuizYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 outline-hidden cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="All Years">All Years</option>
                  </select>
                </div>
              </div>

              {/* Upload Drop Zone / Paste Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Upload Quiz Spreadsheet File</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" /> Download Sample Template (.csv)
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Load Sample Spreadsheet
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors space-y-2.5">
                  <Upload className="w-6 h-6 text-indigo-600 mx-auto" />
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-700 font-extrabold">
                      Drop your Quiz Excel / CSV file here to conduct quiz automatically
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Columns: <code className="bg-white border border-slate-200 text-slate-800 px-1 py-0.5 rounded text-[10px]">Question, Option A, Option B, Option C, Option D, Correct Option</code>
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* CSV Raw Paste */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">CSV Data Text (Direct Edit / Paste)</label>
                <textarea
                  rows={3}
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  placeholder="Question, Option A, Option B, Option C, Option D, Correct Option..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] outline-hidden"
                />
              </div>

              {/* Parsed Preview Table */}
              {parsedQuestions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" /> Automatically Parsed {parsedQuestions.length} Questions Ready to Conduct!
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/80 p-2 space-y-1.5">
                    {parsedQuestions.map((q, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                        <span className="font-black text-slate-900">Q{idx + 1}: {q.questionText}</span>
                        <div className="text-slate-500 font-medium flex items-center gap-2 text-[10px]">
                          <span>A: {q.optionA}</span> • <span>B: {q.optionB}</span> • <span className="font-bold text-emerald-600">Correct: {q.correctOption}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || parsedQuestions.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isSubmitting ? 'Publishing & Conducting Quiz...' : 'Upload & Launch Quiz Automatically'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          FACULTY QUIZ RESULTS & PERFORMANCE GRAPH ANALYTICS MODAL
         ---------------------------------------------------- */}
      {selectedQuizAnalytics && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-5xl w-full p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            {/* Modal Header with Segmented View Tabs */}
            <div className="space-y-4 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedQuizAnalytics.title} Performance</h3>
                    <p className="text-xs text-slate-500 font-medium">Class Score Distribution, Interactive Dot Graph & Proctoring Audit Log</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReconductQuiz(selectedQuizAnalytics.id)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-98"
                    title="Clear all student attempts and reconduct this quiz for all students"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" /> Re-conduct Quiz for All
                  </button>
                  <button
                    onClick={() => setSelectedQuizAnalytics(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* View Selector Tabs: Graphs vs Roster */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-md">
                <button
                  onClick={() => setAnalyticsTab('GRAPHS')}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsTab === 'GRAPHS'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Performance & Dot Graphs
                </button>
                <button
                  onClick={() => setAnalyticsTab('ROSTER')}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsTab === 'ROSTER'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-4 h-4" /> Student Audit Roster ({analyticsData?.summary?.completedCount || 0})
                </button>
              </div>
            </div>

            {isLoadingAnalytics || !analyticsData ? (
              <LoadingState message="Calculating Class Quiz Performance & Rendering Graphs..." />
            ) : (
              <div className="space-y-6 overflow-y-auto pr-1">
                {/* TAB 1: VISUAL GRAPHS VIEW (Clean & Spacious Graphs Only) */}
                {analyticsTab === 'GRAPHS' && (
                  <div className="space-y-6">
                    {/* A. INTERACTIVE STUDENT SCORE DOT GRAPH (Scatter Plot with Hover Cards) */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-wide">Interactive Student Performance Dot Graph</h4>
                            <p className="text-[11px] text-slate-400">Hover over any student dot to view their exact name, score, and proctoring status</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> 90-100%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> 75-89%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 50-74%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> &lt;50% / Flagged</span>
                        </div>
                      </div>

                      {/* Interactive Canvas Grid */}
                      <div className="bg-slate-950/90 rounded-2xl p-6 border border-slate-800 relative">
                        {analyticsData.roster.filter((st: any) => st.status !== 'PENDING').length === 0 ? (
                          <div className="py-12 text-center text-xs text-slate-500 font-medium">
                            No completed quiz submissions yet to display on the dot graph.
                          </div>
                        ) : (
                          <div className="relative h-64 w-full">
                            {/* Y-Axis Grid Lines & Labels */}
                            <div className="absolute inset-0 left-12 right-0 flex flex-col justify-between pointer-events-none">
                              {[100, 75, 50, 25, 0].map((val) => (
                                <div key={val} className="w-full flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right shrink-0 -ml-10">{val}%</span>
                                  <div className="w-full border-b border-dashed border-slate-800/80" />
                                </div>
                              ))}
                            </div>

                            {/* Student Dots Plotting Canvas */}
                            <div className="absolute inset-0 left-12 right-6 top-1 bottom-1">
                              {analyticsData.roster
                                .filter((st: any) => st.status !== 'PENDING')
                                .map((st: any, idx: number, arr: any[]) => {
                                  const scorePct = Math.min(100, Math.max(0, parseFloat(st.percentage) || 0));
                                  // X Coordinate: spread horizontally
                                  const xPct = arr.length === 1 ? 50 : 5 + (idx / (arr.length - 1)) * 90;
                                  // Y Coordinate: top 0% = 100% score, top 100% = 0% score
                                  const topPct = 100 - scorePct;

                                  const isInvalidated = st.is_invalidated || st.status === 'INVALIDATED';
                                  const dotBg = isInvalidated
                                    ? 'bg-rose-500 border-rose-300 ring-rose-500/40'
                                    : scorePct >= 90
                                    ? 'bg-emerald-400 border-emerald-200 ring-emerald-400/40'
                                    : scorePct >= 75
                                    ? 'bg-blue-400 border-blue-200 ring-blue-400/40'
                                    : scorePct >= 50
                                    ? 'bg-amber-400 border-amber-200 ring-amber-400/40'
                                    : 'bg-rose-500 border-rose-300 ring-rose-500/40';

                                  return (
                                    <div
                                      key={st.junior_id}
                                      className="absolute group flex flex-col items-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20 hover:z-50 transition-all duration-300"
                                      style={{ left: `${xPct}%`, top: `${topPct}%` }}
                                    >
                                      {/* Glowing Pulsing Node */}
                                      <div className="relative flex items-center justify-center">
                                        <span className={`animate-ping absolute inline-flex h-5 w-5 rounded-full opacity-60 ${dotBg}`} />
                                        <span className={`relative inline-flex rounded-full h-4 w-4 ${dotBg} border-2 shadow-xl group-hover:scale-150 transition-transform duration-300`} />
                                      </div>

                                      {/* Student Name & Percentage Badge */}
                                      <span className="text-[10px] font-bold text-slate-200 mt-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700/80 max-w-[110px] truncate shadow-sm">
                                        {st.name.split(' ')[0]} ({st.percentage}%)
                                      </span>

                                      {/* Hover Tooltip Card */}
                                      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 z-50 w-60 animate-in fade-in zoom-in-95 pointer-events-none">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                                          <span className="font-bold text-xs text-white truncate max-w-[130px]">{st.name}</span>
                                          <span className="font-mono text-[10px] text-slate-400">{st.register_number}</span>
                                        </div>

                                        <div className="space-y-1.5 text-[11px]">
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-medium">Score:</span>
                                            <span className="font-bold text-white">{st.score} / {st.total_points} ({st.percentage}%)</span>
                                          </div>

                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-medium">Status:</span>
                                            <span className={`font-bold ${isInvalidated ? 'text-rose-400' : 'text-emerald-400'}`}>
                                              {isInvalidated ? 'INVALIDATED' : 'COMPLETED'}
                                            </span>
                                          </div>

                                          {isInvalidated && (
                                            <p className="text-[10px] text-rose-300 bg-rose-950/80 p-2 rounded-xl border border-rose-800/80 leading-relaxed mt-1">
                                              ⚠️ {st.violation_reason || 'Proctoring Violation: Tab switch / Window focus loss'}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* B. VISUAL SCORE DISTRIBUTION HISTOGRAM BAR CHART */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-wide">Visual Score Distribution Graph</h4>
                            <p className="text-[11px] text-slate-400">Class Performance Histogram Across Grade Ranges</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-indigo-300 rounded-full border border-slate-700">
                          {analyticsData.summary.completedCount} Submissions
                        </span>
                      </div>

                      {/* Vertical Bar Chart Graphic */}
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 space-y-3">
                        <div className="h-48 flex items-end justify-between gap-4 pt-6 px-4 pb-2 border-b border-slate-800">
                          {[
                            { label: '90-100%', category: 'Excellent', count: analyticsData.scoreRanges.excellent, color: 'bg-emerald-500 hover:bg-emerald-400', textColor: 'text-emerald-400' },
                            { label: '75-89%', category: 'Good', count: analyticsData.scoreRanges.good, color: 'bg-blue-500 hover:bg-blue-400', textColor: 'text-blue-400' },
                            { label: '50-74%', category: 'Average', count: analyticsData.scoreRanges.average, color: 'bg-amber-500 hover:bg-amber-400', textColor: 'text-amber-400' },
                            { label: '<50%', category: 'Needs Impv.', count: analyticsData.scoreRanges.needsImprovement, color: 'bg-rose-500 hover:bg-rose-400', textColor: 'text-rose-400' }
                          ].map((item, idx) => {
                            const maxCount = Math.max(
                              analyticsData.scoreRanges.excellent,
                              analyticsData.scoreRanges.good,
                              analyticsData.scoreRanges.average,
                              analyticsData.scoreRanges.needsImprovement,
                              1
                            );
                            const heightPct = Math.max(12, Math.round((item.count / maxCount) * 100));
                            const total = analyticsData.summary.completedCount || 1;
                            const totalPct = Math.round((item.count / total) * 100);

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                <div className="text-center group-hover:scale-110 transition-transform">
                                  <span className="text-sm font-extrabold text-white block">{item.count}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">({totalPct}%)</span>
                                </div>
                                <div className="w-full max-w-[64px] bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end h-full p-1 border border-slate-700/50">
                                  <div
                                    className={`w-full ${item.color} rounded-t-lg transition-all duration-700 shadow-lg`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                                <div className="text-center pt-1">
                                  <span className={`text-[11px] font-bold block ${item.textColor}`}>{item.label}</span>
                                  <span className="text-[10px] font-medium text-slate-400 block">{item.category}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: DETAILED STUDENT ROSTER & AUDIT LOG TABLE (No Graphs) */}
                {analyticsTab === 'ROSTER' && (
                  <div className="space-y-4">
                    {/* Summary Cards inside Roster Tab */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex flex-col justify-between space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                          Submissions
                        </span>
                        <div>
                          <span className="text-xl font-bold text-slate-900">
                            {analyticsData.summary.completedCount}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 ml-1">
                            / {analyticsData.summary.totalAssigned}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/60 rounded-2xl flex flex-col justify-between space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 block">
                          Class Average
                        </span>
                        <span className="text-xl font-bold text-indigo-950">
                          {analyticsData.summary.avgPercentage}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl flex flex-col justify-between space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                          Highest Score
                        </span>
                        <span className="text-xl font-bold text-emerald-950">
                          {analyticsData.summary.highestScore}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl flex flex-col justify-between space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 block">
                          Pass Rate
                        </span>
                        <span className="text-xl font-bold text-blue-950">
                          {analyticsData.summary.passRatePercentage}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-rose-50/60 border border-rose-200/60 rounded-2xl flex flex-col justify-between space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 block">
                          Proctoring Flagged
                        </span>
                        <div>
                          <span className="text-xl font-bold text-rose-950">
                            {analyticsData.summary.invalidatedCount || 0}
                          </span>
                          <span className="text-xs font-semibold text-rose-600 ml-1">
                            Violations
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Class Student Roster & Proctoring Audit Log</h4>
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                          {(['ALL', 'COMPLETED', 'INVALIDATED', 'PENDING'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setRosterFilter(tab as any)}
                              className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                                rosterFilter === tab ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/90 border-b border-slate-200/80 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="p-3.5">Register No.</th>
                              <th className="p-3.5">Student Name</th>
                              <th className="p-3.5">Exam Status</th>
                              <th className="p-3.5">Score & Percentage</th>
                              <th className="p-3.5">Proctoring Log / Violation Reason</th>
                              <th className="p-3.5">Submission Time</th>
                              <th className="p-3.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {analyticsData.roster
                              .filter((st: any) => {
                                if (rosterFilter === 'ALL') return true;
                                if (rosterFilter === 'INVALIDATED') return st.is_invalidated || st.status === 'INVALIDATED';
                                return st.status === rosterFilter;
                              })
                              .map((st: any) => (
                                <tr key={st.junior_id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3.5 font-mono font-bold text-slate-700">{st.register_number}</td>
                                  <td className="p-3.5 font-bold text-slate-900">{st.name}</td>
                                  <td className="p-3.5">
                                    {st.is_invalidated || st.status === 'INVALIDATED' ? (
                                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1 border border-rose-200">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> INVALIDATED
                                      </span>
                                    ) : st.status === 'COMPLETED' ? (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        COMPLETED
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                        PENDING
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    {st.status === 'PENDING' ? (
                                      <span className="text-slate-400">-</span>
                                    ) : (
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-slate-900">{st.score}/{st.total_points}</span>
                                        <span className="text-[11px] font-extrabold text-indigo-600">({st.percentage}%)</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    {st.is_invalidated || st.status === 'INVALIDATED' ? (
                                      <div className="space-y-1 max-w-sm">
                                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide block">
                                          🚫 Flagged: {st.tab_switches || 1} Tab Switch Violation(s)
                                        </span>
                                        <p className="text-[11px] text-rose-800 font-medium bg-rose-50/80 p-2 rounded-xl border border-rose-200/80 leading-relaxed">
                                          {st.violation_reason || 'Exam Auto-Submitted & Invalidated: Student switched browser tabs/windows during active exam'}
                                        </p>
                                      </div>
                                    ) : st.status === 'COMPLETED' ? (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold inline-flex items-center gap-1 border border-emerald-200/80">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Session (0 Violations)
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-normal">Awaiting Submission</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {st.submitted_at ? new Date(st.submitted_at).toLocaleString() : 'Not Yet Submitted'}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {st.status !== 'PENDING' ? (
                                      <button
                                        onClick={() => handleReconductQuiz(selectedQuizAnalytics.id, st.junior_id, st.name)}
                                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-xl text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                        title={`Reset attempt and reconduct quiz for ${st.name}`}
                                      >
                                        <RotateCcw className="w-3 h-3 text-amber-600" /> Re-conduct
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium">Pending</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
