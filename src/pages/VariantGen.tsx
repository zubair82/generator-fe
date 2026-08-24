import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Sparkles, Sliders, Check, Eye, Pencil, Wand2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { LivePreview } from '../components/math/LivePreview';
import { MultilineMathField } from '../components/math/MultilineMathField';
import { MathToolbar } from '../components/common/MathToolbar';
import { smartFormatMath, normalizeQuestion } from '../utils/mathFormatters';

export function VariantGen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useUI();
  
  const [activeGenParam, setActiveGenParam] = useState<'Numerical' | 'Contextual'>('Numerical');
  const [variantCount, setVariantCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  
  // State for fetched source question and the variant we are editing
  const [question, setQuestion] = useState<any>(null);
  const [variant, setVariant] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [currentQNo, setCurrentQNo] = useState<number | null>(null);
  const [totalQ, setTotalQ] = useState<number | null>(null);
  
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
  
  const rawPaperName = searchParams.get('paper') || 'Unknown Paper';
  const paperState = searchParams.get('state') || 'MANUAL-VERIFIED';

  const basePaperName = rawPaperName.replace(/_vari?ent$/i, '');
  const variantPaperName = basePaperName + '_varient';
  const paperName = rawPaperName;

  const fetchVariantData = async (qNo: number, pName: string, originalQ?: any) => {
    const token = localStorage.getItem('auth_token');
    const targetPName = pName.replace(/_vari?ent$/i, '') + '_varient';
    const variantResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/production-question?paper_name=${encodeURIComponent(targetPName)}&question_no=${qNo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (variantResponse.ok) {
      const varData = await variantResponse.json();
      if (varData.success && varData.question) {
        const v = normalizeQuestion(varData.question);
        if (!v.diagrams && originalQ && originalQ.diagrams) {
          v.diagrams = originalQ.diagrams;
        }
        setVariant(v);
        return;
      }
    }
    setVariant({ question_latex: '', answer: '', explanation: '', options: { "A": "", "B": "", "C": "", "D": "" }, diagrams: originalQ?.diagrams || '', subject: originalQ?.subject || '', tag: originalQ?.tag || '' });
  };

  const fetchingRef = useRef(false);

  const fetchQuestion = useCallback(async (targetQNo?: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      let url = `${import.meta.env.VITE_API_URL}/api/questions?paper_name=${encodeURIComponent(basePaperName)}&state=${encodeURIComponent(paperState)}`;
      if (targetQNo !== undefined) {
        url = `${import.meta.env.VITE_API_URL}/api/question-by-no?paper_name=${encodeURIComponent(basePaperName)}&question_no=${targetQNo}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.question) {
          const q = normalizeQuestion(data.question);
          
          setQuestion(q);
          setCurrentQNo(q.question_no);
          if (data.total_questions !== undefined) {
             setTotalQ(data.total_questions);
          }
          
          try {
            await fetchVariantData(q.question_no, paperName, q);
          } catch (e) {
            setVariant({ question_latex: '', answer: '', explanation: '', options: { "A": "", "B": "", "C": "", "D": "" }, diagrams: q.diagrams || '', subject: q.subject || '', tag: q.tag || '' });
          }
        } else {
          addToast('No questions found for this paper', 'info');
          navigate(-1);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePaperName, paperState]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const generateVariant = async () => {
    if (!question) return;
    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const isContextual = activeGenParam !== 'Numerical';
      const modeStr = isContextual ? 'rephrase' : 'parameter_change';
      const baseUrl = `${import.meta.env.VITE_API_URL}/api/variant-generator/${encodeURIComponent(basePaperName)}?question_no=${question.question_no}&mode=${modeStr}`;
      
      const variantTypeStr = isContextual ? 'Contextual' : 'Numerical';
      addToast(`Generating ${variantTypeStr} variant (Sandbox Skipped)...`, 'info');
      
      let fetchUrl = `${baseUrl}&skip_sandbox=true`;
      if (customInstruction.trim()) {
        fetchUrl += `&custom_instruction=${encodeURIComponent(customInstruction.trim())}`;
      }

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        addToast('Variant synthesized successfully', 'success');
        await fetchVariantData(question.question_no, paperName, question);
        setPreviewMode(true);
      } else {
        const errData = await response.json().catch(() => null);
        addToast(errData?.detail || `Failed to generate ${variantTypeStr.toLowerCase()} variant`, 'error');
      }
    } catch (err) {
      console.error('Error generating variant:', err);
      addToast('Error generating variant', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (currentQNo !== null) fetchQuestion(currentQNo + 1);
  };

  const handlePrev = () => {
    if (currentQNo !== null && currentQNo > 1) fetchQuestion(currentQNo - 1);
  };

  const isApprovable = question && variant && 
    variant.question_latex?.trim() && 
    variant.answer?.trim() && 
    variant.explanation?.trim() && 
    variant.subject?.trim() && 
    variant.tag?.trim() && 
    Object.values(variant.options || {}).every((v: any) => v && String(v).trim() !== '');

  const handleApprove = async () => {
    if (!question) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approve-variant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paper_name: basePaperName,
          question_no: question.question_no,
          subject: variant?.subject || '',
          tag: variant?.tag || '',
          question_latex: variant?.question_latex || '',
          options: variant?.options || {},
          answer: variant?.answer || '',
          explanation: variant?.explanation || '',
          diagrams: variant?.diagrams || ''
        })
      });
      
      if (res.ok) {
        addToast('Variant Approved!', 'success');
        if (currentQNo !== null) {
          if (totalQ && currentQNo === totalQ) {
            navigate('/dashboard');
          } else {
            fetchQuestion(currentQNo + 1);
          }
        }
      } else {
        addToast('Failed to approve variant', 'error');
      }
    } catch (error) {
      addToast('Error approving variant', 'error');
    }
  };

  const handleDiscard = async () => {
    if (!question) return;
    if (!window.confirm("Are you sure you want to discard this variant?")) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/discard-variant?paper_name=${encodeURIComponent(variantPaperName)}&question_no=${question.question_no}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        addToast('Variant discarded', 'info');
        setVariant({ question_latex: '', answer: '', explanation: '', options: { "A": "", "B": "", "C": "", "D": "" }, diagrams: '', subject: '', tag: '', state: '' });
      } else {
        addToast('Failed to discard variant', 'error');
      }
    } catch (error) {
      addToast('Error discarding variant', 'error');
    }
  };

  const updateVariantOption = (key: string, val: string) => {
    setVariant((prev: any) => ({
      ...prev,
      options: { ...prev.options, [key]: val }
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003fb1]"></div>
      </div>
    );
  }

  if (!question || !variant) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-500">
        No question data available.
      </div>
    );
  }

  return (
      <div className="space-y-6 flex-1 w-full h-full flex flex-col max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">AI Variant Generation</h2>
            <p className="text-xs text-slate-500">Synthesize structurally equivalent question variants for {paperName}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button 
            onClick={handlePrev}
            disabled={currentQNo === null || currentQNo <= 1}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-500 min-w-[3rem] text-center">
            Q{currentQNo || '-'}
          </span>
          <button 
            onClick={handleNext}
            disabled={currentQNo === null || (totalQ !== null && currentQNo >= totalQ)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Next
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          <button 
            onClick={handleDiscard}
            disabled={!question || !variant || !variant.state}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          
          <button 
            onClick={handleApprove}
            disabled={!isApprovable}
            className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-4"
          >
            <Check size={16} />
            Approve
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 items-start">
        {/* LEFT COLUMN: Source Base Question */}
        <div className="space-y-6 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-2">
              Source Base Question
            </h3>
            
            <div className="space-y-6">
              {/* Question */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Extracted Question</label>
                <LivePreview content={question.question_latex} diagramsText={question.diagrams} />
              </div>

              {/* Options */}
              {question.question_type !== 'numerical' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Extracted Options</label>
                  <div className="flex flex-col gap-3">
                    {Object.entries(question.options || {}).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex gap-3">
                        <div className="w-8 h-8 mt-1 flex shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 font-bold text-sm shadow-sm border border-slate-200">
                          {k}
                        </div>
                        <div className="flex-1 min-w-0">
                          <LivePreview content={v} diagramsText={question.diagrams} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Answer</label>
                <LivePreview content={question.answer} diagramsText={question.diagrams} />
              </div>

              {/* Explanation */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Explanation</label>
                <LivePreview content={question.explanation} diagramsText={question.diagrams} />
              </div>

              {/* Diagrams */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Diagrams</label>
                <LivePreview content={question.diagrams} />
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Subject</label>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                    {question.subject || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide">Tag/Topic</label>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                    {question.tag || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Generated Output */}
        <div className="space-y-6 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="bg-white border-2 border-purple-100 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-purple-100 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Generated Output
              </h3>
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

            <div className="space-y-6">
              {!previewMode && <MathToolbar activeField={activeFieldId} onInsertSymbol={handleInsertSymbol} />}
              {/* Variant Parameters */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">Variant Strategy</span>
                  <div className="flex gap-2">
                    {['Numerical', 'Contextual'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveGenParam(type as any)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all border ${
                          activeGenParam === type
                            ? 'bg-purple-200 border-purple-300 text-purple-900'
                            : 'bg-white border-purple-100 text-purple-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Optional: Enter custom instructions for the AI (e.g. 'Make the parameters larger', 'Use a different real-world context')"
                    className="w-full bg-white border border-purple-200 rounded-md p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-y min-h-[60px]"
                  />
                </div>
                <button
                  onClick={generateVariant}
                  disabled={isGenerating}
                  className="w-full py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-1">
                      <span>Generating Variant</span>
                      <span className="flex w-4">
                        <span className="animate-[bounce_1s_infinite] delay-0">.</span>
                        <span className="animate-[bounce_1s_infinite] delay-100">.</span>
                        <span className="animate-[bounce_1s_infinite] delay-200">.</span>
                      </span>
                    </div>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      Generate New Variant
                    </>
                  )}
                </button>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Extracted Question <span className="text-red-500">*</span></label>
                {previewMode ? (
                  <LivePreview content={variant.question_latex} diagramsText={variant.diagrams} />
                ) : (
                  <MultilineMathField
                    ref={(el: any) => mfRefs.current['Question'] = el}
                    fieldId="Question"
                    onFocus={handleFocus}
                    value={variant.question_latex || ''}
                    onChange={(val: string) => setVariant({ ...variant, question_latex: val })}
                  />
                )}
              </div>

              {/* Options */}
              {variant.question_type !== 'numerical' && (
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Extracted Options <span className="text-red-500">*</span></label>
                  <div className="flex flex-col gap-3">
                    {Object.entries(variant.options || {}).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex gap-3">
                        <div className="w-8 h-8 mt-1 flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-bold text-sm shadow-sm border border-slate-200">
                          {k}
                        </div>
                        <div className="flex-1 min-w-0">
                          {previewMode ? (
                            <LivePreview content={v} diagramsText={variant.diagrams} />
                          ) : (
                            <MultilineMathField
                              ref={(el: any) => mfRefs.current[`Option ${k}`] = el}
                              fieldId={`Option ${k}`}
                              onFocus={handleFocus}
                              value={v || ''}
                              onChange={(val: string) => updateVariantOption(k, val)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Answer <span className="text-red-500">*</span></label>
                {previewMode ? (
                  <LivePreview content={variant.answer} diagramsText={variant.diagrams} />
                ) : (
                  <MultilineMathField
                    ref={(el: any) => mfRefs.current['Answer'] = el}
                    fieldId="Answer"
                    onFocus={handleFocus}
                    value={variant.answer || ''}
                    onChange={(val: string) => setVariant({ ...variant, answer: val })}
                  />
                )}
              </div>

              {/* Explanation */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Explanation <span className="text-red-500">*</span></label>
                {previewMode ? (
                  <LivePreview content={variant.explanation} diagramsText={variant.diagrams} />
                ) : (
                  <MultilineMathField
                    ref={(el: any) => mfRefs.current['Explanation'] = el}
                    fieldId="Explanation"
                    onFocus={handleFocus}
                    value={variant.explanation || ''}
                    onChange={(val: string) => setVariant({ ...variant, explanation: val })}
                  />
                )}
              </div>

              {/* Diagrams */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Diagrams</label>
                {previewMode ? (
                  <LivePreview content={variant.diagrams} />
                ) : (
                  <textarea
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono resize-y"
                    value={variant.diagrams || ''}
                    onChange={(e) => setVariant({ ...variant, diagrams: e.target.value })}
                    placeholder="![alt text](image url)"
                  />
                )}
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Status</label>
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                    {variant.state || 'Not generated'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
                  {previewMode ? (
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                      {variant.subject || 'Not specified'}
                    </div>
                  ) : (
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700"
                      value={variant.subject ? variant.subject.toLowerCase() : ''}
                      onChange={(e) => setVariant({ ...variant, subject: e.target.value })}
                    >
                      <option value="" disabled>Select one</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="mathematics">Mathematics</option>
                      <option value="biology">Biology</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Tag/Topic <span className="text-red-500">*</span></label>
                  {previewMode ? (
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                      {variant.tag || 'Not specified'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700"
                      value={variant.tag || ''}
                      onChange={(e) => setVariant({ ...variant, tag: e.target.value })}
                      placeholder="e.g. Thermodynamics"
                    />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>
      </div>
  );
}
