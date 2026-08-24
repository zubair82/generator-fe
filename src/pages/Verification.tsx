import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Check, X, Eye, Type, SplitSquareHorizontal, Plus, ArrowDown, ArrowUp, Trash2, Pencil } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { MathToolbar } from '../components/common/MathToolbar';

import { smartFormatMath, normalizeQuestion } from '../utils/mathFormatters';
import { MultilineMathField } from '../components/math/MultilineMathField';
import { LivePreview } from '../components/math/LivePreview';

export function Verification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useUI();

  const [question, setQuestion] = useState<any>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [previewMode, setPreviewMode] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const mfRefs = useRef<{ [key: string]: (HTMLElement | null)[] }>({});

  const handleFocus = (fieldId: string, lineIndex: number) => {
    setActiveFieldId(fieldId);
    setActiveLineIndex(lineIndex);
  };

  const handleInsertSymbol = (symbol: string) => {
    if (activeFieldId && mfRefs.current[activeFieldId] && mfRefs.current[activeFieldId][activeLineIndex]) {
      const mf = mfRefs.current[activeFieldId][activeLineIndex] as any;
      if (mf && typeof mf.insert === 'function') {
        mf.insert(symbol);
        mf.focus();
      }
    }
  };

  const paperName = searchParams.get('paper') || 'Unknown Paper';
  const paperState = searchParams.get('state') || 'AI_PROCESSED';

  const fetchingRef = useRef(false);

  const fetchQuestion = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/questions?paper_name=${encodeURIComponent(paperName)}&state=${encodeURIComponent(paperState)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.question) {
          const q = normalizeQuestion(data.question);
          setQuestion(q);
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        } else {
          setQuestion(null);
          addToast('No questions found or all verified', 'info');
          navigate('/dashboard');
        }
      } else if (response.status === 404) {
        setQuestion(null);
        addToast('No questions found for review.', 'success');
        navigate('/dashboard');
      } else {
        addToast('Failed to fetch question', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch question:', err);
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [paperName, paperState, addToast]);

  useEffect(() => {
    if (paperName) fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperName]);

  const handlePrevious = async () => {
    if (!question || !question.question_id || question.question_no === 1) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const prevQuestionId = question.question_id - 1;
      const response = await fetch(`http://localhost:8000/api/questions/${prevQuestionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.question) {
          const q = normalizeQuestion(data.question);
          setQuestion(q);
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        } else {
          addToast('Could not load previous question', 'error');
        }
      } else {
        addToast('Failed to fetch previous question', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch previous question:', err);
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!question || !question.question_id || (totalQuestions && question.question_no === totalQuestions)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const nextQuestionId = question.question_id + 1;
      const response = await fetch(`http://localhost:8000/api/questions/${nextQuestionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.question) {
          const q = normalizeQuestion(data.question);
          setQuestion(q);
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        } else {
          addToast('Could not load next question', 'error');
        }
      } else {
        addToast('Failed to fetch next question', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch next question:', err);
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndNext = async () => {
    if (!question || !question.question_id) {
      addToast('No active question to approve', 'error');
      return;
    }

    if (!question.subject || question.subject.trim() === '') {
      addToast('Please select a subject before approving', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const payloadOptions = question.options ? Object.keys(question.options).map(k => ({
        option_id: k,
        text: question.options[k],
        latex: question.options[k]
      })) : [];

      const payload = {
        question_latex: question.question_latex,
        options: payloadOptions,
        answer: question.answer,
        explanation: question.explanation,
        diagrams: question.diagrams ? [question.diagrams] : [],
        subject: question.subject,
        tag: question.tag || '',
        state: 'Manual-Verified'
      };

      const res = await fetch(`http://localhost:8000/api/update-question/${question.question_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast('Question verified!', 'success');
        
        if (totalQuestions && question.question_no === totalQuestions) {
          try {
            const qType = question.type || 'Manually-Uploaded';
            const moveRes = await fetch(`http://localhost:8000/api/move-to-production/${encodeURIComponent(paperName)}?type=${encodeURIComponent(qType)}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (moveRes.ok) {
              addToast('Paper moved to production!', 'success');
            } else {
              addToast('Failed to move paper to production', 'error');
            }
          } catch (e) {
            console.error(e);
          }
          navigate('/dashboard');
        } else {
          await fetchQuestion();
        }
      } else {
        const errorData = await res.json();
        let errMsg = 'Failed to update question';
        if (errorData.detail) {
          errMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
        addToast(errMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating question', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string, optionId?: string) => {
    setQuestion((prev: any) => {
      const next = { ...prev };
      if (optionId) {
        next.options = { ...next.options, [optionId]: value };
      } else {
        next[field] = value;
      }
      return next;
    });
  };

  const handleImagePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          const currentValue = question.diagrams || '';

          // Count existing tags to generate a new index
          const matches = currentValue.match(/\[DIAGRAM_(\d+)\]/g);
          let nextIndex = 1;
          if (matches) {
            const indices = matches.map((m: string) => parseInt(m.replace(/[^\d]/g, ''), 10));
            nextIndex = Math.max(...indices) + 1;
          }
          const tag = `[DIAGRAM_${nextIndex}]`;
          const markdownImage = `\n${tag}: ![DIAGRAM_${nextIndex}](${base64String})\n`;

          const target = e.target as HTMLTextAreaElement;
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;

          const newValue = currentValue.substring(0, start) + markdownImage + currentValue.substring(end);
          updateField('diagrams', newValue);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-100px)] flex flex-col -m-6 -mb-8">
      <style>{`
        math-field::part(container) {
          font-family: ui-sans-serif, system-ui, sans-serif !important;
        }
        .quill-preview-only .ql-editor {
          padding: 0;
        }
        .quill-preview-only .ql-container.ql-snow {
          border: none;
        }
      `}</style>
      <div className="bg-white border-b border-[#c3c5d7] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/papers')} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-bold text-lg text-slate-900 leading-none">{paperName}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Side-by-side Verification</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-600">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold w-12 text-center text-slate-700">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-600">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <button className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-lg hover:bg-slate-50">Pause Review</button>
        </div>
      </div>

      <div className="flex-1 w-full flex border-t border-[#c3c5d7] overflow-hidden">
        <div className="w-1/2 h-full bg-[#525659] overflow-auto relative border-r border-[#c3c5d7]">
          <div className="sticky top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <span className="bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md pointer-events-auto shadow-sm backdrop-blur-sm">Source PDF Document</span>
          </div>
          <div className="w-full h-full pt-16 pb-4 px-4 flex justify-center items-center">
            <iframe
              src={`http://localhost:8000/api/pdf/${encodeURIComponent(paperName)}.pdf#zoom=${zoomLevel}&navpanes=0&toolbar=0`}
              className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-300"
              title="Source PDF"
              onError={() => addToast(`PDF not found: ${paperName}.pdf`, 'error')}
            />
          </div>
        </div>

        <div className="w-1/2 h-full bg-[#faf8ff] flex flex-col overflow-hidden relative">

          <div className="bg-white border-b border-[#c3c5d7] px-4 py-2.5 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-bold text-[#003fb1] uppercase tracking-widest flex items-center gap-2">
              <SplitSquareHorizontal className="w-4 h-4" />
              AI Extraction Review: {question ? `Q${question.question_no}` : '-'}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!previewMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Mode
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            <div className="max-w-xl mx-auto space-y-4">
              {!previewMode && <MathToolbar activeField={activeFieldId} onInsertSymbol={handleInsertSymbol} />}
              {loading ? (
                <div className="text-center p-8 text-slate-500">Loading question data...</div>
              ) : !question ? (
                <div className="text-center p-8 text-slate-500">No questions found.</div>
              ) : (
                <>
                  <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm">
                    <label className="text-sm font-bold text-slate-800 mb-3 block">Extracted Question</label>
                    {previewMode ? (
                      <LivePreview content={question.question_latex} diagramsText={question.diagrams} />
                    ) : (
                      <MultilineMathField
                        ref={(el: any) => mfRefs.current['Question'] = el}
                        fieldId="Question"
                        onFocus={handleFocus}
                        value={question.question_latex || ''}
                        onChange={(val: string) => updateField('question_latex', val)}
                      />
                    )}
                  </div>

                  {question.question_type !== 'numerical' && question.options && (
                    <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm">
                      <label className="text-sm font-bold text-slate-800 mb-3 block">Extracted Options</label>
                      <div className="space-y-3">
                        {Object.entries(question.options).map(([k, v]: [string, any], idx: number) => (
                          <div key={idx} className="flex gap-3 group">
                            <div className="w-9 h-9 mt-1 flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-bold text-sm shadow-sm border border-slate-200 group-focus-within:bg-[#003fb1] group-focus-within:text-white transition-colors">{k}</div>
                            <div className="flex-1 min-w-0">
                              {previewMode ? (
                                <LivePreview content={v} diagramsText={question.diagrams} />
                              ) : (
                                <MultilineMathField
                                  ref={(el: any) => mfRefs.current[`Option ${k}`] = el}
                                  fieldId={`Option ${k}`}
                                  onFocus={handleFocus}
                                  value={v || ''}
                                  onChange={(val: string) => updateField('options', val, k)}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm">
                    <label className="text-sm font-bold text-slate-800 mb-3 block">Answer</label>
                    {previewMode ? (
                      <LivePreview content={question.answer} diagramsText={question.diagrams} />
                    ) : (
                      <MultilineMathField
                        ref={(el: any) => mfRefs.current['Answer'] = el}
                        fieldId="Answer"
                        onFocus={handleFocus}
                        value={question.answer || ''}
                        onChange={(val: string) => updateField('answer', val)}
                      />
                    )}
                  </div>

                  {question.explanation && (
                    <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm">
                      <label className="text-sm font-bold text-slate-800 mb-3 block">Explanation</label>
                      {previewMode ? (
                        <LivePreview content={question.explanation} diagramsText={question.diagrams} />
                      ) : (
                        <MultilineMathField
                          ref={(el: any) => mfRefs.current['Explanation'] = el}
                          fieldId="Explanation"
                          onFocus={handleFocus}
                          value={question.explanation || ''}
                          onChange={(val: string) => updateField('explanation', val)}
                        />
                      )}
                    </div>
                  )}

                  <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-slate-800">Diagrams</label>
                      <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">Paste Image Here</span>
                    </div>
                    {previewMode ? (
                      <LivePreview content={question.diagrams} />
                    ) : (
                      <textarea
                        className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-[#003fb1] focus:ring-2 focus:ring-blue-500/20 transition-all font-mono resize-y"
                        placeholder="Paste cropped image here (Cmd+V / Ctrl+V)"
                        value={question.diagrams || ''}
                        onChange={(e) => updateField('diagrams', e.target.value)}
                        onPaste={handleImagePaste}
                      />
                    )}
                  </div>

                  <div className="bg-white border border-[#c3c5d7] rounded-xl p-4 shadow-sm grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Subject <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={question.subject ? question.subject.toLowerCase() : ''}
                        onChange={(e) => updateField('subject', e.target.value)}
                        className={`w-full text-sm border-slate-200 rounded p-1.5 focus:border-[#003fb1] outline-none bg-slate-50 ${!question.subject ? 'text-slate-400' : 'text-slate-800'}`}
                      >
                        <option value="" disabled>Select one</option>
                        <option value="mathematics">Mathematics</option>
                        <option value="physics">Physics</option>
                        <option value="chemistry">Chemistry</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tag / Topic</label>
                      <input
                        type="text"
                        value={question.tag || ''}
                        onChange={(e) => updateField('tag', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded p-1.5 focus:border-[#003fb1] outline-none bg-slate-50 border"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border-t border-[#c3c5d7] px-6 py-5 flex justify-between items-center shrink-0">
            <button className="px-4 py-2 flex items-center gap-2 text-rose-600 font-semibold text-xs hover:bg-rose-50 rounded-lg transition-colors">
              <X className="w-4 h-4" /> Flag as Error
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={loading || !question || question.question_no === 1}
                className="px-8 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={loading || !question || (totalQuestions !== null && question.question_no === totalQuestions)}
                className="px-8 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                Next
              </button>
              <button
                onClick={handleApproveAndNext}
                disabled={loading || !question}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Check className="w-5 h-5" /> Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
