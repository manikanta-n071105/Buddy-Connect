import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { Building2, Users, CircleAlert, CheckCircle2, Flame, BarChart3, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard-stats');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <LoadingState message="Loading Super Admin Dashboard analytics..." />;

  const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];
  const votePieData = [
    { name: 'Satisfied', value: stats.satisfactionBreakdown.satisfied },
    { name: 'Partially Satisfied', value: stats.satisfactionBreakdown.partiallySatisfied },
    { name: 'Not Satisfied', value: stats.satisfactionBreakdown.notSatisfied }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Activity className="w-3 h-3" /> System Overview
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Super Admin Command Center</h1>
          <p className="text-xs text-slate-300">Full system oversight, hierarchy metrics, and issue resolution stats</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Directors</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 text-indigo-600 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 tracking-tight">{stats.totalDirectors}</p>
          <div className="mt-2 text-[11px] font-semibold text-slate-400">Department Heads</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Seniors & Juniors</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 text-blue-600 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 tracking-tight">{stats.totalSeniors} <span className="text-xs font-bold text-slate-400">S</span> / {stats.totalJuniors} <span className="text-xs font-bold text-slate-400">J</span></p>
          <div className="mt-2 text-[11px] font-semibold text-slate-400">Active Student Hierarchy</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Open Issues</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 text-amber-600 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3 tracking-tight">{stats.openIssues}</p>
          <div className="mt-2 text-[11px] font-semibold text-slate-400">Pending Resolution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Satisfaction Rate</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 text-emerald-600 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3 tracking-tight">{stats.satisfactionRate}%</p>
          <div className="mt-2 text-[11px] font-semibold text-slate-400">Feedback Score</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" /> Issues by Category
            </h3>
            <span
              onClick={() => navigate('/issues')}
              className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full cursor-pointer hover:bg-orange-100 transition-colors"
            >
              Click Bar to Filter
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="category"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#0f172a', fontWeight: 800 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#f97316', fontWeight: 800 }}
                />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={(entry: any) => {
                    if (entry && entry.category) {
                      navigate(`/issues?category=${encodeURIComponent(entry.category)}`);
                    }
                  }}
                >
                  {stats.categoryBreakdown.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill="#4f46e5" cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Color Resolution Satisfaction */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" /> Resolution Satisfaction
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={votePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={4} label>
                  {votePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Senior Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 overflow-hidden">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-600" /> Senior Performance Scorecards
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Senior Mentor</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Assigned Juniors</th>
                <th className="p-3.5">Total Issues</th>
                <th className="p-3.5">Open</th>
                <th className="p-3.5">Resolved</th>
                <th className="p-3.5">Escalated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {stats.seniorPerformance.map((sen: any) => (
                <tr key={sen.senior_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{sen.senior_name}</td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{sen.senior_code}</td>
                  <td className="p-3.5 font-semibold">{sen.junior_count}</td>
                  <td className="p-3.5 font-semibold">{sen.total_issues}</td>
                  <td className="p-3.5 font-bold text-amber-600">{sen.open_issues}</td>
                  <td className="p-3.5 font-bold text-emerald-600">{sen.resolved_issues}</td>
                  <td className="p-3.5 text-rose-600 font-extrabold">{sen.escalated_issues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

