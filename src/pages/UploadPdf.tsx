import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCw, Sparkles, UploadCloud, Trash2, Clock, Sliders, FileCheck2, Check, Terminal, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

export interface ExtractionLog {
  id: string;
  timestamp: string;
  stage: 'INIT' | 'RASTER' | 'VLM' | 'OCR-MATH' | 'JSON-PARSE' | 'DB-COMMIT' | 'COMPLETE' | 'ERROR';
  message: string;
  type: 'info' | 'vlm' | 'success' | 'warning' | 'error';
  detail?: string;
}

export function UploadPdf() {
  const navigate = useNavigate();
  const { addToast } = useUI();

  // Local component state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [pdfSubject, setPdfSubject] = useState('Select Subject');
  const [pdfExamCode, setPdfExamCode] = useState('');
  const [expectedQuestions, setExpectedQuestions] = useState('');
  const [paperName, setPaperName] = useState('');
  const [paperType, setPaperType] = useState('Select One');
  const [duration, setDuration] = useState('180');
  const [price, setPrice] = useState('0');
  const [processingMode, setProcessingMode] = useState<'standard' | 'variant'>('standard');

  // Live Extraction Logs State
  const [extractionLogs, setExtractionLogs] = useState<ExtractionLog[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback(
    (
      stage: ExtractionLog['stage'],
      message: string,
      type: ExtractionLog['type'] = 'info',
      detail?: string
    ) => {
      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setExtractionLogs(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          stage,
          message,
          type,
          detail
        }
      ]);
    },
    []
  );

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [extractionLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setActualFile(file);
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      setIsUploaded(false);
      setUploadProgress(0);
      // Pre-fill paper name from file name if empty
      if (!paperName) {
        setPaperName(file.name.replace(/\.pdf$/i, ''));
      }
      addToast('File selected! Click "Upload PDF" to proceed.', 'info');
    }
  };

  const handleUpload = async () => {
    if (!actualFile) {
      addToast('Please select a PDF file first.', 'warning');
      return;
    }
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress while uploading
    const interval = setInterval(() => {
      setUploadProgress(prev => prev < 90 ? prev + 15 : prev);
    }, 300);

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
      setUploadProgress(100);
      setIsUploaded(true);
      addToast('PDF uploaded successfully! You can now start AI Extraction.', 'success');
    } catch (err: any) {
      console.error(err);
      clearInterval(interval);
      setIsUploaded(false);
      addToast(err.message || 'Failed to upload PDF', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAIExtraction = async () => {
    if (!isUploaded) {
      addToast('Please upload the PDF before starting AI extraction.', 'warning');
      return;
    }

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

    if (!paperType || paperType === 'Select One' || paperType.trim() === '') {
      addToast('Please select a Paper Type before extracting.', 'warning');
      return;
    }

    if (!duration || duration.trim() === '' || isNaN(Number(duration)) || Number(duration) <= 0) {
      addToast('Please enter a valid Time Duration in minutes.', 'warning');
      return;
    }

    if (price === '' || price.trim() === '' || isNaN(Number(price)) || Number(price) < 0) {
      addToast('Please enter a valid Price (₹ INR).', 'warning');
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(10);
    setExtractionLogs([]);

    const startTime = Date.now();
    addLog('INIT', `Initiating AI Extraction pipeline for "${paperName.trim()}"...`, 'info', `Exam: ${pdfSubject} | Type: ${paperType} | Year & Shift: ${pdfExamCode}`);

    // Scheduled step logs during in-flight API call
    const timeouts: NodeJS.Timeout[] = [];
    timeouts.push(setTimeout(() => {
      addLog('RASTER', `Parsing and rasterizing PDF document "${uploadedFile?.name || 'document.pdf'}"...`, 'info', `Size: ${uploadedFile?.size}`);
      setExtractionProgress(20);
    }, 700));

    timeouts.push(setTimeout(() => {
      addLog('VLM', 'Connecting to Vision Language Model (VLM) for layout decomposition...', 'vlm', 'Endpoint: /api/pdf-to-json');
      setExtractionProgress(35);
    }, 2200));

    timeouts.push(setTimeout(() => {
      addLog('VLM', 'Detecting question boundaries, multi-column blocks & diagram zones...', 'vlm');
      setExtractionProgress(45);
    }, 4200));

    timeouts.push(setTimeout(() => {
      addLog('OCR-MATH', 'Deep OCR extracting LaTeX formulas, matrices, integrals & symbols...', 'info');
      setExtractionProgress(55);
    }, 6500));

    timeouts.push(setTimeout(() => {
      addLog('JSON-PARSE', 'Structuring question options, solutions, and subject taxonomy...', 'info');
      setExtractionProgress(60);
    }, 9000));

    timeouts.push(setTimeout(() => {
      addLog('VLM', 'Running mathematical verification & option consistency audit...', 'vlm');
      setExtractionProgress(65);
    }, 12000));

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
      addLog('VLM', `Calling VLM inference API with exam_code="${examCodeParam}"...`, 'vlm');
      const extractResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf-to-json?pdf_path=${encodeURIComponent(pdfPath)}&exam_code=${encodeURIComponent(examCodeParam)}&year_and_shift=${encodeURIComponent(yearAndShiftParam)}&paper_name=${encodeURIComponent(finalPaperName)}&paper_type=${encodeURIComponent(paperType)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to parse PDF to JSON');
      }

      timeouts.forEach(clearTimeout);
      setExtractionProgress(75);
      addLog('JSON-PARSE', 'VLM Extraction & LaTeX synthesis succeeded! JSON schema generated.', 'success');

      // 2. Call the appropriate upload API based on Processing Mode
      const uploadEndpoint = processingMode === 'variant'
        ? `${import.meta.env.VITE_API_URL}/api/upload-questions/${encodeURIComponent(finalPaperName)}`
        : `${import.meta.env.VITE_API_URL}/api/upload-production-questions/${encodeURIComponent(finalPaperName)}`;

      addLog('DB-COMMIT', `Staging extracted questions into question bank repository...`, 'info', `Target: ${uploadEndpoint}`);
      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload questions');
      }

      addLog('DB-COMMIT', 'Questions successfully committed into database repository!', 'success');

      // 3. Persist duration, price, and total expected questions to paper metadata
      const parsedDuration = Math.max(1, parseInt(duration, 10) || 180);
      const parsedPrice = Math.max(0, parseFloat(price) || 0);
      const parsedTotalQ = expectedQuestions && !isNaN(Number(expectedQuestions)) ? parseInt(expectedQuestions, 10) : undefined;

      addLog('DB-COMMIT', `Configuring paper metadata: Type=${paperType}, Duration=${parsedDuration} Mins, Price=₹${parsedPrice}...`, 'info');
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/update-exam-paper/${encodeURIComponent(finalPaperName)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            duration: parsedDuration,
            price: parsedPrice,
            paper_type: paperType,
            ...(parsedTotalQ ? { total_questions: parsedTotalQ } : {})
          })
        });
        addLog('DB-COMMIT', 'Paper metadata listing settings saved.', 'success');
      } catch (metaErr) {
        console.warn('Failed to update duration and price paper metadata:', metaErr);
      }

      setExtractionProgress(100);
      const totalSecs = ((Date.now() - startTime) / 1000).toFixed(1);
      addLog('COMPLETE', `AI Extraction & Ingestion finished in ${totalSecs}s! Redirecting to Storefront...`, 'success');
      addToast('AI Extraction completed successfully!', 'success');

      // Short delay before redirect so user sees the success logs
      setTimeout(() => {
        navigate('/papers');
      }, 1200);
    } catch (err: any) {
      timeouts.forEach(clearTimeout);
      console.error(err);
      addLog('ERROR', `Pipeline error: ${err.message || 'Failed to process PDF'}`, 'error');
      addToast(err.message || 'Failed to process PDF', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 flex-1 w-full h-full flex flex-col">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-bold text-2xl text-slate-900 dark:text-white tracking-tight">Upload Question Paper (PDF)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Extract mathematical formulas and structure with AI.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              navigate('/dashboard');
              addToast('Draft uploaded saved successfully', 'info');
            }}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#2d3446] transition-colors"
          >
            Save Draft
          </button>

          <button
            onClick={handleUpload}
            disabled={!actualFile || isUploading || isExtracting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-300 ${actualFile && !isUploading && !isExtracting
              ? isUploaded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
          >
            {isUploading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Uploading ({uploadProgress}%)
              </>
            ) : isUploaded ? (
              <>
                <Check className="w-4 h-4" />
                Uploaded
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload PDF
              </>
            )}
          </button>

          <button
            onClick={handleAIExtraction}
            disabled={!isUploaded || isExtracting || isUploading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-300 ${isUploaded && !isExtracting && !isUploading
              ? 'bg-[#003fb1] dark:bg-blue-600 hover:bg-[#002f85] dark:hover:bg-blue-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
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
          <div className="bg-white dark:bg-[#252b3b] border border-[#c3c5d7] dark:border-slate-700/70 rounded-xl p-6 shadow-sm transition-colors">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1">Select Paper</p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mb-6">
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
                className="border-2 border-dashed border-[#c3c5d7] dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-[#1e2330] p-8 flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-950/20 hover:border-[#003fb1] dark:hover:border-blue-500 transition-all duration-300 group"
              >
                <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-[#003fb1] dark:group-hover:text-blue-400 mb-2 transition-colors" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Drag & drop your question PDF here</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
                  or <span className="text-[#003fb1] dark:text-blue-400 font-bold underline">browse files</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4">Maximum size: 50MB</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-blue-50/30 dark:bg-blue-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-red-100 dark:bg-red-950/60 flex items-center justify-center font-bold text-red-600 dark:text-red-400 text-sm">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{uploadedFile.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#434654] dark:text-slate-400">{uploadedFile.size}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${isUploaded
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                        {isUploaded ? '✓ Uploaded to Server' : 'Selected (Ready to Upload)'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setActualFile(null);
                    setIsUploaded(false);
                    setUploadProgress(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    addToast('Removed file', 'warning');
                  }}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-400 rounded transition-colors text-slate-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Processing Steps & Real-Time Console */}
          <div className="bg-white dark:bg-[#252b3b] border border-[#c3c5d7] dark:border-slate-700/70 rounded-xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#003fb1] dark:text-blue-400" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Processing Preview</p>
              </div>
              {isExtracting && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  VLM Active
                </span>
              )}
            </div>

            {isUploading ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Uploading PDF to server...</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div className="bg-emerald-600 dark:bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : isExtracting || extractionLogs.length > 0 ? (
              <div className="space-y-3">
                {/* Progress bar header */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#003fb1] dark:text-blue-400 font-medium flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    {extractionProgress < 100 ? 'VLM Extraction & Ingestion in Progress...' : 'Extraction Pipeline Completed!'}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{extractionProgress}%</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${extractionProgress === 100 ? 'bg-emerald-500' : 'bg-[#003fb1] dark:bg-blue-500'
                      }`}
                    style={{ width: `${extractionProgress}%` }}
                  ></div>
                </div>

                {/* Dark Terminal / Console Log Box */}
                <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3.5 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">VLM Execution Stream</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{extractionLogs.length} events logged</span>
                  </div>

                  <div
                    ref={logsContainerRef}
                    className="max-h-56 min-h-[120px] overflow-y-auto space-y-2 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-700"
                  >
                    {extractionLogs.map(log => {
                      const badgeClasses =
                        log.stage === 'VLM'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                          : log.stage === 'OCR-MATH'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                            : log.stage === 'JSON-PARSE'
                              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                              : log.stage === 'DB-COMMIT'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                : log.stage === 'COMPLETE'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                  : log.stage === 'ERROR'
                                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                    : 'bg-slate-800 text-slate-300 border-slate-700';

                      const textClasses =
                        log.type === 'vlm'
                          ? 'text-purple-200'
                          : log.type === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : log.type === 'error'
                              ? 'text-rose-400 font-semibold'
                              : log.type === 'warning'
                                ? 'text-amber-300'
                                : 'text-slate-300';

                      return (
                        <div key={log.id} className="leading-snug">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${badgeClasses}`}>
                              [{log.stage}]
                            </span>
                            <span className={`text-[11px] ${textClasses}`}>{log.message}</span>
                          </div>
                          {log.detail && (
                            <div className="ml-16 pl-2 border-l border-slate-800 text-[10px] text-slate-500 mt-0.5">
                              ↳ {log.detail}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1e2330] border border-slate-100 dark:border-slate-700/60 p-4 rounded-lg text-slate-500 dark:text-slate-400">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isUploaded ? 'PDF Uploaded — Ready for AI Extraction' : 'No file processing yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400">
                    {isUploaded
                      ? 'Click "Start AI Extraction" above to parse questions and stream VLM logs.'
                      : 'Select a PDF and click "Upload PDF" to stage it for extraction.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Metadata Configuration */}
        <div className="bg-white dark:bg-[#252b3b] border border-[#c3c5d7] dark:border-slate-700/70 rounded-xl p-6 shadow-sm h-fit space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">Paper Metadata</h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Paper Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., JEE Advanced 2024 Paper 1"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Exam Code <span className="text-red-500">*</span>
            </label>
            <select
              value={pdfSubject}
              onChange={(e) => setPdfSubject(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            >
              <option className="dark:bg-[#1a1e29]">Select Code</option>
              <option className="dark:bg-[#1a1e29]">JEE</option>
              <option className="dark:bg-[#1a1e29]">NEET</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Paper Type <span className="text-red-500">*</span>
            </label>
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            >
              <option value="Select One" className="dark:bg-[#1a1e29]">Select One</option>
              <option value="Full Mock" className="dark:bg-[#1a1e29]">Full Mock</option>
              <option value="Subject Test" className="dark:bg-[#1a1e29]">Subject Test</option>
              <option value="Previous Year Paper" className="dark:bg-[#1a1e29]">Previous Year Paper</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Year And Shift / Institute <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 22 Jan 2025 shift-2 / ExamSimula"
              value={pdfExamCode}
              onChange={(e) => setPdfExamCode(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Time Duration (Mins) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g., 180"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Price (₹ INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g., 0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-7 bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
              Total Expected Questions
            </label>
            <input
              type="number"
              placeholder="e.g., 40"
              value={expectedQuestions}
              onChange={(e) => setExpectedQuestions(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1e29] border border-[#c3c5d7] dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">
              Processing Mode
            </label>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${processingMode === 'standard' ? 'border-[#003fb1] dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/40' : 'border-[#c3c5d7] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                <input
                  type="radio"
                  name="processingMode"
                  value="standard"
                  checked={processingMode === 'standard'}
                  onChange={() => setProcessingMode('standard')}
                  className="mt-0.5 text-[#003fb1] dark:text-blue-500 bg-white dark:bg-[#1a1e29] border-slate-300 dark:border-slate-600 accent-[#003fb1] dark:accent-blue-500 focus:ring-[#003fb1] dark:focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Standard Import</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Extract questions for manual review.</div>
                </div>
              </label>

              {/* AI Variant Generation Radio Button (Commented out - preserved for future use)
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${processingMode === 'variant' ? 'border-purple-600 dark:border-purple-500 bg-purple-50/30 dark:bg-purple-950/40' : 'border-[#c3c5d7] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                <input
                  type="radio"
                  name="processingMode"
                  value="variant"
                  checked={processingMode === 'variant'}
                  onChange={() => setProcessingMode('variant')}
                  className="mt-0.5 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#1a1e29] border-slate-300 dark:border-slate-600 accent-purple-600 dark:accent-purple-500 focus:ring-purple-600 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Variant Generation</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Extract questions and automatically generate new variants.</div>
                </div>
              </label>
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Pipeline Progress Indicator */}
      <div className="bg-white dark:bg-[#252b3b] border border-[#c3c5d7] dark:border-slate-700/70 rounded-xl p-6 md:p-8 shadow-sm mt-6 transition-colors">
        <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-6">Academic Processing Pipeline Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Connective background line on desktop */}
          <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-slate-100 dark:bg-slate-700 z-0" />

          {/* Stage 1 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Ingestion: Automated file parsing & layout decomposition.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#1e2330] border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:border-[#003fb1] dark:group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-[#003fb1] dark:group-hover:text-blue-400 transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">1. Ingestion</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Uploaded securely to parsing staging area</p>
          </div>

          {/* Stage 2 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Extraction: Deep OCR transforms math equations & diagrams.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#1e2330] border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:border-purple-600 dark:group-hover:border-purple-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/60 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">2. Extraction</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">AI parses structural math formulas</p>
          </div>

          {/* Stage 3 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Verification: Interactive side-by-side math review.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#1e2330] border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:border-teal-600 dark:group-hover:border-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">3. Verification</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Manual review of parsed text vs PDF</p>
          </div>

          {/* Stage 4 */}
          <div
            className="relative z-10 flex flex-col items-center text-center group cursor-help"
            onClick={() => addToast('Commit: Questions saved to global repositories.', 'info')}
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#1e2330] border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:border-[#003fb1] dark:group-hover:border-blue-500 group-hover:bg-[#003fb1] dark:group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">4. Commit</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Saves structured text to database</p>
          </div>
        </div>
      </div>
    </div>
  );
}
