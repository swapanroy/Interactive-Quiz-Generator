import React, { useState } from 'react';
import { AppState, ImageFile, QuizData, UserAnswer } from './types';
import ImageUploader from './components/ImageUploader';
import QuizTaker from './components/QuizTaker';
import ResultsView from './components/ResultsView';
import { generateQuizFromImages } from './services/geminiService';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateQuiz = async (images: ImageFile[], difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      setIsLoading(true);
      const data = await generateQuizFromImages(images, difficulty);
      setQuizData(data);
      setAppState(AppState.QUIZ);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("Failed to analyze images. Please try again with clearer images.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl cursor-pointer" onClick={() => appState !== AppState.PROCESSING && handleReset()}>
            <Sparkles className="w-6 h-6" />
            <span>SnapQuiz AI</span>
          </div>
          {appState !== AppState.UPLOAD && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="animate-fade-in-up">
          {appState === AppState.UPLOAD && (
            <ImageUploader 
              onGenerate={handleGenerateQuiz} 
              isLoading={isLoading} 
            />
          )}

          {appState === AppState.QUIZ && quizData && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{quizData.title}</h1>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {quizData.identifiedConcepts.map((concept, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      {concept}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100 capitalize">
                    Difficulty: {quizData.questions.length > 0 ? 'Adaptive' : 'Custom'}
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
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>Powered by Gemini 2.5 Flash</p>
      </footer>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;