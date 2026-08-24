import React, { useState, useEffect } from 'react';
import { Check, Sparkles, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

export function Papers() {
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [paperFilter, setPaperFilter] = useState<'ALL' | 'REVIEW'>('ALL');
  
  const [apiPapers, setApiPapers] = useState<any[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  const fetchingRef = React.useRef(false);

  useEffect(() => {
    if (fetchingRef.current) return;
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
    
    fetchPapers();
  }, [addToast]);

  // Apply filter
  const filteredPapers = apiPapers.filter(paper => {
    if (paper.type === 'Original' && (paper.state || '').toUpperCase() === 'COMPLETED') {
      return false;
    }
    if (paperFilter === 'REVIEW') {
      const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
      return stateNorm === 'AI-PROCESSED';
    }
    return true;
  });

  return (
    <div className="space-y-6 flex-1 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <h2 className="font-sans font-bold text-3xl text-slate-900 tracking-tight">Question Papers</h2>
          <p className="text-sm text-slate-500 mt-1">Manage, review, and verify uploaded academic exam sheets and files.</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => {
              setPaperFilter('ALL');
              addToast('Showing all papers', 'info');
            }}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
              paperFilter === 'ALL'
                ? 'bg-blue-50 border-[#003fb1] text-[#003fb1]'
                : 'bg-white border-[#c3c5d7] text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Papers
          </button>
          <button
            onClick={() => {
              setPaperFilter('REVIEW');
              addToast('Filtered by Needs Review', 'info');
            }}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
              paperFilter === 'REVIEW'
                ? 'bg-blue-50 border-[#003fb1] text-[#003fb1]'
                : 'bg-white border-[#c3c5d7] text-slate-600 hover:bg-slate-50'
            }`}
          >
            Needs Review
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#c3c5d7] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b border-[#c3c5d7] bg-slate-50/50 flex flex-wrap gap-2 items-center justify-between">
          <span className="text-xs font-bold text-[#434654] uppercase tracking-wider">Recent Uploaded Papers</span>
          <span className="text-xs text-slate-500">
            Showing {filteredPapers.length} of {apiPapers.length} documents
          </span>
        </div>

        <div className="overflow-x-auto">
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
              ) : filteredPapers.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-slate-500">No papers found.</td></tr>
              ) : filteredPapers.map((paper, idx) => (
                <tr key={idx} className="hover:bg-slate-100 transition-colors">
                  {(() => {
                    const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
                    let btnText = 'Open';
                    let onClickAction = () => { addToast('Check Document directory options', 'info'); };
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
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/20">
          <button className="text-xs text-slate-400 font-semibold flex items-center gap-1 cursor-not-allowed" disabled>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex gap-1 text-xs">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-[#003fb1] font-bold flex items-center justify-center">1</span>
          </div>
          <button
            onClick={() => addToast('Paginating next (Demo limit)', 'info')}
            className="text-xs text-[#003fb1] hover:underline font-semibold flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
