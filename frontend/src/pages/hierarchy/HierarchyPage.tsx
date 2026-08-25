import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { HierarchyTree } from '../../components/hierarchy/HierarchyTree';
import { LoadingState } from '../../components/common/LoadingState';
import { Network, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const HierarchyPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTree = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/hierarchy/tree');
      setTreeData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" /> College Mentorship Hierarchy Tree
          </h1>
          <p className="text-xs text-slate-500">Interactive expandable view of Directors, Seniors, assigned Juniors, and capacity limits</p>
        </div>
        <button
          onClick={fetchTree}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-md shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Tree
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Building interactive hierarchy tree..." />
      ) : (
        <HierarchyTree data={treeData} />
      )}
    </div>
  );
};
