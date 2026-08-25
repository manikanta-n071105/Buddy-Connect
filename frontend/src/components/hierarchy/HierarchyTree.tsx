import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users, User, Eye } from 'lucide-react';
import { UserProfileModal } from '../common/UserProfileModal';

interface JuniorNode {
  junior_id: string;
  user_id?: string;
  register_number: string;
  junior_name: string;
  junior_email: string;
  batch: string;
  year: string;
}

interface SeniorNode {
  senior_id: string;
  user_id?: string;
  senior_code: string;
  senior_name: string;
  senior_email: string;
  department: string;
  juniors: JuniorNode[];
  juniorCount: number;
}

interface DirectorNode {
  director_id: string;
  user_id?: string;
  director_code: string;
  director_name: string;
  director_email: string;
  department: string;
  seniors: SeniorNode[];
  seniorCount: number;
}

interface HierarchyTreeProps {
  data: DirectorNode[];
  maxSeniorsPerDirector?: number;
  maxJuniorsPerSenior?: number;
  onTransferJunior?: (juniorId: string) => void;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
  maxSeniorsPerDirector = 8,
  maxJuniorsPerSenior = 8,
  onTransferJunior
}) => {
  const [expandedDirectors, setExpandedDirectors] = useState<Record<string, boolean>>({
    [data[0]?.director_id || '']: true
  });

  const [expandedSeniors, setExpandedSeniors] = useState<Record<string, boolean>>({});
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const toggleDirector = (id: string) => {
    setExpandedDirectors(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSenior = (id: string) => {
    setExpandedSeniors(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {data.map(dir => {
        const isDirExpanded = !!expandedDirectors[dir.director_id];
        return (
          <div key={dir.director_id} className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            {/* Director Node Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleDirector(dir.director_id)} className="p-1 hover:bg-slate-800 rounded">
                  {isDirExpanded ? (
                    <ChevronDown className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-md">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3
                    onClick={() => dir.user_id && setSelectedProfileId(dir.user_id)}
                    className="font-bold text-sm tracking-wide hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    {dir.director_name}
                    <Eye className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">Director • {dir.department} ({dir.director_code})</p>
                </div>
              </div>

              {/* Director Capacity Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 border border-slate-700 text-indigo-300 rounded-md">
                  {dir.seniorCount} / {maxSeniorsPerDirector} Seniors Capacity
                </span>
              </div>
            </div>

            {/* Seniors Tree Level */}
            {isDirExpanded && (
              <div className="p-4 bg-slate-50 divide-y divide-slate-200">
                {dir.seniors.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3">No Seniors assigned to this Director.</p>
                ) : (
                  dir.seniors.map(sen => {
                    const isSenExpanded = !!expandedSeniors[sen.senior_id];
                    return (
                      <div key={sen.senior_id} className="py-3 first:pt-0 last:pb-0">
                        {/* Senior Card */}
                        <div className="px-4 py-3 bg-white border border-slate-200 rounded-md flex items-center justify-between hover:border-indigo-300 hover:shadow-2xs transition-all">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleSenior(sen.senior_id)} className="p-1 hover:bg-slate-100 rounded">
                              {isSenExpanded ? (
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <h4
                                onClick={() => sen.user_id && setSelectedProfileId(sen.user_id)}
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1.5"
                              >
                                {sen.senior_name}
                                <Eye className="w-3 h-3 text-slate-400" />
                              </h4>
                              <p className="text-[11px] text-slate-500">Senior Mentor • {sen.senior_code}</p>
                            </div>
                          </div>

                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-sm">
                            {sen.juniorCount} / {maxJuniorsPerSenior} Assigned Juniors
                          </span>
                        </div>

                        {/* Juniors List */}
                        {isSenExpanded && (
                          <div className="ml-8 mt-2 pl-4 border-l-2 border-indigo-200 space-y-2">
                            {sen.juniors.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">No Juniors assigned to this Senior.</p>
                            ) : (
                              sen.juniors.map(jun => (
                                <div
                                  key={jun.junior_id}
                                  className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                                      <User className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p
                                        onClick={() => jun.user_id && setSelectedProfileId(jun.user_id)}
                                        className="font-semibold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                                      >
                                        {jun.junior_name}
                                        <Eye className="w-3 h-3 text-indigo-400" />
                                      </p>
                                      <p className="text-[10px] text-slate-500">{jun.register_number} • {jun.year} ({jun.batch})</p>
                                    </div>
                                  </div>

                                  {onTransferJunior && (
                                    <button
                                      onClick={() => onTransferJunior(jun.junior_id)}
                                      className="px-2 py-1 text-[11px] text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
                                    >
                                      Transfer
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Profile Card Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
};
