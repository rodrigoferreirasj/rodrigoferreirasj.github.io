import React, { useState, useEffect, useMemo } from 'react';
import { Question, Answers, Dilemma, DilemmaOption, TextAnswers, DescriptiveQuestion } from '../types';
import { descriptiveQuestions } from '../data/descriptive';

interface Props {
  questions: Question[];
  dilemmas: Dilemma[];
  onComplete: (answers: Answers, textAnswers: TextAnswers) => void;
  onBack: () => void;
  is360?: boolean;
}

type Phase = 'questions' | 'dilemmas' | 'descriptive';

const Assessment: React.FC<Props> = ({ questions, dilemmas, onComplete, onBack, is360 = false }) => {
  const [phase, setPhase] = useState<Phase>('questions');
  
  // Randomized Lists State
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledDilemmas, setShuffledDilemmas] = useState<Dilemma[]>([]);
  const [shuffledDescriptive, setShuffledDescriptive] = useState<DescriptiveQuestion[]>([]);

  // Indices
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentDIndex, setCurrentDIndex] = useState(0);
  const [currentDescIndex, setCurrentDescIndex] = useState(0);

  const [answers, setAnswers] = useState<Answers>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  
  // Initialize and Shuffle Everything once on mount
  useEffect(() => {
    // 1. Shuffle Scale Questions
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    
    // 2. Shuffle Dilemmas (Scenarios)
    setShuffledDilemmas([...dilemmas].sort(() => Math.random() - 0.5));

    // 3. Shuffle Descriptive Questions
    setShuffledDescriptive([...descriptiveQuestions].sort(() => Math.random() - 0.5));
  }, [questions, dilemmas]);

  // Derived Current Items
  const currentQuestion = shuffledQuestions[currentQIndex];
  const currentDilemma = shuffledDilemmas[currentDIndex];
  const currentDescriptive = shuffledDescriptive[currentDescIndex];

  // Shuffle Dilemma Options (randomize options within the scenario)
  const shuffledOptions = useMemo(() => {
    if (!currentDilemma) return [];
    return [...currentDilemma.options].sort(() => Math.random() - 0.5);
  }, [currentDilemma?.id]);

  if (shuffledQuestions.length === 0 || shuffledDilemmas.length === 0 || shuffledDescriptive.length === 0) {
      return <div className="text-white text-center mt-20">Carregando avaliação...</div>;
  }

  // --- Handlers for Questions Phase ---

  const handleQuestionAnswer = (score: number) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: score }));
    setTimeout(() => {
        handleNext();
    }, 250);
  };

  // --- Handlers for Dilemmas Phase ---

  const handleDilemmaAnswer = (score: number) => {
    if (!currentDilemma) return;
    setAnswers(prev => ({ ...prev, [currentDilemma.id]: score }));
    setTimeout(() => {
        handleNext();
    }, 250);
  };

  // --- Handlers for Descriptive Phase ---

  const handleTextChange = (text: string) => {
      if (!currentDescriptive) return;
      setTextAnswers(prev => ({ ...prev, [currentDescriptive.id]: text }));
  };

  // --- Navigation Logic ---

  const handleNext = () => {
    setDirection('next');
    
    if (phase === 'questions') {
      if (currentQIndex < shuffledQuestions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
      } else {
        // Change logic for 360: Skip dilemmas and descriptive
        if (is360) {
            onComplete(answers, textAnswers);
        } else {
            // Transition to Dilemmas
            setPhase('dilemmas');
            setCurrentDIndex(0);
        }
      }
    } else if (phase === 'dilemmas') {
      if (currentDIndex < shuffledDilemmas.length - 1) {
        setCurrentDIndex(prev => prev + 1);
      } else {
        // Transition to Descriptive
        setPhase('descriptive');
        setCurrentDescIndex(0);
      }
    } else {
      // Descriptive Phase
      if (currentDescIndex < shuffledDescriptive.length - 1) {
        setCurrentDescIndex(prev => prev + 1);
      } else {
        onComplete(answers, textAnswers);
      }
    }
  };

  const handlePrev = () => {
    setDirection('prev');

    if (phase === 'descriptive') {
      if (currentDescIndex > 0) {
        setCurrentDescIndex(prev => prev - 1);
      } else {
        // Back to Dilemmas
        setPhase('dilemmas');
        setCurrentDIndex(shuffledDilemmas.length - 1);
      }
    } else if (phase === 'dilemmas') {
      if (currentDIndex > 0) {
        setCurrentDIndex(prev => prev - 1);
      } else {
        // Back to Questions
        setPhase('questions');
        setCurrentQIndex(shuffledQuestions.length - 1);
      }
    } else {
      // Questions Phase
      if (currentQIndex > 0) {
        setCurrentQIndex(prev => prev - 1);
      } else {
        onBack();
      }
    }
  };

  // --- Rendering Calculations ---
  
  const totalSteps = is360 
    ? shuffledQuestions.length 
    : shuffledQuestions.length + shuffledDilemmas.length + shuffledDescriptive.length;

  let currentStepGlobal = 0;
  if (phase === 'questions') currentStepGlobal = currentQIndex;
  else if (phase === 'dilemmas') currentStepGlobal = shuffledQuestions.length + currentDIndex;
  else currentStepGlobal = shuffledQuestions.length + shuffledDilemmas.length + currentDescIndex;

  const progress = ((currentStepGlobal + 1) / totalSteps) * 100;

  // Guard against undefined during render
  if (phase === 'questions' && !currentQuestion) return <div className="text-white text-center mt-20">Carregando pergunta...</div>;

  const currentAnswer = phase === 'questions' && currentQuestion
    ? answers[currentQuestion.id] 
    : phase === 'dilemmas' && currentDilemma
      ? answers[currentDilemma.id] 
      : null;

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-8 z-10 mx-auto py-8 px-4">
      {/* Abstract Background Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Progress Section */}
      <div className="flex flex-col gap-3 relative z-20">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">
              {phase === 'questions' ? 'Avaliação de Competências' : phase === 'dilemmas' ? 'Análise de Cenários' : 'Auto-Reflexão'}
            </span>
          </div>
          <span className="text-text-secondary text-sm font-medium bg-surface-dark px-3 py-1 rounded-full border border-surface-darker">
            {currentStepGlobal + 1} de {totalSteps}
          </span>
        </div>
        <div className="relative w-full h-2 rounded-full bg-surface-darker overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* --- PHASE: QUESTIONS --- */}
      {phase === 'questions' && currentQuestion && (
        <div 
          key={`q-${currentQuestion.id}`} 
          className={`bg-surface-dark border border-gray-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-in-out transform ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
        >
          {/* Card Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          
          <div className="flex flex-col gap-8 relative z-10">
            <div className="flex flex-col gap-4">
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
                      onChange={() => handleQuestionAnswer(val)}
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
      )}

      {/* --- PHASE: DILEMMAS --- */}
      {phase === 'dilemmas' && currentDilemma && (
        <div 
          key={`d-${currentDilemma.id}`}
          className={`bg-surface-dark border border-gray-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-in-out transform ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-col gap-8 relative z-10">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 text-accent-yellow text-sm font-bold uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg">crisis_alert</span>
                <span>Cenário {currentDIndex + 1}</span>
              </div>
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed font-serif italic text-gray-200">
                "{currentDilemma.scenario}"
              </p>
              <p className="text-sm text-gray-400">Como você agiria nesta situação?</p>
            </div>

            {/* Dilemma Options (Shuffled) */}
            <div className="flex flex-col gap-3">
              {shuffledOptions.map((opt, idx) => (
                <label key={idx} className="relative cursor-pointer group/opt">
                  <input
                    type="radio"
                    name={`d_${currentDilemma.id}`}
                    value={opt.value}
                    checked={currentAnswer === opt.value}
                    onChange={() => handleDilemmaAnswer(opt.value)}
                    className="peer sr-only"
                  />
                  <div className={`p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4
                    ${currentAnswer === opt.value
                      ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                      : 'bg-surface-darker border-gray-700 hover:border-gray-500 hover:bg-surface-darker/80'
                    }`}
                  >
                    <div className={`size-6 rounded-full border-2 flex items-center justify-center shrink-0
                       ${currentAnswer === opt.value ? 'border-primary bg-primary' : 'border-gray-500'}`}>
                       {currentAnswer === opt.value && <div className="size-2 rounded-full bg-white"></div>}
                    </div>
                    <span className={`text-base ${currentAnswer === opt.value ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {opt.text}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PHASE: DESCRIPTIVE --- */}
      {phase === 'descriptive' && currentDescriptive && (
        <div 
          key={`desc-${currentDescriptive.id}`}
          className={`bg-surface-dark border border-gray-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-in-out transform ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/10 to-transparent opacity-50 pointer-events-none"></div>

          <div className="flex flex-col gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    <span>{currentDescriptive.theme} • {currentDescriptive.category}</span>
                 </div>
                 <h1 className="text-white text-xl md:text-2xl font-bold leading-snug">
                   {currentDescriptive.text}
                 </h1>
                 <p className="text-xs text-primary uppercase font-bold tracking-wide mt-1">Opcional</p>
              </div>

              <textarea 
                className="w-full h-40 bg-surface-darker border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-shadow"
                placeholder="Escreva sua reflexão aqui..."
                value={textAnswers[currentDescriptive.id] || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
          </div>
        </div>
      )}

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
          disabled={phase !== 'descriptive' && currentAnswer === undefined}
          className="group flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(19,55,236,0.4)] hover:shadow-[0_0_25px_rgba(19,55,236,0.6)] transition-all transform hover:-translate-y-0.5"
        >
          <span className="font-bold">
            {phase === 'descriptive' 
               ? (currentDescIndex === shuffledDescriptive.length - 1 ? 'Finalizar' : (textAnswers[currentDescriptive.id] ? 'Próxima' : 'Pular')) 
               : (phase === 'dilemmas' && currentDIndex === shuffledDilemmas.length - 1 ? 'Continuar' : 'Próxima')
            }
          </span>
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default Assessment;