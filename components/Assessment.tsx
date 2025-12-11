import React, { useState, useEffect } from 'react';
import { Question, Answers } from '../types';

interface Props {
  questions: Question[];
  onComplete: (answers: Answers) => void;
  onBack: () => void;
}

const Assessment: React.FC<Props> = ({ questions, onComplete, onBack }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  
  // Shuffle questions once on mount
  useEffect(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, [questions]);

  if (shuffledQuestions.length === 0) return <div className="text-white text-center mt-20">Carregando avaliação...</div>;

  const currentQuestion = shuffledQuestions[currentIndex];
  
  const handleAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: score }));
    // Auto advance after short delay for better UX
    setTimeout(() => {
        handleNext();
    }, 250);
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setDirection('next');
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-8 z-10 mx-auto py-8 px-4">
      {/* Abstract Background Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Progress Section */}
      <div className="flex flex-col gap-3 relative z-20">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Seção Atual</span>
            <h3 className="text-white text-xl md:text-2xl font-semibold leading-tight animate-fade-in" key={currentQuestion.block}>
              {currentQuestion.block}
            </h3>
          </div>
          <span className="text-text-secondary text-sm font-medium bg-surface-dark px-3 py-1 rounded-full border border-surface-darker">
            {currentIndex + 1} de {shuffledQuestions.length}
          </span>
        </div>
        <div className="relative w-full h-2 rounded-full bg-surface-darker overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div 
        key={currentIndex} 
        className={`bg-surface-dark border border-gray-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-in-out transform ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
      >
        {/* Card Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <div className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
              <span className="material-symbols-outlined text-lg">psychology</span>
              <span>{currentQuestion.category}</span>
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-snug tracking-tight">
              {currentQuestion.text}
            </h1>
          </div>

          {/* Rating Scale 1-5 */}
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val} className="group/option cursor-pointer relative">
                  <input 
                    type="radio" 
                    name={`q_${currentQuestion.id}`} 
                    value={val}
                    checked={currentAnswer === val}
                    onChange={() => handleAnswer(val)}
                    className="peer sr-only" 
                  />
                  <div className={`h-full flex flex-col items-center justify-center p-4 gap-3 rounded-xl border-2 transition-all hover:-translate-y-1 
                    ${currentAnswer === val 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-surface-darker border-transparent hover:bg-surface-darker/80'}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors
                      ${currentAnswer === val 
                        ? 'bg-primary text-white' 
                        : 'bg-black/20 text-gray-400 group-hover/option:text-white'}`}
                    >
                      {val}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium text-center hidden sm:block
                      ${currentAnswer === val ? 'text-white' : 'text-gray-400 group-hover/option:text-white'}`}>
                      {val === 1 ? 'Nunca' : val === 2 ? 'Raramente' : val === 3 ? 'Às vezes' : val === 4 ? 'Frequentemente' : 'Sempre'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between px-2 sm:hidden">
                <span className="text-xs text-gray-500">Nunca</span>
                <span className="text-xs text-gray-500">Sempre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-4">
        <button 
          onClick={handlePrev}
          className="group flex items-center gap-2 px-6 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-surface-dark transition-all"
        >
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span className="font-bold">Anterior</span>
        </button>

        <button 
          onClick={handleNext}
          disabled={currentAnswer === undefined}
          className="group flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(19,55,236,0.4)] hover:shadow-[0_0_25px_rgba(19,55,236,0.6)] transition-all transform hover:-translate-y-0.5"
        >
          <span className="font-bold">{currentIndex === shuffledQuestions.length - 1 ? 'Finalizar' : 'Próxima'}</span>
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default Assessment;