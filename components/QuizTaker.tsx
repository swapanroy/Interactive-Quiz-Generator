import React, { useState } from 'react';
import { QuizData, UserAnswer } from '../types';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, Activity } from 'lucide-react';

interface QuizTakerProps {
  quizData: QuizData;
  onComplete: (answers: UserAnswer[]) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quizData, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);

  const currentQuestion = quizData.questions[currentIndex];
  const progress = ((currentIndex) / quizData.questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: selectedOption,
      isCorrect
    };

    setAnswers([...answers, newAnswer]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      onComplete(answers);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3 px-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question {currentIndex + 1} of {quizData.questions.length}</span>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-indigo-900">
                {currentQuestion.relatedConcept}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden relative">
        <div className="p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let containerClass = "relative w-full p-5 rounded-2xl text-left border-2 transition-all duration-200 group ";
              
              if (showFeedback) {
                if (idx === currentQuestion.correctOptionIndex) {
                  containerClass += "border-green-500 bg-green-50 text-green-900 shadow-md";
                } else if (idx === selectedOption) {
                  containerClass += "border-red-500 bg-red-50 text-red-900 shadow-sm";
                } else {
                  containerClass += "border-slate-100 text-slate-400 opacity-60 grayscale";
                }
              } else {
                if (selectedOption === idx) {
                  containerClass += "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md ring-1 ring-indigo-200 transform scale-[1.01]";
                } else {
                  containerClass += "border-slate-100 hover:border-indigo-300 hover:bg-slate-50 text-slate-700 hover:shadow-sm";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={showFeedback}
                  className={containerClass}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{option}</span>
                    {showFeedback && idx === currentQuestion.correctOptionIndex && (
                      <CheckCircle2 size={24} className="text-green-600 shrink-0" />
                    )}
                    {showFeedback && idx === selectedOption && idx !== currentQuestion.correctOptionIndex && (
                      <XCircle size={24} className="text-red-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Section */}
          {showFeedback && (
            <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-fade-in">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-amber-500">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Why is this correct?</span>
                  <p className="text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 md:px-10 bg-slate-50 border-t border-slate-100 flex justify-end">
          {!showFeedback ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg transition-all transform ${
                selectedOption === null
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-lg shadow-indigo-200'
              }`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1"
            >
              {currentIndex === quizData.questions.length - 1 ? 'See Results' : 'Next Question'}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;