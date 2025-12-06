import React, { useRef, useState } from 'react';
import { MediaFile } from '../types';
import { loadPdfDocument, renderPageAsImage, findMostRelevantPages, PDFDocumentProxy } from '../services/pdfService';
import { Upload, X, BookOpen, AlertCircle, BarChart2, FileText, Search, Layers, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onGenerate: (files: MediaFile[], difficulty: 'easy' | 'medium' | 'hard') => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onGenerate, isLoading }) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);
  
  // PDF Handling State
  const [activePdf, setActivePdf] = useState<{ file: File, doc: PDFDocumentProxy } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [pdfMode, setPdfMode] = useState<'topic' | 'range'>('topic');
  const [pdfTopic, setPdfTopic] = useState('');
  const [pageRange, setPageRange] = useState({ start: 1, end: 5 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);

    const pdfFile = Array.from(fileList).find(f => f.type === 'application/pdf');
    if (pdfFile) {
      handlePdfUpload(pdfFile);
      return;
    }

    const newFiles: MediaFile[] = [];
    let processedCount = 0;

    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newFiles.push({
            id: Math.random().toString(36).substring(7),
            data: e.target.result as string,
            mimeType: file.type
          });
        }
        processedCount++;
        if (processedCount === fileList.length) {
          setFiles(prev => [...prev, ...newFiles]);
          setActivePdf(null); 
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePdfUpload = async (file: File) => {
    try {
      setProcessingStatus('Loading PDF document...');
      const doc = await loadPdfDocument(file);
      setActivePdf({ file, doc });
      setFiles([]); 
      setPageRange({ start: 1, end: Math.min(10, doc.numPages) });
      setProcessingStatus('');
    } catch (err) {
      console.error(err);
      setError("Failed to load PDF. Please try a valid file.");
      setProcessingStatus('');
    }
  };

  const generateFromPdf = async () => {
    if (!activePdf) return;
    setProcessingStatus('Analyzing document...');
    
    try {
      let targetPages: number[] = [];

      if (pdfMode === 'range') {
        const start = Math.max(1, Math.min(pageRange.start, activePdf.doc.numPages));
        const end = Math.min(activePdf.doc.numPages, Math.max(start, pageRange.end));
        
        if (end - start > 20) {
          setError("Please select a range of 20 pages or fewer.");
          setProcessingStatus('');
          return;
        }
        for (let i = start; i <= end; i++) targetPages.push(i);
      } else {
        if (!pdfTopic.trim()) {
           setError("Please enter a topic to search for.");
           setProcessingStatus('');
           return;
        }
        setProcessingStatus(`Scanning for "${pdfTopic}"...`);
        targetPages = await findMostRelevantPages(activePdf.doc, pdfTopic);
        
        if (targetPages.length === 0) {
          targetPages = [1, 2, 3, 4, 5].filter(p => p <= activePdf.doc.numPages);
          setError(`No strong matches found. Using first ${targetPages.length} pages.`);
        }
      }

      setProcessingStatus(`Extracting ${targetPages.length} pages...`);
      
      const extractedFiles: MediaFile[] = [];
      for (const pageNum of targetPages) {
        const imageData = await renderPageAsImage(activePdf.doc, pageNum);
        extractedFiles.push({
          id: `pdf-page-${pageNum}`,
          data: imageData,
          mimeType: 'image/jpeg'
        });
      }

      onGenerate(extractedFiles, difficulty);
      setProcessingStatus('');

    } catch (err) {
      console.error(err);
      setError("Failed to process PDF pages.");
      setProcessingStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAnalyze = () => {
    if (activePdf) {
      generateFromPdf();
    } else {
      if (files.length === 0) {
        setError("Please add at least one image or PDF document.");
        return;
      }
      onGenerate(files, difficulty);
    }
  };

  const isBusy = isLoading || !!processingStatus;

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Turn your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">reading</span><br/>
          into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">mastery</span>.
        </h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
          Upload textbook pages or full PDFs. We'll intelligently scan them and quiz you on what matters.
        </p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-1 shadow-2xl shadow-indigo-100/50">
        <div className="bg-white rounded-[20px] p-6 md:p-8 space-y-8">
          
          {/* Upload Area */}
          {!activePdf && (
            <div 
              className={`relative group border-2 border-dashed rounded-2xl p-10 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden ${
                files.length > 0 ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex flex-col items-center justify-center text-center space-y-4">
                <div className={`p-4 rounded-full transition-transform group-hover:scale-110 duration-300 ${files.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  {files.length > 0 ? <ImageIcon size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {files.length > 0 ? `${files.length} images selected` : "Click to upload or drag & drop"}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Images or PDF (up to 1000 pages)</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => processFiles(e.target.files)}
                />
              </div>
            </div>
          )}

          {/* PDF Intelligent Config UI */}
          {activePdf && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-fade-in-up">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{activePdf.file.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{activePdf.doc.numPages} pages found</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActivePdf(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex mb-6">
                <button
                  onClick={() => setPdfMode('topic')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    pdfMode === 'topic' 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Search size={16} />
                  Smart Topic Search
                </button>
                <button
                  onClick={() => setPdfMode('range')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    pdfMode === 'range' 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={16} />
                  Page Range
                </button>
              </div>

              {pdfMode === 'topic' ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 block">
                    What topic are you studying?
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="text"
                      value={pdfTopic}
                      onChange={(e) => {
                        setPdfTopic(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="e.g. Thermodynamics, Chapter 3, The Cold War..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    AI will auto-select the best pages for your quiz.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 block">
                    Select Pages (Max 20)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 ring-indigo-500">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">Start</span>
                      <input 
                        type="number" 
                        min={1} 
                        max={activePdf.doc.numPages}
                        value={pageRange.start}
                        onChange={(e) => setPageRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                        className="w-full px-1 py-1 text-lg font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <span className="text-slate-300 font-bold text-xl">→</span>
                    <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 ring-indigo-500">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">End</span>
                      <input 
                        type="number" 
                        min={pageRange.start}
                        max={activePdf.doc.numPages}
                        value={pageRange.end}
                        onChange={(e) => setPageRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1 }))}
                        className="w-full px-1 py-1 text-lg font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Preview Grid */}
          {!activePdf && files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {files.map((file) => (
                <div key={file.id} className="relative group aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-md transition-all">
                  <img src={file.data} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 p-1 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm transform scale-90 hover:scale-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls Section */}
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-600" />
                Select Difficulty
              </label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all duration-300 ${
                      difficulty === level
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50/50 border border-red-100 p-4 rounded-xl text-sm font-medium animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={(!activePdf && files.length === 0) || isBusy}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-indigo-200/50 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:transform-none disabled:shadow-none ${
                (!activePdf && files.length === 0) || isBusy
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
              }`}
            >
              {isBusy ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  {processingStatus || "Generating Quiz..."}
                </span>
              ) : (
                `Start Quiz`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;