import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { BookOpen, MapPin, PlayCircle } from 'lucide-react';
import { SanskrithiIntro } from '../../components/common/SanskrithiIntro';

export const CollegeInfoPage: React.FC = () => {
  const [collegeInfo, setCollegeInfo] = useState<any[]>([]);
  const [campusLocations, setCampusLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'campus'>('rules');
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, locRes] = await Promise.all([
          api.get('/info/college'),
          api.get('/info/campus')
        ]);
        setCollegeInfo(infoRes.data.data);
        setCampusLocations(locRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingState message="Loading College Guide & Campus Directory..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 3D SSE Intro Overlay */}
      {showIntro && (
        <SanskrithiIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* SSE Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-[#0e0d0c]">
            <img src="/assets/sse-mark.jpg" alt="SSE Logo" className="w-full h-full object-contain aspect-square" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-400" /> Sanskrithi School of Engineering
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">Official Campus Rules, Hostel Guidelines & Location Directory</p>
          </div>
        </div>

        <button
          onClick={() => setShowIntro(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 transition-colors cursor-pointer shrink-0"
        >
          <PlayCircle className="w-4 h-4" /> Watch 3D SSE Intro
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'rules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          College & Hostel Rules
        </button>
        <button
          onClick={() => setActiveTab('campus')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'campus' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Campus Location Directory
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rules' ? (
        <div className="space-y-4">
          {collegeInfo.map((info) => (
            <div key={info.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-sm">
                {info.category}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{info.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{info.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campusLocations.map((loc) => (
            <div key={loc.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" /> {loc.name}
                </h4>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {loc.category}
                </span>
              </div>
              <p className="text-xs text-slate-600">{loc.building} ({loc.floor})</p>
              <p className="text-[11px] text-slate-500">{loc.description}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Contact: {loc.contact_person || 'Desk'}</span>
                <span>{loc.operating_hours || 'Standard Hours'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
