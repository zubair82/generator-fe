import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Eye, Pencil, PlusCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { LivePreview } from '../components/math/LivePreview';
import { MultilineMathField } from '../components/math/MultilineMathField';
import { MathToolbar } from '../components/common/MathToolbar';

export function ManualEntry() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useUI();

  // Local state
  const initialCount = parseInt(searchParams.get('questionsCount') || '0', 10);
  const targetTotal = parseInt(searchParams.get('totalQuestions') || '0', 10);
  const initialQuestionNo = (initialCount >= targetTotal && targetTotal > 0) ? initialCount : initialCount + 1;
  const [questionsCount, setQuestionsCount] = useState(initialCount);
  const [currentQuestionNo, setCurrentQuestionNo] = useState(initialQuestionNo);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [manualSubject, setManualSubject] = useState('Mathematics');
  const [manualDifficulty, setManualSubjectDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [examCode, setExamCode] = useState(() => searchParams.get('examCode') || '');
  const [paperName, setPaperName] = useState(() => searchParams.get('paperName') || '');
  const [totalQuestions, setTotalQuestions] = useState(() => searchParams.get('totalQuestions') || '');
  const [yearAndShift, setYearAndShift] = useState(() => searchParams.get('yearAndShift') || '');
  const [isPaperLocked, setIsPaperLocked] = useState(() => !!searchParams.get('paperName'));
  
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [diagrams, setDiagrams] = useState('');

  // Mode and Math refs
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

  const handleManualAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim() && !manualTags.includes(tagInput.trim())) {
      setManualTags([...manualTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeManualTag = (tag: string) => {
    setManualTags(manualTags.filter((t) => t !== tag));
  };

  useEffect(() => {
    if (initialQuestionNo === initialCount && initialCount > 0) {
      // If we initialized to the last question because we hit the target, fetch its data
      fetchQuestion(initialQuestionNo);
    }
  }, []);

  const fetchQuestion = async (qNo: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/question-by-no?paper_name=${encodeURIComponent(paperName)}&question_no=${qNo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question) {
          const q = data.question;
          setCurrentQuestionId(q.question_id);
          setQuestionText(q.question_latex || '');
          setOptionA(q.options?.A || '');
          setOptionB(q.options?.B || '');
          setOptionC(q.options?.C || '');
          setOptionD(q.options?.D || '');
          setCorrectOption(q.options?.correct || null);
          setAnswer(q.answer || '');
          setExplanation(q.explanation || '');
          setDiagrams(q.diagrams && q.diagrams.length > 0 ? q.diagrams[0] : '');
          setManualSubjectDifficulty(q.difficulty || 'Medium');
          setManualSubject(q.subject || 'Mathematics');
          setManualTags(q.tag ? q.tag.split(',').map((t: string) => t.trim()) : []);
          setEstimatedTime(q.estimated_time_seconds ? q.estimated_time_seconds.toString() : '');
        }
      } else {
        addToast(`Failed to load question ${qNo}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching question', 'error');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionNo > 1) {
      const newNo = currentQuestionNo - 1;
      setCurrentQuestionNo(newNo);
      fetchQuestion(newNo);
    }
  };

  const handleNext = () => {
    const totalQ = parseInt(totalQuestions, 10);
    if (currentQuestionNo < totalQ && currentQuestionNo <= questionsCount) {
      const newNo = currentQuestionNo + 1;
      setCurrentQuestionNo(newNo);
      if (newNo > questionsCount) {
        setCurrentQuestionId(null);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption(null);
        setAnswer('');
        setExplanation('');
        setDiagrams('');
      } else {
        fetchQuestion(newNo);
      }
    }
  };

  const handleAddQuestion = async () => {
    if (!examCode || !paperName || !totalQuestions || !yearAndShift || !manualSubject) {
      addToast('Please fill in all mandatory Question Parameters', 'error');
      return;
    }

    if (!isPaperLocked) {
      try {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/add-exam-paper`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            exam_code: examCode,
            paper_name: paperName,
            state: 'MANUALLY-CREATED',
            year_and_shift: yearAndShift,
            type: 'Manually-Uploaded',
            total_questions: parseInt(totalQuestions, 10)
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400 && errorData.detail && errorData.detail.includes('already exists')) {
            // Paper already exists, which is fine for subsequent additions
          } else {
            addToast(`Error creating paper: ${errorData.detail || 'Unknown error'}`, 'error');
            return;
          }
        }
        
        setIsPaperLocked(true);
      } catch (err) {
        console.error("Failed to create exam paper:", err);
        addToast('Failed to connect to the server', 'error');
        return;
      }
    }

    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const questionPayload = {
        exam_code: examCode,
        paper_name: paperName,
        state: 'Manually-Created',
        type: 'Manually-Uploaded',
        question_no: questionsCount + 1,
        year_and_shift: yearAndShift,
        question_latex: questionText,
        question_type: 'single_choice',
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
          correct: correctOption
        },
        diagrams: diagrams ? [diagrams] : [],
        difficulty: manualDifficulty,
        answer: answer || correctOption || '',
        explanation: explanation,
        subject: manualSubject,
        tag: Array.from(new Set([...manualTags, tagInput.trim()].filter(Boolean))).join(', '),
        estimated_time_seconds: estimatedTime ? parseInt(estimatedTime, 10) : null
      };

      const qResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/create-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify(questionPayload)
      });

      if (!qResponse.ok) {
        const errorData = await qResponse.json();
        addToast(`Error saving question: ${errorData.detail || 'Unknown error'}`, 'error');
        return;
      }
      
      const qData = await qResponse.json();
      const createdQuestionId = qData.question_id;

      const newCount = questionsCount + 1;
      setQuestionsCount(newCount);
      const targetCount = parseInt(totalQuestions || '0', 10);

      if (newCount === targetCount) {
        setCurrentQuestionId(createdQuestionId);
        addToast('Question saved! Target reached. You can now finalize the paper.', 'success');
      } else {
        setCurrentQuestionNo(newCount + 1);
        setCurrentQuestionId(null);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption(null);
        setAnswer('');
        setExplanation('');
        setDiagrams('');
        setEstimatedTime('');
        setTagInput('');
        setManualTags([]);
        addToast('Question saved & added successfully!', 'success');
      }
    } catch (err) {
      console.error("Failed to create question:", err);
      addToast('Failed to connect to the server to save question', 'error');
      return;
    }
  };

  const handleUpdateQuestion = async () => {
    if (!currentQuestionId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const questionPayload = {
        question_latex: questionText,
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
          correct: correctOption
        },
        diagrams: diagrams ? [diagrams] : [],
        difficulty: manualDifficulty,
        answer: answer || correctOption || '',
        explanation: explanation,
        subject: manualSubject,
        tag: Array.from(new Set([...manualTags, tagInput.trim()].filter(Boolean))).join(', '),
        estimated_time_seconds: estimatedTime ? parseInt(estimatedTime, 10) : null
      };

      const qResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/update-question/${currentQuestionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(questionPayload)
      });

      if (!qResponse.ok) {
        const errorData = await qResponse.json();
        addToast(`Error updating question: ${errorData.detail || 'Unknown error'}`, 'error');
        return;
      }
      
      // Update local state if a new tag was added via input without clicking Add
      if (tagInput.trim()) {
        setManualTags(prev => Array.from(new Set([...prev, tagInput.trim()])));
        setTagInput('');
      }
      
      addToast('Question updated successfully!', 'success');
    } catch (err) {
      console.error("Failed to update question:", err);
      addToast('Failed to connect to the server to update question', 'error');
    }
  };

  const handleUpdateTotalQuestions = async () => {
    if (!totalQuestions) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/update-exam-paper/${encodeURIComponent(paperName)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ total_questions: parseInt(totalQuestions, 10) })
      });
      
      if (response.ok) {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('totalQuestions', totalQuestions);
        setSearchParams(newSearchParams, { replace: true });
      }
    } catch (err) {
      console.error("Failed to update total questions:", err);
    }
  };

  const handleFinalizePaper = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/move-to-production/${encodeURIComponent(paperName)}?type=Manually-Uploaded`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          addToast('Question paper finalized and moved to Review!', 'success');
          navigate('/papers');
        } else {
          addToast(data.message || 'Failed to finalize question paper', 'error');
        }
      } else {
        addToast('Failed to finalize question paper. Server error.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error finalizing question paper.', 'error');
    }
  };

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
            <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">Manual Question Entry</h2>
            <p className="text-xs text-slate-500">Compile exam questions by adding text, LaTeX, options and tagging metadata.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFinalizePaper}
            disabled={!totalQuestions || questionsCount < parseInt(totalQuestions, 10)}
            className="px-5 py-2 bg-[#003fb1] text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Finalize Question Paper
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Entry Content</h3>
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

        {/* Right Side Metadata Configuration */}
        <div className="space-y-4 lg:h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">Question Parameters (Q{String(currentQuestionNo).padStart(2, '0')})</h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="e.g. JEE-MAIN-2026"
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                required
                disabled={isPaperLocked}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Paper Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                placeholder="e.g. JEE_MAIN_2026_Shift_1"
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                required
                disabled={isPaperLocked}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Questions <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                onBlur={handleUpdateTotalQuestions}
                placeholder="e.g. 75"
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Year & Shift / Institute <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={yearAndShift}
                onChange={(e) => setYearAndShift(e.target.value)}
                placeholder="e.g. 2026 Shift 1"
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                required
                disabled={isPaperLocked}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Core <span className="text-red-500">*</span></label>
              <select
                value={manualSubject ? manualSubject.toLowerCase() : ''}
                onChange={(e) => setManualSubject(e.target.value)}
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
              >
                <option value="mathematics">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
                <option value="computer science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cognitive Difficulty <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setManualSubjectDifficulty(diff as any);
                    }}
                    className={`flex-1 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                      manualDifficulty === diff
                        ? 'bg-blue-50 border-[#003fb1] text-[#003fb1] shadow-sm'
                        : 'bg-white border-[#c3c5d7] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Time (Seconds)</label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 120"
                className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tags / Topics Map <span className="text-red-500">*</span>
              </label>
              <form onSubmit={handleManualAddTag} className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Calculus"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 bg-white border border-[#c3c5d7] rounded-lg p-2 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
                />
                <button
                  type="submit"
                  className="px-3 bg-slate-100 text-slate-600 border border-[#c3c5d7] rounded-lg hover:bg-slate-200 text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {manualTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md"
                  >
                    {tag}
                    <button onClick={() => removeManualTag(tag)} className="hover:text-slate-900 transition-colors">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between gap-3 w-full overflow-hidden">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionNo === 1}
            className="shrink-0 px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentQuestionId ? (
            <button
              onClick={handleUpdateQuestion}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-[#003fb1] text-white hover:bg-blue-800 font-semibold rounded-lg transition-colors shadow-sm truncate"
            >
              Update (Q{String(currentQuestionNo).padStart(2, '0')})
            </button>
          ) : (
            <button
              onClick={handleAddQuestion}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-white border border-dashed border-[#003fb1] text-[#003fb1] hover:bg-blue-50 font-semibold rounded-lg transition-colors truncate"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Add to Bank (Q{String(currentQuestionNo).padStart(2, '0')})</span>
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentQuestionNo === parseInt(totalQuestions || '0', 10) || currentQuestionNo === questionsCount + 1}
            className="shrink-0 px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
