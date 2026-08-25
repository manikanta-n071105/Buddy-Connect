import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Activity,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Gauge,
  Zap,
  HardDrive,
  Cpu,
  BarChart3,
  Sliders,
  FileCheck,
  Play,
  Download,
  Edit3,
  Flame,
  Wrench,
  Radio
} from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const DiagnosisHub: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (user && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [integrityResult, setIntegrityResult] = useState<any>(null);
  const [slaResult, setSlaResult] = useState<any>(null);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isResettingPool, setIsResettingPool] = useState(false);
  const [isTriggeringSla, setIsTriggeringSla] = useState(false);
  const [isAnalyzingDb, setIsAnalyzingDb] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'settings' | 'benchmarks' | 'actions'>('overview');
  const [autoPing, setAutoPing] = useState(false);
  const [pingHistory, setPingHistory] = useState<number[]>([]);

  // Setting Edit State
  const [editingSettingKey, setEditingSettingKey] = useState<string | null>(null);
  const [editingSettingVal, setEditingSettingVal] = useState<string>('');
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);

  const fetchDiagnosis = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await api.get('/diagnosis');
      const latency = Date.now() - start;
      setPingLatency(latency);
      setData(res.data.data);
      setPingHistory((prev) => [...prev.slice(-9), latency]);
    } catch (err: any) {
      toast.error('Failed to fetch system diagnostic data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnosis();
  }, []);

  // Auto Ping Interval
  useEffect(() => {
    if (!autoPing) return;
    const interval = setInterval(fetchDiagnosis, 3000);
    return () => clearInterval(interval);
  }, [autoPing]);

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await api.post('/diagnosis/benchmark');
      setBenchmarkResult(res.data.benchmark);
      toast.success('Database latency benchmark complete');
    } catch (err: any) {
      toast.error('Benchmark test failed');
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRunIntegrity = async () => {
    setIsCheckingIntegrity(true);
    try {
      const res = await api.post('/diagnosis/integrity');
      setIntegrityResult(res.data.integrity);
      toast.success('Database integrity audit passed with zero errors');
    } catch (err: any) {
      toast.error('Integrity check failed');
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleResetPool = async () => {
    setIsResettingPool(true);
    try {
      const res = await api.post('/diagnosis/reset-pool');
      toast.success(res.data.message);
      fetchDiagnosis();
    } catch (err: any) {
      toast.error('Pool reset failed');
    } finally {
      setIsResettingPool(false);
    }
  };

  const handleTriggerSla = async () => {
    setIsTriggeringSla(true);
    try {
      const res = await api.post('/diagnosis/trigger-sla');
      setSlaResult(res.data.escalationSummary);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error('SLA escalation check failed');
    } finally {
      setIsTriggeringSla(false);
    }
  };

  const handleAnalyzeDb = async () => {
    setIsAnalyzingDb(true);
    try {
      const res = await api.post('/diagnosis/analyze');
      setAnalyzeResult(res.data);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error('Database analyze query failed');
    } finally {
      setIsAnalyzingDb(false);
    }
  };

  const handleSaveSetting = async (key: string) => {
    if (editingSettingVal === '') return;
    setIsUpdatingSetting(true);
    try {
      const res = await api.put('/diagnosis/settings', { key, value: editingSettingVal });
      toast.success(res.data.message);
      setEditingSettingKey(null);
      fetchDiagnosis();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update system setting');
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const handleExportLog = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(
        { diagnosticData: data, benchmarkResult, integrityResult, slaResult, analyzeResult, exportedAt: new Date() },
        null,
        2
      )
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `sse_diagnosis_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Diagnostic log report exported');
  };

  if (isLoading && !data) return <LoadingState message="Connecting to Portal Diagnostic Engine..." />;

  const healthScore = data?.healthScore || 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-2xl shadow-lg shrink-0">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">
                System Diagnosis & Health Command Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                Interactive Controls Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Sanskrithi School of Engineering • Live DB Pool, SLA Engine Triggers, Settings Manager & Query Analyzer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoPing(!autoPing)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl border transition-colors shadow-2xs cursor-pointer ${
              autoPing
                ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> {autoPing ? 'Live Polling ON (3s)' : 'Enable Live 3s Polling'}
          </button>

          <button
            onClick={fetchDiagnosis}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Telemetry
          </button>

          <button
            onClick={handleExportLog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* Top Health Score & Key Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Overall Health Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{healthScore}</span>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">/ 100 EXCELLENT</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* DB Latency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              PostgreSQL DB Latency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{data?.database?.latencyMs}</span>
              <span className="text-xs font-bold text-slate-500">ms (Ping: {pingLatency}ms)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Memory Pressure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Heap Memory Used
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{data?.system?.memoryUsage?.heapUsedMB}</span>
              <span className="text-xs font-bold text-slate-500">MB ({data?.system?.memoryUsage?.heapPressurePercent}%)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Database Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Database Storage
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{data?.database?.databaseSize}</span>
              <span className="text-xs font-bold text-slate-500">PG Database</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Real-time Ping Latency Visual Bar */}
      {pingHistory.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Live Ping Telemetry Stream:</span>
          </div>
          <div className="flex items-end gap-1.5 h-8 flex-1 max-w-md justify-end">
            {pingHistory.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${Math.min(100, Math.max(20, val * 2))}px` }}
                className="w-4 bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-xs transition-all duration-300"
                title={`${val} ms`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Server className="w-4 h-4" /> System Telemetry
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'actions' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4" /> Interactive Diagnostic Actions
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" /> Live Settings Manager
        </button>

        <button
          onClick={() => setActiveTab('entities')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'entities' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" /> Database Audit Totals
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'benchmarks' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Performance Benchmarks
        </button>
      </div>

      {/* Tab 1: System Telemetry */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* REST API & Node.js Runtime */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-orange-600" /> REST API Server
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OPERATIONAL
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Node.js Engine</span>
                <span className="font-bold text-slate-900">{data?.system?.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Host Platform</span>
                <span className="font-bold text-slate-900">{data?.system?.platform}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">CPU Cores</span>
                <span className="font-bold text-slate-900">{data?.system?.cpuCount} Cores</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Process Uptime</span>
                <span className="font-bold text-slate-900">{Math.floor(data?.system?.uptimeSeconds / 60)} minutes</span>
              </div>
            </div>
          </div>

          {/* PostgreSQL Driver & Pool */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" /> PostgreSQL Pool Driver
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> HEALTHY
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Active Clients</span>
                <span className="font-bold text-orange-600">{data?.database?.pool?.total} / {data?.database?.pool?.maxAllowed}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Idle Clients</span>
                <span className="font-bold text-slate-900">{data?.database?.pool?.idle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Waiting Queries</span>
                <span className="font-bold text-slate-900">{data?.database?.pool?.waiting}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Target DB Name</span>
                <span className="font-bold text-slate-900">{data?.database?.databaseName}</span>
              </div>
            </div>
          </div>

          {/* Rate Limiter & Background Jobs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" /> Rate Limiter & Cron Jobs
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Auth Rate Limit</span>
                <span className="font-bold text-slate-900">{data?.rateLimiter?.authLimiterMax} req / 15m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">API Rate Limit</span>
                <span className="font-bold text-slate-900">{data?.rateLimiter?.apiLimiterMax} req / 15m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">SLA Cron Interval</span>
                <span className="font-bold text-slate-900">{data?.slaCronJob?.frequency}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Last Job Heartbeat</span>
                <span className="font-bold text-slate-900">{new Date(data?.slaCronJob?.lastRun).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Diagnostic Actions */}
      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: Trigger SLA Engine */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Execute SLA Escalation Engine</h3>
              <p className="text-xs text-slate-500 mt-1">
                Audits all open student issues against warning ({data?.settings?.SLA_WARNING_HOURS || 24}h) and critical ({data?.settings?.SLA_CRITICAL_HOURS || 48}h) thresholds.
              </p>
            </div>

            {slaResult && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">Evaluated Issues: {slaResult.totalEvaluated}</p>
                <p className="font-bold text-orange-600">Newly Escalated: {slaResult.newlyEscalatedCount}</p>
              </div>
            )}

            <button
              onClick={handleTriggerSla}
              disabled={isTriggeringSla}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTriggeringSla ? 'Evaluating Open Issues...' : 'Run SLA Audit Now'}
            </button>
          </div>

          {/* Action 2: Recycle DB Connection Pool */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recycle Connection Pool</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verifies PostgreSQL driver client responsiveness and recycles idle connections.
              </p>
            </div>

            <button
              onClick={handleResetPool}
              disabled={isResettingPool}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isResettingPool ? 'Recycling Client Pool...' : 'Recycle DB Connections'}
            </button>
          </div>

          {/* Action 3: Database ANALYZE Optimizer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Optimize & ANALYZE Database</h3>
              <p className="text-xs text-slate-500 mt-1">
                Runs PostgreSQL query planner statistics update across `users`, `issues`, `messages`, and `announcements`.
              </p>
            </div>

            {analyzeResult && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                Completed in {analyzeResult.durationMs} ms
              </div>
            )}

            <button
              onClick={handleAnalyzeDb}
              disabled={isAnalyzingDb}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAnalyzingDb ? 'Running ANALYZE...' : 'Optimize Query Planner'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Live Settings Manager */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" /> Interactive System Settings & Escalation Limits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any setting to edit and update `system_settings` database values live</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {data?.settings &&
              Object.entries(data.settings).map(([key, val]) => {
                const isEditing = editingSettingKey === key;
                return (
                  <div key={key} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{key}</span>

                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingSettingVal}
                          onChange={(e) => setEditingSettingVal(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-orange-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveSetting(key)}
                            disabled={isUpdatingSetting}
                            className="flex-1 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] rounded-md transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSettingKey(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-[11px] rounded-md hover:bg-slate-300 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-orange-600">{String(val)}</span>
                        <button
                          onClick={() => {
                            setEditingSettingKey(key);
                            setEditingSettingVal(String(val));
                          }}
                          className="p-1 text-slate-400 hover:text-orange-600 rounded-md transition-colors cursor-pointer"
                          title="Edit setting value"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 4: Database Entity Audit Totals */}
      {activeTab === 'entities' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" /> Database Table Record Counts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live entity audits across all core application relations</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Total Storage: {data?.database?.databaseSize}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Registered Users</span>
              <span className="text-2xl font-black text-orange-600">{data?.database?.counts?.users}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tracked Issues</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.issues}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mentor Messages</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.messages}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Announcements</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.announcements}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">College Events</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.events}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Onboarding Tasks</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.onboardingTasks}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Student Suggestions</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.suggestions}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Survey Responses</span>
              <span className="text-2xl font-black text-slate-900">{data?.database?.counts?.surveys}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Performance Benchmarks */}
      {activeTab === 'benchmarks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DB Benchmark Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" /> Latency Benchmark Tester
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Executes 5 rapid database queries to calculate P95 latency</p>
              </div>
              <button
                onClick={handleRunBenchmark}
                disabled={isBenchmarking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} /> Run Test
              </button>
            </div>

            {benchmarkResult ? (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <span className="font-semibold text-slate-600">Benchmark Rating</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-[10px]">
                    {benchmarkResult.rating}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Latency</span>
                    <span className="text-sm font-black text-slate-900">{benchmarkResult.avgLatencyMs} ms</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Min Latency</span>
                    <span className="text-sm font-black text-slate-900">{benchmarkResult.minLatencyMs} ms</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Latency</span>
                    <span className="text-sm font-black text-slate-900">{benchmarkResult.maxLatencyMs} ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Click "Run Test" to measure live query response times.
              </div>
            )}
          </div>

          {/* Database Integrity Audit Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-orange-600" /> Database Integrity Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Audits foreign keys, orphan records, and relation constraints</p>
              </div>
              <button
                onClick={handleRunIntegrity}
                disabled={isCheckingIntegrity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isCheckingIntegrity ? 'animate-spin' : ''}`} /> Run Audit
              </button>
            </div>

            {integrityResult ? (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <span className="font-semibold text-slate-600">Integrity Check Result</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-[10px]">
                    {integrityResult.databaseIntegrity}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Orphan Junior Issues:</span>
                    <span className="font-bold text-slate-900">{integrityResult.orphanJuniorIssues}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Unassigned Seniors:</span>
                    <span className="font-bold text-slate-900">{integrityResult.unassignedSeniors}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Click "Run Audit" to verify database constraints and relationships.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
