import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PlusCircle, Eye, Pencil } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { LivePreview } from '../components/math/LivePreview';
import { MultilineMathField } from '../components/math/MultilineMathField';
import { MathToolbar } from '../components/common/MathToolbar';
import { smartFormatMath, normalizeQuestion } from '../utils/mathFormatters';

export function Review() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paper = searchParams.get('paper') || '';
  const { addToast } = useUI();

  // Local state
  const [currentQNo, setCurrentQNo] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [subject, setSubject] = useState('Mathematics');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('Sandbox-Verified');
  const [examCode, setExamCode] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [diagrams, setDiagrams] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(true);
  
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

  const processLoadedQuestion = (prodData: any) => {
    let pQ = prodData.question;
    pQ = normalizeQuestion(pQ);
    
    setTotalQuestions(prodData.total_questions || 0);
    
    setCurrentQNo(pQ.question_no);
    setQuestionId(pQ.question_id);
    setSubject(pQ.subject || 'Mathematics');
    setTag(pQ.tag || '');
    setStatus(pQ.state || 'Sandbox-Verified');
    setExamCode(pQ.exam_code || '');
    setQuestionType(pQ.question_type || 'mcq');
    
    setQuestionText(pQ.question_latex || '');
    setExplanation(pQ.explanation || '');
    setAnswer(pQ.answer || '');
    setCorrectOption(pQ.answer as any || null);
    
    setDiagrams(pQ.diagrams || '');
    
    const opts = pQ.options || {};
    setOptionA(opts['A'] || '');
    setOptionB(opts['B'] || '');
    setOptionC(opts['C'] || '');
    setOptionD(opts['D'] || '');
  };

  const fetchingRef = useRef(false);

  const loadNextQuestion = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const prodRes = await fetch(`http://localhost:8000/api/production-questions/by-state?paper_name=${encodeURIComponent(paper)}&state=Sandbox-Verified,Sandbox-Skipped,Reviewed,Completed`, { headers });
      
      if (prodRes.status === 404) {
        addToast('No more questions to review for this paper.', 'success');
        navigate('/dashboard');
        return;
      }
      if (!prodRes.ok) throw new Error('Failed to fetch next production question');
      
      const prodData = await prodRes.json();
      processLoadedQuestion(prodData);
      
    } catch (err) {
      console.error(err);
      addToast('Error loading review data', 'error');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const loadQuestionByNo = async (qNo: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const res = await fetch(`http://localhost:8000/api/production-question?paper_name=${encodeURIComponent(paper)}&question_no=${qNo}`, { headers });
      
      if (!res.ok) {
        addToast(`Could not load question ${qNo}`, 'error');
        return;
      }
      
      const prodData = await res.json();
      processLoadedQuestion(prodData);
      
    } catch (err) {
      console.error(err);
      addToast('Error loading review data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paper) {
      loadNextQuestion();
    }
  }, [paper]);

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
          const currentValue = diagrams || '';

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
          setDiagrams(newValue);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };



  const handleFinalize = async () => {
    if (questionId === null) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const payload = {
        state: 'Completed',
        question_latex: questionText,
        options: { "A": optionA, "B": optionB, "C": optionC, "D": optionD },
        answer: answer,
        explanation: explanation,
        diagrams: diagrams,
        subject: subject,
        tag: tag
      };
      
      const res = await fetch(`http://localhost:8000/api/production-questions/${questionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update question: ${errorText}`);
      }
      
      addToast('Question updated successfully!', 'success');
      loadNextQuestion();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error updating question', 'error');
      setLoading(false);
    }
  };

  if (loading && currentQNo === null) {
    return <div className="p-8 text-center text-slate-500">Loading question data...</div>;
  }

  return (
    <div className="space-y-6 flex-1 w-full h-full flex flex-col">
      {/* Sticky Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">Review</h2>
            <p className="text-xs text-slate-500">Review Sandbox-verified variants before completing the process.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            className="flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            onClick={() => {
              if (currentQNo && currentQNo > 1) loadQuestionByNo(currentQNo - 1);
            }}
            disabled={loading || !currentQNo || currentQNo === 1}
          >
            Previous
          </button>
          
          <button 
            className="flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            onClick={() => {
              if (currentQNo && currentQNo < totalQuestions) loadQuestionByNo(currentQNo + 1);
            }}
            disabled={loading || !currentQNo || currentQNo === totalQuestions}
          >
            Next
          </button>

          <button 
            className="flex items-center gap-2 bg-[#003fb1] hover:bg-[#002f8a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 ml-2"
            onClick={handleFinalize}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Review Content</h3>
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

          {!previewMode && <MathToolbar activeField={activeFieldId} onInsertSymbol={handleInsertSymbol} />}
          
            <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <label className="block font-semibold text-sm text-slate-800 mb-2">1. Question Content <span className="text-red-500">*</span></label>
            {previewMode ? (
               <LivePreview content={questionText} diagramsText={diagrams} />
            ) : (
               <MultilineMathField
                 ref={(el: any) => mfRefs.current['Question'] = el}
                 fieldId="Question"
                 onFocus={handleFocus}
                 value={questionText || ''}
                 onChange={(val: string) => setQuestionText(val)}
               />
            )}
          </div>

          {questionType !== 'numerical' && (
            <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="font-semibold text-sm text-slate-800">2. Options & Correct Indicator <span className="text-red-500">*</span></label>
                <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-[#003fb1] rounded-full">
                  Select radio of correct answer
                </span>
              </div>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center gap-3 p-2 border border-slate-100 rounded-xl hover:border-[#003fb1] transition-all bg-slate-50/20"
                  >
                    <input
                      type="radio"
                      name="correct"
                      checked={correctOption === opt}
                      onChange={() => {
                        setCorrectOption(opt as 'A' | 'B' | 'C' | 'D');
                      }}
                      className="w-4 h-4 text-[#003fb1] focus:ring-[#003fb1]"
                    />
                    <span className="font-bold text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded">{opt}</span>
                    {previewMode ? (
                       <div className="flex-1 min-w-0">
                         <LivePreview content={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD} diagramsText={diagrams} />
                       </div>
                    ) : (
                       <div className="flex-1 min-w-0">
                         <MultilineMathField
                           ref={(el: any) => mfRefs.current[`Option ${opt}`] = el}
                           fieldId={`Option ${opt}`}
                           onFocus={handleFocus}
                           value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD}
                           onChange={(val: string) => {
                             if (opt === 'A') setOptionA(val);
                             if (opt === 'B') setOptionB(val);
                             if (opt === 'C') setOptionC(val);
                             if (opt === 'D') setOptionD(val);
                           }}
                         />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <label className="block font-semibold text-sm text-slate-800 mb-2">3. Answer <span className="text-red-500">*</span></label>
            {previewMode ? (
               <LivePreview content={answer} diagramsText={diagrams} />
            ) : (
               <MultilineMathField
                 ref={(el: any) => mfRefs.current['Answer'] = el}
                 fieldId="Answer"
                 onFocus={handleFocus}
                 value={answer || ''}
                 onChange={(val: string) => setAnswer(val)}
               />
            )}
          </div>
          
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <label className="block font-semibold text-sm text-slate-800 mb-2">4. Explanation <span className="text-red-500">*</span></label>
            {previewMode ? (
               <LivePreview content={explanation} diagramsText={diagrams} />
            ) : (
               <MultilineMathField
                 ref={(el: any) => mfRefs.current['Explanation'] = el}
                 fieldId="Explanation"
                 onFocus={handleFocus}
                 value={explanation || ''}
                 onChange={(val: string) => setExplanation(val)}
               />
            )}
           </div>
           
           <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-semibold text-sm text-slate-800">5. Diagrams</label>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">Paste Image Here</span>
            </div>
            {previewMode ? (
               <LivePreview content={diagrams} />
            ) : (
               <textarea
                 className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-[#003fb1] focus:ring-2 focus:ring-blue-500/20 transition-all font-mono resize-y"
                 placeholder="Paste cropped image here (Cmd+V / Ctrl+V)"
                 value={diagrams || ''}
                 onChange={(e) => setDiagrams(e.target.value)}
                 onPaste={handleImagePaste}
               />
            )}
           </div>
         </div>
 
        <div className="space-y-4 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">Question Metadata (Q{currentQNo})</h3>

            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Status</label>
              <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                {status || 'Unknown'}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Exam Code</label>
              <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                {examCode || 'Unknown'}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700"
                value={subject ? subject.toLowerCase() : ''}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="" disabled>Select one</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="mathematics">Mathematics</option>
                <option value="biology">Biology</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wide">Tag/Topic <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700"
                value={tag || ''}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Thermodynamics"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
