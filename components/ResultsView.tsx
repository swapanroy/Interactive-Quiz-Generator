import React from 'react';
import { QuizData, UserAnswer } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RefreshCcw, BookOpen, Target, CheckCircle2 } from 'lucide-react';

interface ResultsViewProps {
  quizData: QuizData;
  userAnswers: UserAnswer[];
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quizData, userAnswers, onReset }) => {
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const score = Math.round((correctCount / userAnswers.length) * 100);
  
  const weakConcepts = userAnswers
    .filter(a => !a.isCorrect)
    .map(a => {
      const q = quizData.questions.find(q => q.id === a.questionId);
      return q ? q.relatedConcept : null;
    })
    .filter(Boolean) as string[];

  const uniqueWeakConcepts = Array.from(new Set(weakConcepts));

  const chartData = [
    { name: 'Correct', value: correctCount },
    { name: 'Incorrect', value: userAnswers.length - correctCount },
  ];
  
  const COLORS = ['#6366f1', '#e2e8f0']; 

  let feedbackTitle = "";
  let feedbackMessage = "";
  if (score === 100) {
    feedbackTitle = "Perfect Score!";
    feedbackMessage = "You've mastered this material completely.";
  } else if (score >= 80) {
    feedbackTitle = "Excellent Work!";
    feedbackMessage = "You have a strong grasp of these concepts.";
  } else if (score >= 60) {
    feedbackTitle = "Good Effort";
    feedbackMessage = "You're getting there, but a little review would help.";
  } else {
    feedbackTitle = "Keep Practicing";
    feedbackMessage = "Don't give up! Review the material and try again.";
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Score Card */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center">
          
          <div className="relative w-56 h-56 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  cornerRadius={10}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-violet-600 tracking-tighter">{score}%</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">{feedbackTitle}</h2>
          <p className="text-slate-500 max-w-sm">{feedbackMessage}</p>

          <div className="grid grid-cols-2 gap-8 mt-10 w-full max-w-sm">
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">Total</span>
              <span className="text-2xl font-black text-slate-900">{userAnswers.length}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-50 rounded-2xl border border-green-100">
              <span className="text-sm font-bold text-green-600 uppercase tracking-wide mb-1">Correct</span>
              <span className="text-2xl font-black text-green-700">{correctCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      {uniqueWeakConcepts.length > 0 && (
        <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-lg shadow-slate-100/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Focus Areas</h3>
              <p className="text-slate-600 mb-4 text-sm">Based on your results, spend a little more time reviewing:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueWeakConcepts.map(concept => (
                  <span key={concept} className="px-4 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold border border-orange-100">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-50 rounded-[24px] p-8 border border-slate-200/60">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="text-indigo-600" size={20} />
          <h3 className="font-bold text-slate-900">Topic Summary</h3>
        </div>
        <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-4 py-1">
          "{quizData.summary}"
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1"
      >
        <RefreshCcw size={20} />
        Scan New Material
      </button>
    </div>
  );
};

export default ResultsView;