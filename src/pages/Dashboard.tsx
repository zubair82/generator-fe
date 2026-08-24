import React from 'react';
import { motion } from 'motion/react';
import { FileText, TrendingUp, FileCheck2, Users, ChevronRight, Check, Sparkles, RotateCw, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { useUI } from '../contexts/UIContext';

export function Dashboard() {
  const { user } = useAuth();
  const { papersList, teacherPerformanceList } = useAppContext();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [apiPapers, setApiPapers] = React.useState<any[]>([]);
  const [loadingPapers, setLoadingPapers] = React.useState(true);
  const [verifiedCount, setVerifiedCount] = React.useState<number | null>(null);

  const dashboardMode = user?.role === 'ADMIN' ? 'system' : 'teacher';

  const fetchingRef = React.useRef(false);

  React.useEffect(() => {
    if (dashboardMode !== 'teacher' || fetchingRef.current) return;
    fetchingRef.current = true;
    
    const fetchPapers = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:8000/api/exam-papers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setApiPapers(data.papers || []);
        } else {
          addToast('Failed to fetch papers', 'error');
        }
      } catch (err) {
        console.error("Failed to fetch papers:", err);
      } finally {
        setLoadingPapers(false);
        fetchingRef.current = false;
      }
    };
    const fetchVerifiedCount = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:8000/api/production-questions/count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setVerifiedCount(data.total_questions);
          }
        }
      } catch (err) {
        console.error("Failed to fetch verified questions count:", err);
      }
    };
    
    fetchPapers();
    fetchVerifiedCount();
  }, [dashboardMode, addToast]);

  return (
    <div className="space-y-6 flex-1 w-full h-full flex flex-col">
      {/* Header Title & Switch View Modes */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <h2 className="font-sans font-bold text-3xl text-slate-900 tracking-tight">
            {dashboardMode === 'teacher' ? `Welcome back, ${user?.name || 'Dr. Smith'}` : 'System Overview'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {dashboardMode === 'teacher'
              ? 'Here is your verification overview for today.'
              : 'Real-time metrics for academic verification processing.'}
          </p>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-2">
        {/* Metric 1 */}
        <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="px-2 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#434654] uppercase tracking-wider mb-1">
                {dashboardMode === 'teacher' ? 'Total Papers Uploaded' : 'Total Papers'}
              </p>
              <h3 className="px-4 text-4xl font-bold text-slate-900">
                {dashboardMode === 'teacher' ? (loadingPapers ? '...' : apiPapers.length) : '1,248'}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-[#003fb1] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="px-2 text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
            from last month
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="px-2 text-xs font-bold text-[#434654] uppercase tracking-wider mb-1">Questions Verified</p>
              <h3 className="px-4 text-4xl font-bold text-slate-900">
                {dashboardMode === 'teacher' ? (verifiedCount !== null ? verifiedCount.toLocaleString() : '...') : '45.2k'}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <p className="px-2 text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +5%
            </span>
            from last month
          </p>
        </div>

        {/* Metric 3: Context-Dependent Card */}
        {dashboardMode === 'teacher' ? null : (
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#434654] uppercase tracking-wider mb-1">Active Teachers</p>
                <h3 className="text-4xl font-bold text-slate-900">184</h3>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +3
              </span>
              live verifiers currently active
            </p>
          </div>
        )}
      </div>

      {/* Main Contents Splitting: Table vs Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Split: Main Tables */}
        <div className="lg:col-span-3 bg-white border border-[#c3c5d7] rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Section */}
          <div className="px-2 p-4 md:p-6 border-b border-[#c3c5d7] flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-base text-slate-900">
              {dashboardMode === 'teacher' ? 'Recent Uploaded Papers' : 'Teacher Performance & Audits'}
            </h3>

            <button
              onClick={() => {
                navigate('/papers');
                addToast('Loaded full index', 'info');
              }}
              className="text-xs text-[#003fb1] font-semibold hover:underline flex items-center gap-1"
            >
              View All Papers <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Contextual Table rendering */}
          <div className="overflow-x-auto">
            {dashboardMode === 'teacher' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#c3c5d7] text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <th className="p-4">Paper Name</th>
                    <th className="p-4">Exam Code</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Active</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {loadingPapers ? (
                    <tr><td colSpan={6} className="text-center p-8 text-slate-500">Loading papers...</td></tr>
                  ) : apiPapers.filter(paper => !(paper.type === 'Original' && (paper.state || '').toUpperCase() === 'COMPLETED')).length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-8 text-slate-500">No papers found.</td></tr>
                  ) : apiPapers.filter(paper => !(paper.type === 'Original' && (paper.state || '').toUpperCase() === 'COMPLETED')).map((paper, idx) => (
                      <tr key={idx} className="hover:bg-slate-100 transition-colors">
                      {(() => {
                        const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
                        let btnText = 'Open';
                        let onClickAction = () => { navigate('/papers'); addToast('Check Document directory options', 'info'); };
                        let showBtn = true;

                        if (stateNorm === 'AI-PROCESSED') {
                          btnText = 'Manual Review';
                          onClickAction = () => { navigate(`/verification?paper=${encodeURIComponent(paper.paper_name)}&state=${encodeURIComponent(paper.state)}`); addToast(`Opening Verification workdesk for ${paper.paper_name}`, 'info'); };
                        } else if (stateNorm === 'MANUALLY-VERIFIED' || stateNorm === 'MANUAL-VERIFIED') {
                          if (paper.type === 'Manually-Uploaded') {
                            btnText = 'Review';
                            onClickAction = () => { navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`); addToast(`Opening Review for ${paper.paper_name}`, 'info'); };
                          } else {
                            btnText = 'Generate Variant';
                            onClickAction = () => { navigate(`/variant_gen?paper=${encodeURIComponent(paper.paper_name)}&state=${encodeURIComponent(paper.state)}`); addToast(`Opening Variant Gen for ${paper.paper_name}`, 'info'); };
                          }
                        } else if (stateNorm === 'SANDBOX-VERIFIED' || stateNorm === 'SANDBOX-SKIPPED' || stateNorm === 'MANUALLY-CREATED' || stateNorm === 'SANDBOX-REVIEW') {
                          if ((paper.type === 'Manually-Uploaded' || stateNorm === 'MANUALLY-CREATED') && paper.questions_count < paper.total_questions) {
                            btnText = 'Add Questions';
                            onClickAction = () => {
                              navigate(`/manual_entry?paperName=${encodeURIComponent(paper.paper_name)}&examCode=${encodeURIComponent(paper.exam_code || '')}&totalQuestions=${paper.total_questions}&yearAndShift=${encodeURIComponent(paper.year_and_shift || '')}&questionsCount=${paper.questions_count}`);
                            };
                          } else {
                            btnText = 'Review';
                            onClickAction = () => { navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`); addToast(`Opening Review for ${paper.paper_name}`, 'info'); };
                          }
                        } else if (stateNorm === 'COMPLETED' || stateNorm === 'DONE') {
                          btnText = 'Open';
                          onClickAction = () => { navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`); addToast(`Opening Review for ${paper.paper_name}`, 'info'); };
                        }

                        return (
                          <>
                            <td className="p-4">
                              <p className="font-semibold text-slate-800">{paper.paper_name}</p>
                            </td>
                            <td className="p-4 text-slate-500">{paper.exam_code}</td>
                            <td className="p-4 text-slate-400 text-xs">
                              {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stateNorm === 'VERIFIED' || stateNorm === 'MANUALLY-VERIFIED' || stateNorm === 'MANUAL-VERIFIED' || stateNorm === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : stateNorm === 'AI-PROCESSED' || stateNorm === 'SANDBOX-VERIFIED' || stateNorm === 'SANDBOX-SKIPPED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                {(stateNorm === 'VERIFIED' || stateNorm === 'MANUALLY-VERIFIED' || stateNorm === 'MANUAL-VERIFIED' || stateNorm === 'COMPLETED' || stateNorm === 'SANDBOX-VERIFIED' || stateNorm === 'SANDBOX-SKIPPED') && <Check className="w-3 h-3" />}
                                {(stateNorm === 'AI-PROCESSED') && <Sparkles className="w-3 h-3" />}
                                {(stateNorm === 'PENDING' || !stateNorm) && <RotateCw className="w-3 h-3 animate-spin" />}
                                {paper.state || 'PENDING'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center">
                                <label className={`relative inline-flex items-center ${stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={paper.is_active || false}
                                    onChange={async () => {
                                      if (stateNorm !== 'COMPLETED' && stateNorm !== 'DONE') return;
                                      try {
                                        const token = localStorage.getItem('auth_token');
                                        const newStatus = !paper.is_active;
                                        const res = await fetch(`http://localhost:8000/api/exam-paper/${encodeURIComponent(paper.paper_name)}/status?is_active=${newStatus}`, {
                                          method: 'PATCH',
                                          headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                          addToast(`Paper ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
                                          setApiPapers(prev => prev.map(p => p.paper_name === paper.paper_name ? { ...p, is_active: newStatus } : p));
                                        } else {
                                          addToast('Failed to update paper status', 'error');
                                        }
                                      } catch (e) {
                                        addToast('Error updating paper status', 'error');
                                      }
                                    }}
                                    disabled={stateNorm !== 'COMPLETED' && stateNorm !== 'DONE'}
                                  />
                                  <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors ${stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' ? 'bg-slate-200 opacity-50' : 'bg-slate-300 peer-checked:bg-blue-600'} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                                </label>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              {showBtn && (
                                <button
                                  onClick={onClickAction}
                                  className="text-xs font-semibold text-[#003fb1] hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                                >
                                  {btnText}
                                </button>
                              )}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#c3c5d7] text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <th className="p-4">Teacher</th>
                    <th className="p-4">Subject Core</th>
                    <th className="p-4 text-right">Papers Ingested</th>
                    <th className="p-4 text-right">Verified Questions</th>
                    <th className="p-4 text-center">Duty Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {teacherPerformanceList.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-100 transition-colors">
                      <td className="p-4 font-semibold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-[#003fb1]">
                          {teacher.avatar}
                        </div>
                        {teacher.name}
                      </td>
                      <td className="p-4 text-slate-500">{teacher.subject}</td>
                      <td className="p-4 text-right font-medium text-slate-700">{teacher.papers}</td>
                      <td className="p-4 text-right font-medium text-slate-700">{teacher.verified}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${teacher.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : teacher.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => addToast(`Auditing verifications by ${teacher.name}`, 'info')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
