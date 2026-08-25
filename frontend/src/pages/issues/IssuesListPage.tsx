import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Issue } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, PlusCircle, Eye, Calendar, User, Flame, AlertOctagon, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const IssuesListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Handle URL query parameters (e.g. /issues?category=Academic)
  useEffect(() => {
    const catQuery = searchParams.get('category');
    const catIdQuery = searchParams.get('categoryId');
    const searchQuery = searchParams.get('search');

    if (catIdQuery) {
      setCategoryFilter(catIdQuery);
    } else if (catQuery) {
      api.get('/issues/categories').then((res) => {
        const catList = res.data.data || [];
        setCategories(catList);
        const match = catList.find((c: any) => c.name.toLowerCase() === catQuery.toLowerCase());
        if (match) {
          setCategoryFilter(String(match.id));
        } else {
          setSearch(catQuery);
        }
      }).catch(console.error);
    } else if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchParams]);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      let queryParams = [];
      if (statusFilter) queryParams.push(`status=${statusFilter}`);
      if (priorityFilter) queryParams.push(`priority=${priorityFilter}`);
      if (categoryFilter) queryParams.push(`categoryId=${categoryFilter}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);

      const url = `/issues${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      const [issRes, catRes] = await Promise.all([
        api.get(url),
        api.get('/issues/categories')
      ]);

      setIssues(issRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const escalatedIssues = issues.filter(i => i.status === 'ESCALATED');
  const isDirectorOrAdmin = ['DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Issue Tracking & Resolution Hub
          </h1>
          <p className="text-xs text-slate-500">View, monitor, and resolve student support issues across categories</p>
        </div>

        {user?.role === 'JUNIOR' && (
          <Link
            to="/issues/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Raise New Issue
          </Link>
        )}
      </div>

      {/* Director & Super Admin High Priority Escalation Banner */}
      {isDirectorOrAdmin && escalatedIssues.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-rose-950 border-2 border-rose-600/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 text-slate-100 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse shrink-0" /> High Priority Escalated Issues ({escalatedIssues.length})
            </h3>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider self-start sm:self-auto">Urgent Director Action Required</span>
          </div>

          <p className="text-xs text-slate-300 font-medium">
            The following issue tickets have been automatically escalated to you due to low student satisfaction ratings or critical escalation:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {escalatedIssues.slice(0, 3).map(iss => (
              <Link
                key={iss.id}
                to={`/issues/${iss.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-200 hover:text-white transition-all shadow-md group w-full sm:w-auto"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="truncate max-w-[220px]">{iss.issue_number}: {iss.title}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ml-auto sm:ml-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, ticket number (e.g. JC-1001)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VOTING">Voting</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-hidden cursor-pointer truncate"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Issues Display */}
      {isLoading ? (
        <LoadingState message="Fetching issue records..." />
      ) : issues.length === 0 ? (
        <EmptyState title="No issues found" description="No issue tickets match the selected criteria." />
      ) : (
        <>
          {/* Mobile Layout: Responsive Touch Cards (< 768px) */}
          <div className="block md:hidden space-y-3">
            {issues.map((iss) => {
              const isEscalated = iss.status === 'ESCALATED';
              return (
                <div
                  key={iss.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden transition-all ${
                    isEscalated
                      ? 'border-2 border-rose-500/80 bg-gradient-to-b from-rose-50/50 to-white'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-black tracking-wider">
                      {iss.issue_number}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={iss.priority} type="priority" />
                      {isEscalated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse">
                          <Flame className="w-3 h-3 text-amber-300" /> ESCALATED
                        </span>
                      ) : (
                        <StatusBadge status={iss.status} type="issue" />
                      )}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{iss.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{iss.category_name}</p>
                  </div>

                  {/* Student & Date Info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 font-medium border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-orange-600" /> {iss.junior_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" /> {new Date(iss.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/issues/${iss.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wider uppercase text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isEscalated
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isEscalated ? 'Resolve Director Escalation' : 'View Issue Ticket'}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Layout: Table View (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-extrabold uppercase">
                  <tr>
                    <th className="p-3.5">Issue Number</th>
                    <th className="p-3.5">Title & Category</th>
                    <th className="p-3.5">Reported Student</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date Created</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {issues.map((iss) => {
                    const isEscalated = iss.status === 'ESCALATED';
                    return (
                      <tr
                        key={iss.id}
                        className={`transition-colors ${
                          isEscalated
                            ? 'bg-rose-50/40 hover:bg-rose-50/80 font-bold border-l-4 border-l-rose-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 font-black text-orange-600">{iss.issue_number}</td>
                        <td className="p-3.5">
                          <p className="font-extrabold text-slate-900">{iss.title}</p>
                          <span className="text-[10px] text-slate-500 font-bold">{iss.category_name}</span>
                        </td>
                        <td className="p-3.5">
                          <p className="text-slate-900 font-bold">{iss.junior_name}</p>
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={iss.priority} type="priority" />
                        </td>
                        <td className="p-3.5">
                          {isEscalated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md animate-pulse">
                              <Flame className="w-3 h-3 text-amber-300" /> ESCALATED TO DIRECTOR
                            </span>
                          ) : (
                            <StatusBadge status={iss.status} type="issue" />
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {new Date(iss.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <Link
                            to={`/issues/${iss.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black rounded-xl transition-all shadow-2xs ${
                              isEscalated
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                                : 'text-orange-600 hover:bg-orange-50 border border-orange-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" /> {isEscalated ? 'Resolve Escalation' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
