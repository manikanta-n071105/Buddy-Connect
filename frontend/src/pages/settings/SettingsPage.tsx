import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { Settings, Save, ShieldCheck, Users, BookOpen, Clock, FileJson, CheckCircle2, AlertCircle, Sparkles, Copy, Trash2, UserPlus, Info } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Juniors JSON Import State
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any | null>(null);
  const [showFieldsGuide, setShowFieldsGuide] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const cleanList = (res.data.data || []).filter((s: any) => 
        !s.key.includes('VOTE') && 
        !s.key.includes('VOTING') && 
        !s.key.includes('THRESHOLD') && 
        !['REOPEN_THRESHOLD', 'SATISFACTION_THRESHOLD'].includes(s.key)
      );
      setSettings(cleanList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put('/settings', { settings });
      toast.success('System settings saved successfully');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save system settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleJsonTemplate = [
    {
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "username": "aarav_s",
      "password": "Password123!",
      "phone": "9876543210",
      "department": "CSE-A",
      "batch": "2024-2028",
      "year": "1st Year",
      "gender": "MALE",
      "residenceStatus": "DAY_SCHOLAR",
      "isCr": false,
      "joiningDate": "2024-08-01"
    },
    {
      "name": "Priya Patel",
      "email": "priya.patel@example.com",
      "username": "priya_p",
      "password": "Password123!",
      "phone": "9876543211",
      "department": "ECE",
      "batch": "2024-2028",
      "year": "1st Year",
      "gender": "FEMALE",
      "residenceStatus": "HOSTELLER",
      "isCr": true,
      "joiningDate": "2024-08-01"
    }
  ];

  const handleLoadSampleJson = () => {
    setJsonInput(JSON.stringify(sampleJsonTemplate, null, 2));
    toast.success('Sample Juniors JSON template loaded into editor!');
  };

  // Parse JSON and check validity
  const getJsonValidation = () => {
    if (!jsonInput.trim()) return { isValid: false, message: 'JSON input is empty', count: 0 };
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        return { isValid: true, message: `Valid JSON Array (${parsed.length} items)`, count: parsed.length, data: parsed };
      } else if (typeof parsed === 'object' && parsed !== null) {
        const arr = parsed.juniors || parsed.data || [parsed];
        return { isValid: true, message: `Valid JSON Object (${arr.length} items)`, count: arr.length, data: arr };
      }
      return { isValid: false, message: 'Root JSON must be an array or object containing juniors array', count: 0 };
    } catch (err: any) {
      return { isValid: false, message: `JSON Syntax Error: ${err.message}`, count: 0 };
    }
  };

  const validation = getJsonValidation();

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || validation.count === 0) {
      toast.error('Please enter valid JSON array data before importing.');
      return;
    }

    try {
      setIsImporting(true);
      setImportResults(null);

      const parsedData = JSON.parse(jsonInput);
      const res = await api.post('/users/bulk-juniors', parsedData);

      setImportResults(res.data.data);
      toast.success(res.data.message || `Successfully created ${res.data.data.createdCount} juniors!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading System Settings Configuration..." />;

  const getSettingIcon = (key: string) => {
    if (key.includes('FACULTY')) return <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />;
    if (key.includes('SENIOR') || key.includes('JUNIOR') || key.includes('DIRECTOR')) return <Users className="w-4 h-4 text-indigo-600 shrink-0" />;
    return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
  };

  const formatKeyName = (key: string) => {
    switch (key) {
      case 'MAX_JUNIORS_PER_FACULTY':
        return 'Max Juniors Assigned per Faculty Member';
      case 'MAX_JUNIORS_PER_SENIOR':
        return 'Max Juniors Assigned per Senior Mentor';
      case 'MAX_SENIORS_PER_DIRECTOR':
        return 'Max Seniors Managed per Department Director';
      default:
        return key.replace(/_/g, ' ');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Settings
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            System Settings & Bulk Data Import Hub
          </h1>
          <p className="text-xs text-slate-300">
            Control global junior quotas, mentorship rules, and import bulk junior student records in JSON format.
          </p>
        </div>
      </div>

      {/* Global Quota Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" /> Global System Capacity Rules
          </h3>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          {settings.map((s) => {
            const isFacultyLimit = s.key === 'MAX_JUNIORS_PER_FACULTY';
            return (
              <div
                key={s.key}
                className={`pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 rounded-xl transition-all ${
                  isFacultyLimit ? 'bg-teal-50/70 border border-teal-200/80 shadow-2xs' : ''
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {getSettingIcon(s.key)}
                    <span className="text-xs font-black text-slate-900 tracking-tight block">
                      {formatKeyName(s.key)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">{s.description}</span>
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">{s.key}</span>
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    className={`w-full p-2.5 bg-white border rounded-xl text-xs font-extrabold outline-hidden focus:ring-2 ${
                      isFacultyLimit
                        ? 'border-teal-300 text-teal-900 focus:ring-teal-500/20'
                        : 'border-slate-200 text-indigo-900 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Saving Settings...' : 'Save System Capacity Settings'}
        </button>
      </form>

      {/* BULK JUNIORS JSON DATA IMPORT SECTION */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1">
                <UserPlus className="w-3 h-3 text-emerald-600" /> Super Admin Bulk Tool
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-600" /> Bulk Import Juniors Data (JSON)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleJson}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Load Sample JSON
              </button>

              <button
                type="button"
                onClick={() => setJsonInput('')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* REQUIRED FIELDS & ENUMS SPECIFICATION GUIDE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <button
              onClick={() => setShowFieldsGuide(!showFieldsGuide)}
              className="flex items-center justify-between w-full text-xs font-extrabold text-slate-900 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-slate-900">
                <Info className="w-4 h-4 text-indigo-600" /> Junior JSON Schema & Required Enum Values Specification
              </span>
              <span className="text-[11px] text-indigo-600 font-bold">{showFieldsGuide ? 'Hide Guide' : 'Show Guide'}</span>
            </button>

            {showFieldsGuide && (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Required Fields *</span>
                    <ul className="space-y-1 text-slate-700 font-medium text-[11px]">
                      <li><strong className="text-slate-900">name</strong> (string): Student full name</li>
                      <li><strong className="text-slate-900">email</strong> (string): Unique email address</li>
                      <li><strong className="text-slate-900">username</strong> (string): Unique login username</li>
                      <li><strong className="text-slate-900">department</strong> (string): Branch / Section name (<span className="text-indigo-600 font-extrabold">"CSE-A", "CSE-B", "CSE-C", "ECE", "EEE", "MECH", "CIVIL"</span>)</li>
                      <li><strong className="text-slate-900">batch</strong> (string): Academic batch (e.g. <span className="text-indigo-600 font-extrabold">"2024-2028"</span>)</li>
                      <li><strong className="text-slate-900">year</strong> (string): Study year (e.g. <span className="text-indigo-600 font-extrabold">"1st Year"</span>)</li>
                      <li><strong className="text-slate-900">gender</strong> (string Enum): <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-mono font-bold">"MALE"</span> | <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-800 font-mono font-bold">"FEMALE"</span></li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Optional Fields & Defaults</span>
                    <ul className="space-y-1 text-slate-700 font-medium text-[11px]">
                      <li><strong className="text-slate-900">password</strong> (string): Default is <span className="font-mono text-slate-900">"Password123!"</span></li>
                      <li><strong className="text-slate-900">phone</strong> (string): Contact number (e.g. <span className="font-mono">"9876543210"</span>)</li>
                      <li><strong className="text-slate-900">residenceStatus</strong> (string Enum): <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold">"DAY_SCHOLAR"</span> | <span className="px-1.5 py-0.5 rounded bg-amber-100 font-mono font-bold">"HOSTELLER"</span></li>
                      <li><strong className="text-slate-900">isCr</strong> (boolean): <span className="font-mono text-indigo-600">true</span> | <span className="font-mono text-slate-500">false</span> (appoint as Class Rep)</li>
                      <li><strong className="text-slate-900">joiningDate</strong> (string): Format <span className="font-mono">"YYYY-MM-DD"</span></li>
                      <li><strong className="text-slate-900">seniorCode</strong> (string): Assigned Senior Code (e.g. <span className="font-mono">"SEN-01"</span>)</li>
                      <li><strong className="text-slate-900">facultyCode</strong> (string): Assigned Faculty Code (e.g. <span className="font-mono">"FAC-01"</span>)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* JSON EDITOR TEXTAREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="font-extrabold text-slate-800">Paste JSON Array Data</label>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                validation.isValid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : jsonInput.trim() ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {validation.message}
              </span>
            </div>

            <textarea
              rows={10}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "name": "Junior Student Name",\n    "email": "student@example.com",\n    "username": "student_user",\n    "department": "CSE",\n    "batch": "2024-2028",\n    "year": "1st Year",\n    "gender": "MALE",\n    "residenceStatus": "DAY_SCHOLAR"\n  }\n]`}
              className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 outline-hidden focus:border-emerald-500 shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={handleBulkImport}
            disabled={isImporting || !validation.isValid || validation.count === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {isImporting ? 'Processing Bulk Import...' : `Import ${validation.count} Junior Records Now`}
          </button>

          {/* RESULTS CARD */}
          {importResults && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bulk Import Execution Summary
                </h4>
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Created: {importResults.createdCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                    Skipped: {importResults.skippedCount}
                  </span>
                </div>
              </div>

              {/* Created List */}
              {importResults.created?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block">Successfully Created Juniors:</span>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResults.created.map((c: any, i: number) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{c.name}</strong> (@{c.username})
                          <span className="text-[11px] text-slate-500 block">{c.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold font-mono text-slate-900 block">{c.registerNumber}</span>
                          <span className="text-[10px] text-indigo-700 font-extrabold">{c.department}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped List */}
              {importResults.skipped?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider block">Skipped / Failed Entries:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {importResults.skipped.map((s: any, i: number) => (
                      <div key={i} className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-xs font-medium text-rose-950 flex items-center justify-between">
                        <span>Item #{s.index}: <strong>{s.name}</strong></span>
                        <span className="text-[11px] text-rose-800 font-bold">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
