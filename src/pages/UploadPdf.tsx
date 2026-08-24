import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCw, Sparkles, UploadCloud, Trash2, Clock, Sliders, FileCheck2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

export function UploadPdf() {
  const navigate = useNavigate();
  const { addToast } = useUI();

  // Local component state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [pdfSubject, setPdfSubject] = useState('Select Subject');
  const [pdfExamCode, setPdfExamCode] = useState('');
  const [expectedQuestions, setExpectedQuestions] = useState('');
  const [paperName, setPaperName] = useState('');
  const [processingMode, setProcessingMode] = useState<'standard' | 'variant'>('standard');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setActualFile(file);
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      // Pre-fill paper name from file name if empty
      if (!paperName) {
        setPaperName(file.name.replace(/\.pdf$/i, ''));
      }
      addToast('File selected successfully!', 'success');
    }
  };

  const handleUpload = async () => {
    if (!actualFile) {
      addToast('Please select or upload a PDF first.', 'warning');
      return;
    }
    setIsExtracting(true);
    setExtractionProgress(10);
    
    // Simulate progress while uploading
    const interval = setInterval(() => {
      setExtractionProgress(prev => prev < 90 ? prev + 5 : prev);
    }, 500);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', actualFile);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      clearInterval(interval);
      setExtractionProgress(100);
      addToast('PDF Uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      addToast('Failed to upload PDF', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAIExtraction = async () => {
    if (!pdfSubject || pdfSubject === 'Select Code' || pdfSubject === 'Select Subject') {
      addToast('Please select an Exam Code before extracting.', 'warning');
      return;
    }
    
    if (!pdfExamCode || pdfExamCode.trim() === '') {
      addToast('Please enter the Year And Shift / Institute before extracting.', 'warning');
      return;
    }
    
    if (!paperName || paperName.trim() === '') {
      addToast('Please enter a Paper Name before extracting.', 'warning');
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(10);
    
    const interval = setInterval(() => {
      setExtractionProgress(prev => prev < 90 ? prev + 5 : prev);
    }, 500);

    try {
      const token = localStorage.getItem('auth_token');
      
      // The path comes from .env variables
      const basePath = import.meta.env.VITE_PDF_FILE_PATH;
      if (!basePath) {
        throw new Error('VITE_PDF_FILE_PATH is not set in environment variables');
      }
      
      if (!uploadedFile) {
        throw new Error('No file selected.');
      }

      // Combine base path with the uploaded file name
      const pdfPath = `${basePath.replace(/\/$/, '')}/${uploadedFile.name}`;
      
      const finalPaperName = paperName.trim();
      
      // Map UI state to API parameters based on updated form labels
      const examCodeParam = (pdfSubject && pdfSubject !== 'Select Code') ? pdfSubject : 'DEFAULT_CODE';
      const yearAndShiftParam = pdfExamCode || 'Unknown';

      // 1. Call pdf-to-json API
      const extractResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf-to-json?pdf_path=${encodeURIComponent(pdfPath)}&exam_code=${encodeURIComponent(examCodeParam)}&year_and_shift=${encodeURIComponent(yearAndShiftParam)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!extractResponse.ok) {
        throw new Error('Failed to parse PDF to JSON');
      }

      setExtractionProgress(60);

      // 2. Call the appropriate upload API based on Processing Mode
      const uploadEndpoint = processingMode === 'variant' 
        ? `${import.meta.env.VITE_API_URL}/api/upload-questions/${encodeURIComponent(finalPaperName)}`
        : `${import.meta.env.VITE_API_URL}/api/upload-production-questions/${encodeURIComponent(finalPaperName)}`;

      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload questions');
      }
      
      clearInterval(interval);
      setExtractionProgress(100);
      addToast('AI Extraction completed successfully!', 'success');
      
      if (processingMode === 'variant') {
        navigate(`/variant_gen?paper=${encodeURIComponent(finalPaperName)}&state=PENDING`);
      }
    } catch (err: any) {
      console.error(err);
      clearInterval(interval);
      addToast(err.message || 'Failed to process PDF', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 flex-1 w-full h-full flex flex-col">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">Upload Question Paper (PDF)</h2>
            <p className="text-xs text-slate-500">Extract mathematical formulas and structure with AI.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              navigate('/dashboard');
              addToast('Draft uploaded saved successfully', 'info');
            }}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Save Draft
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!uploadedFile || isExtracting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-300 ${
              uploadedFile && !isExtracting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF
          </button>
          
          <button
            onClick={handleAIExtraction}
            disabled={!uploadedFile || isExtracting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-300 ${
              uploadedFile && !isExtracting
                ? 'bg-[#003fb1] hover:bg-[#002f85] text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isExtracting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Extracting ({extractionProgress}%)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start AI Extraction
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main form grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Upload Container (Spans 2 columns on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <p className="font-semibold text-sm text-slate-800 mb-1">Select Paper</p>
            <p className="text-xs text-slate-400 mb-6">
              Ensure the PDF is clear and legible for optimal OCR parsing of sub-scripts and graphs.
            </p>

            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            {/* Interactive Drop Box */}
            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#c3c5d7] rounded-lg bg-slate-50/50 p-8 flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-blue-50/20 hover:border-[#003fb1] transition-all duration-300 group"
              >
                <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-[#003fb1] mb-2 transition-colors" />
                <p className="font-semibold text-sm text-slate-700">Drag & drop your question PDF here</p>
                <p className="text-xs text-slate-400 mt-1">
                  or <span className="text-[#003fb1] font-bold underline">browse files</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-4">Maximum size: 50MB</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg p-6 bg-blue-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center font-bold text-red-600 text-sm">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{uploadedFile.name}</p>
                    <p className="text-xs text-[#434654]">{uploadedFile.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setActualFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    addToast('Removed file', 'warning');
                  }}
                  className="p-1 hover:bg-rose-100 hover:text-rose-700 rounded transition-colors text-slate-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Simulated Processing Steps */}
          <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm">
            <p className="font-semibold text-sm text-slate-800 mb-4">Processing Preview</p>

            {isExtracting ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#003fb1] font-medium">Decomposing page layout & OCR indexing...</span>
                  <span className="font-semibold text-slate-700">{extractionProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-[#003fb1] h-1.5 rounded-full" style={{ width: `${extractionProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-lg text-slate-500">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold">No file processing yet</p>
                  <p className="text-[11px] text-slate-400">Trigger AI Extraction to view live progress preview logs.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Metadata Configuration */}
        <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">Paper Metadata</h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Paper Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., JEE Advanced 2024 Paper 1"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Exam Code <span className="text-red-500">*</span>
            </label>
            <select
              value={pdfSubject}
              onChange={(e) => setPdfSubject(e.target.value)}
              className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
            >
              <option>Select Code</option>
              <option>JEE</option>
              <option>NEET</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Year And Shift / Institute <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 22 Jan 2025 shift-2 / ExamSimula"
              value={pdfExamCode}
              onChange={(e) => setPdfExamCode(e.target.value)}
              className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
            />
          </div>



          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Total Expected Questions
            </label>
            <input
              type="number"
              placeholder="e.g., 40"
              value={expectedQuestions}
              onChange={(e) => setExpectedQuestions(e.target.value)}
              className="w-full bg-white border border-[#c3c5d7] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Processing Mode
            </label>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${processingMode === 'standard' ? 'border-[#003fb1] bg-blue-50/30' : 'border-[#c3c5d7] hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="processingMode"
                  value="standard"
                  checked={processingMode === 'standard'}
                  onChange={() => setProcessingMode('standard')}
                  className="mt-0.5 text-[#003fb1] focus:ring-[#003fb1]"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Standard Import</div>
                  <div className="text-xs text-slate-500 mt-0.5">Extract questions for manual review.</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${processingMode === 'variant' ? 'border-purple-600 bg-purple-50/30' : 'border-[#c3c5d7] hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="processingMode"
                  value="variant"
                  checked={processingMode === 'variant'}
                  onChange={() => setProcessingMode('variant')}
                  className="mt-0.5 text-purple-600 focus:ring-purple-600"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800">AI Variant Generation</div>
                  <div className="text-xs text-slate-500 mt-0.5">Extract questions and automatically generate new variants.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Pipeline Progress Indicator */}
      <div className="bg-white border border-[#c3c5d7] rounded-xl p-6 md:p-8 shadow-sm mt-6">
        <h3 className="font-semibold text-base text-slate-900 mb-6">Academic Processing Pipeline Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Connective background line on desktop */}
          <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-slate-100 z-0" />

          {/* Stage 1 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Ingestion: Automated file parsing & layout decomposition.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-600 flex items-center justify-center mb-2 group-hover:border-[#003fb1] group-hover:bg-blue-50 group-hover:text-[#003fb1] transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Ingestion</h4>
            <p className="text-[11px] text-slate-400 mt-1">Uploaded securely to parsing staging area</p>
          </div>

          {/* Stage 2 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Extraction: Deep OCR transforms math equations & diagrams.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-600 flex items-center justify-center mb-2 group-hover:border-purple-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">2. Extraction</h4>
            <p className="text-[11px] text-slate-400 mt-1">AI parses structural math formulas</p>
          </div>

          {/* Stage 3 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Verification: Interactive side-by-side math review.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-600 flex items-center justify-center mb-2 group-hover:border-teal-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">3. Verification</h4>
            <p className="text-[11px] text-slate-400 mt-1">Manual review of parsed text vs PDF</p>
          </div>

          {/* Stage 4 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Commit: Questions saved to global repositories.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-600 flex items-center justify-center mb-2 group-hover:border-[#003fb1] group-hover:bg-[#003fb1] group-hover:text-white transition-all">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">4. Commit</h4>
            <p className="text-[11px] text-slate-400 mt-1">Saves structured text to database</p>
          </div>
        </div>
      </div>
    </div>
  );
}
