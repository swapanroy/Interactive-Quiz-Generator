import React, { useState } from 'react';
import { QuizData, UserAnswer } from '../types';
import { CheckCircle, XCircle, ChevronRight, HelpCircle } from 'lucide-react';

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
    if (showFeedback) return; // Prevent changing after submitting
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-500">Question {currentIndex + 1} of {quizData.questions.length}</span>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {currentQuestion.relatedConcept}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let itemClass = "w-full p-4 rounded-xl text-left border-2 transition-all duration-200 flex justify-between items-center ";
            
            if (showFeedback) {
              if (idx === currentQuestion.correctOptionIndex) {
                itemClass += "border-green-500 bg-green-50 text-green-900";
              } else if (idx === selectedOption) {
                itemClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                itemClass += "border-slate-100 text-slate-400 opacity-60";
              }
            } else {
              if (selectedOption === idx) {
                itemClass += "border-indigo-600 bg-indigo-50 text-indigo-900 font-medium";
              } else {
                itemClass += "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={showFeedback}
                className={itemClass}
              >
                <span>{option}</span>
                {showFeedback && idx === currentQuestion.correctOptionIndex && (
                  <CheckCircle size={20} className="text-green-600" />
                )}
                {showFeedback && idx === selectedOption && idx !== currentQuestion.correctOptionIndex && (
                  <XCircle size={20} className="text-red-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
            <div className="flex gap-3 text-slate-700">
              <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1 text-slate-900">Explanation</span>
                <p className="text-sm leading-relaxed text-slate-600">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        {!showFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              selectedOption === null
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
          >
            {currentIndex === quizData.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
