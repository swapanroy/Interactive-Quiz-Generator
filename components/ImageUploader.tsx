import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { Camera, Upload, X, BookOpen, AlertCircle, BarChart } from 'lucide-react';

interface ImageUploaderProps {
  onGenerate: (images: ImageFile[], difficulty: 'easy' | 'medium' | 'hard') => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onGenerate, isLoading }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const newImages: ImageFile[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push({
            id: Math.random().toString(36).substring(7),
            data: e.target.result as string,
            mimeType: file.type
          });
        }
        processedCount++;
        if (processedCount === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleAnalyze = () => {
    if (images.length === 0) {
      setError("Please add at least one image.");
      return;
    }
    onGenerate(images, difficulty);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <BookOpen size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">SnapQuiz AI</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Take photos of your textbook or notes. AI will instantly create a study quiz to test your knowledge.
        </p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
          images.length > 0 ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-white'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-all"
            >
              <Upload size={20} />
              Upload Pages
            </button>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => processFiles(e.target.files)}
            />
          </div>
          <p className="text-sm text-slate-400">or drag and drop images here</p>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <img src={img.data} alt="Upload preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Difficulty Selector */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
          <BarChart size={18} className="text-indigo-600" />
          Quiz Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-200/50 p-1 rounded-lg">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`py-2 rounded-md text-sm font-semibold capitalize transition-all duration-200 ${
                difficulty === level
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={images.length === 0 || isLoading}
        className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] ${
          images.length === 0 || isLoading
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Quiz...
          </span>
        ) : (
          `Generate Quiz (${images.length} pages)`
        )}
      </button>
    </div>
  );
};

export default ImageUploader;