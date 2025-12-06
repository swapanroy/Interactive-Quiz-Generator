import React from 'react';
import { QuizData, UserAnswer } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCcw, Award, BookOpen } from 'lucide-react';

interface ResultsViewProps {
  quizData: QuizData;
  userAnswers: UserAnswer[];
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quizData, userAnswers, onReset }) => {
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const score = Math.round((correctCount / userAnswers.length) * 100);
  
  // Group incorrect answers by concept to find weak areas
  const weakConcepts = userAnswers
    .filter(a => !a.isCorrect)
    .map(a => {
      const q = quizData.questions.find(q => q.id === a.questionId);
      return q ? q.relatedConcept : null;
    })
    .filter(Boolean) as string[];

  // Deduplicate weak concepts
  const uniqueWeakConcepts = Array.from(new Set(weakConcepts));

  const chartData = [
    { name: 'Correct', value: correctCount },
    { name: 'Incorrect', value: userAnswers.length - correctCount },
  ];
  
  const COLORS = ['#4f46e5', '#e2e8f0']; // Indigo-600 vs Slate-200

  let feedbackMessage = "";
  if (score === 100) feedbackMessage = "Masterful! You know this topic inside out.";
  else if (score >= 80) feedbackMessage = "Great job! Just a few minor details to polish.";
  else if (score >= 60) feedbackMessage = "Good effort. Review the concepts below to improve.";
  else feedbackMessage = "Keep practicing. It might be worth re-reading the summary.";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Quiz Complete!</h2>
        <p className="text-slate-500">Here is how you performed on "{quizData.title}"</p>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-900">{score}%</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Performance Analysis</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">{feedbackMessage}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className="block text-2xl font-bold text-slate-900">{userAnswers.length}</span>
              <span className="text-sm text-slate-500">Total Questions</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-green-600">{correctCount}</span>
              <span className="text-sm text-slate-500">Correct Answers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Areas / Review */}
      {uniqueWeakConcepts.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-start gap-3">
            <BookOpen className="text-orange-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Recommended Review Topics</h3>
              <p className="text-sm text-orange-800 mb-3">Based on your answers, consider re-reading sections about:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueWeakConcepts.map(concept => (
                  <span key={concept} className="px-3 py-1 bg-white/60 text-orange-800 rounded-full text-sm font-medium border border-orange-200">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Recap */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">Topic Summary</h3>
        <p className="text-sm text-slate-600 leading-relaxed italic">
          "{quizData.summary}"
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <RefreshCcw size={20} />
        Scan New Pages
      </button>
    </div>
  );
};

export default ResultsView;
