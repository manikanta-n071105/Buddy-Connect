import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { HierarchyTree } from '../../components/hierarchy/HierarchyTree';
import { LoadingState } from '../../components/common/LoadingState';
import { Network, RefreshCw, Users, Shield, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

import { fetchWithCache } from '../../utils/swr';

export const HierarchyPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTree = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_hierarchy_tree',
      '/hierarchy/tree',
      (data) => {
        setTreeData(data || []);
        setIsLoading(false);
      },
      { forceRefresh }
    );
  };

  useEffect(() => {
    fetchTree();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Standardized Theme Across All Pages */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-2xl shadow-lg shrink-0">
            <Network className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">
                College Mentorship & Administrative Hierarchy Tree
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40 tracking-wider">
                Institutional Governance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Sanskrithi School of Engineering • Interactive Expandable View of mentors, Seniors, Assigned Juniors & Capacity Limits
            </p>
          </div>
        </div>

        {/* Header Action & Cross-Page Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-orange-400" /> View Directory <ArrowRight className="w-3 h-3 opacity-60" />
          </Link>

          <button
            onClick={() => fetchTree(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Hierarchy
          </button>
        </div>
      </div>

      {/* Cross-Page Related Quick Navigation Breadcrumb Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <LayoutDashboard className="w-3.5 h-3.5 text-orange-600" />
          <span>Related Modules:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
            Role Dashboard
          </Link>
          <Link to="/users" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
            User Directory
          </Link>
          <Link to="/quizzes" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
            Class Quizzes
          </Link>
          <Link to="/counseling" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
            Mental Health
          </Link>
          <Link to="/diagnosis" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
            System Telemetry
          </Link>
        </div>
      </div>

      {/* Main Hierarchy Tree Display */}
      {isLoading ? (
        <LoadingState message="Building interactive hierarchy tree..." />
      ) : (
        <HierarchyTree data={treeData} />
      )}
    </div>
  );
};
