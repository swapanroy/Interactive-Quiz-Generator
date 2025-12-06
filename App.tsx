import React, { useState } from 'react';
import { AppState, MediaFile, QuizData, UserAnswer } from './types';
import ImageUploader from './components/ImageUploader';
import QuizTaker from './components/QuizTaker';
import ResultsView from './components/ResultsView';
import { generateQuizFromMedia } from './services/geminiService';
import { Sparkles, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateQuiz = async (files: MediaFile[], difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      setIsLoading(true);
      const data = await generateQuizFromMedia(files, difficulty);
      setQuizData(data);
      setAppState(AppState.QUIZ);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("Failed to analyze content. Please try again with clearer files.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (answers: UserAnswer[]) => {
    setUserAnswers(answers);
    setAppState(AppState.RESULTS);
  };

  const handleReset = () => {
    setQuizData(null);
    setUserAnswers([]);
    setAppState(AppState.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden text-slate-900 font-sans">
      {/* Ambient Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full blur-[120px]" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => appState !== AppState.PROCESSING && handleReset()}
          >
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Quiz Me
            </span>
          </div>
          {appState !== AppState.UPLOAD && (
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/50 hover:bg-white hover:text-indigo-600 rounded-full border border-slate-200/50 hover:border-indigo-100 transition-all shadow-sm hover:shadow"
            >
              Start Over
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="animate-fade-in-up">
          {appState === AppState.UPLOAD && (
            <ImageUploader 
              onGenerate={handleGenerateQuiz} 
              isLoading={isLoading} 
            />
          )}

          {appState === AppState.QUIZ && quizData && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {quizData.title}
                </h1>
                <div className="flex flex-wrap justify-center gap-2">
                  {quizData.identifiedConcepts.map((concept, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-600 text-xs font-semibold rounded-full shadow-sm">
                      {concept}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                    {quizData.questions.length} Questions
                  </span>
                </div>
              </div>
              <QuizTaker 
                quizData={quizData} 
                onComplete={handleQuizComplete} 
              />
            </div>
          )}

          {appState === AppState.RESULTS && quizData && (
            <ResultsView 
              quizData={quizData} 
              userAnswers={userAnswers} 
              onReset={handleReset} 
            />
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm font-medium relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={14} className="text-indigo-400" />
          <p>Powered by Gemini 2.5 Flash</p>
        </div>
        <p className="opacity-60">&copy; {new Date().getFullYear()} Quiz Me</p>
      </footer>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;