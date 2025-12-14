import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, Answers, Dilemma, DilemmaOption, TextAnswers, DescriptiveQuestion } from '../types';
import { descriptiveQuestions } from '../data/descriptive';

interface Props {
  questions: Question[];
  dilemmas: Dilemma[];
  onComplete: (answers: Answers, textAnswers: TextAnswers, totalTime: number) => void;
  onBack: () => void;
  is360?: boolean;
}

type Phase = 'questions' | 'dilemmas' | 'descriptive';

const QUESTION_TIME = 10;
const DILEMMA_TIME = 30;

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
  
  // Lock state to prevent double clicks/race conditions
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- TIME & OMISSION LOGIC ---
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0); // Accumulator for total time
  const [consecutiveOmissions, setConsecutiveOmissions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Timer ref not strictly needed with the split-effect approach, but kept for cleanup safety if needed
  const timerRef = useRef<number | null>(null);

  // Initialize and Shuffle Everything once on mount
  useEffect(() => {
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    setShuffledDilemmas([...dilemmas].sort(() => Math.random() - 0.5));
    setShuffledDescriptive([...descriptiveQuestions].sort(() => Math.random() - 0.5));
  }, [questions, dilemmas]);

  // Derived Current Items
  const currentQuestion = shuffledQuestions[currentQIndex];
  const currentDilemma = shuffledDilemmas[currentDIndex];
  const currentDescriptive = shuffledDescriptive[currentDescIndex];

  // Helper to get current max time based on phase
  const currentLimit = phase === 'dilemmas' ? DILEMMA_TIME : QUESTION_TIME;

  // EFFECT 1: RESET TIMER ON QUESTION CHANGE
  useEffect(() => {
      // Whenever the index or phase changes, reset the clock based on phase
      setTimeLeft(phase === 'dilemmas' ? DILEMMA_TIME : QUESTION_TIME);
  }, [currentQIndex, currentDIndex, phase]);

  // EFFECT 2: COUNTDOWN LOGIC (TICK)
  useEffect(() => {
      // Stop conditions
      if (
          isPaused || 
          isTransitioning || 
          phase === 'descriptive' ||
          (phase === 'questions' && !currentQuestion) ||
          (phase === 'dilemmas' && !currentDilemma)
      ) {
          return;
      }

      // If time is up, trigger timeout logic
      if (timeLeft === 0) {
          handleTimeout();
          return;
      }

      // Tick down
      const tick = window.setTimeout(() => {
          setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => window.clearTimeout(tick);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isPaused, isTransitioning, phase, currentQuestion, currentDilemma]); 
  // Dependency on 'timeLeft' ensures the effect re-runs every second, creating the loop.

  const handleTimeout = () => {
      // Determine ID
      const id = phase === 'questions' ? currentQuestion?.id : currentDilemma?.id;
      if (!id) return;

      // Add full duration to total time (since user used all available time)
      setTotalTimeTaken(prev => prev + currentLimit);

      // Register Omission (null)
      const newAnswers = { ...answers, [id]: null };
      setAnswers(newAnswers);

      const newConsecutive = consecutiveOmissions + 1;
      setConsecutiveOmissions(newConsecutive);

      // Check for forced pause
      if (newConsecutive >= 3) {
          setIsPaused(true);
      } else {
          // Auto-advance
          handleNext(newAnswers, true); // true = automated advance
      }
  };

  const handleResume = () => {
      setConsecutiveOmissions(0);
      setIsPaused(false);
      // Logic to restart current question timer happens automatically via useEffect dependency on isPaused
  };

  const shuffledOptions = useMemo(() => {
    if (!currentDilemma) return [];
    return [...currentDilemma.options].sort(() => Math.random() - 0.5);
  }, [currentDilemma?.id]);

  if (shuffledQuestions.length === 0 || shuffledDilemmas.length === 0 || shuffledDescriptive.length === 0) {
      return <div className="text-white text-center mt-20 animate-pulse">Carregando avaliação...</div>;
  }

  // --- Handlers for Questions Phase ---

  const handleQuestionAnswer = (score: number) => {
    if (!currentQuestion || isTransitioning || isPaused) return;
    
    // Reset Omissions count on valid answer
    setConsecutiveOmissions(0);

    // Track time spent (Max - Left)
    const timeSpent = QUESTION_TIME - timeLeft;
    setTotalTimeTaken(prev => prev + timeSpent);

    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    setTimeout(() => {
        handleNext(newAnswers);
    }, 250);
  };

  // --- Handlers for Dilemmas Phase ---

  const handleDilemmaAnswer = (score: number) => {
    if (!currentDilemma || isTransitioning || isPaused) return;
    
    setConsecutiveOmissions(0);

    // Track time spent
    const timeSpent = DILEMMA_TIME - timeLeft;
    setTotalTimeTaken(prev => prev + timeSpent);
    
    const newAnswers = { ...answers, [currentDilemma.id]: score };
    setAnswers(newAnswers);
    setTimeout(() => {
        handleNext(newAnswers);
    }, 250);
  };

  // --- Handlers for Descriptive Phase ---

  const handleTextChange = (text: string) => {
      if (!currentDescriptive) return;
      setTextAnswers(prev => ({ ...prev, [currentDescriptive.id]: text }));
  };

  // --- Navigation Logic ---

  const handleNext = (updatedAnswers?: Answers, autoAdvance = false) => {
    if (isTransitioning && !autoAdvance) return; 
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    const currentAnswersState = updatedAnswers || answers;
    setDirection('next');
    
    if (phase === 'questions') {
      if (currentQIndex < shuffledQuestions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
      } else {
        if (is360) {
            onComplete(currentAnswersState, textAnswers, totalTimeTaken);
        } else {
            setPhase('dilemmas');
            setCurrentDIndex(0);
        }
      }
    } else if (phase === 'dilemmas') {
      if (currentDIndex < shuffledDilemmas.length - 1) {
        setCurrentDIndex(prev => prev + 1);
      } else {
        setPhase('descriptive');
        setCurrentDescIndex(0);
      }
    } else {
      // Descriptive Phase
      if (currentDescIndex < shuffledDescriptive.length - 1) {
        setCurrentDescIndex(prev => prev + 1);
      } else {
        onComplete(currentAnswersState, textAnswers, totalTimeTaken);
      }
    }
  };

  const handlePrev = () => {
    if (isTransitioning || isPaused) return;
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);
    
    setDirection('prev');

    if (phase === 'descriptive') {
      if (currentDescIndex > 0) {
        setCurrentDescIndex(prev => prev - 1);
      } else {
        setPhase('dilemmas');
        setCurrentDIndex(shuffledDilemmas.length - 1);
      }
    } else if (phase === 'dilemmas') {
      if (currentDIndex > 0) {
        setCurrentDIndex(prev => prev - 1);
      } else {
        setPhase('questions');
        setCurrentQIndex(shuffledQuestions.length - 1);
      }
    } else {
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

  if (phase === 'questions' && !currentQuestion) {
      return (
          <div className="flex flex-col items-center justify-center mt-20 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <span className="text-white text-sm">Sincronizando...</span>
          </div>
      );
  }

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

      {/* PAUSE MODAL */}
      {isPaused && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4">
              <div className="bg-surface-dark border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                  <div className="size-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-3xl">hourglass_pause</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Pausa Automática</h3>
                  <p className="text-gray-300 mb-8 leading-relaxed">
                      Percebemos que você não respondeu algumas perguntas seguidas. 
                      Isso é normal quando há pressão ou dúvida. 
                      <br/><br/>
                      Respire fundo e retome quando estiver pronto para decidir com clareza.
                  </p>
                  <button 
                      onClick={handleResume}
                      className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all"
                  >
                      Estou pronto para continuar
                  </button>
              </div>
          </div>
      )}

      {/* Progress Section */}
      <div className="flex flex-col gap-3 relative z-20">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">
              {phase === 'questions' ? 'Avaliação de Competências' : phase === 'dilemmas' ? 'Análise de Cenários' : 'Auto-Reflexão'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* TIMER INDICATOR */}
             {phase !== 'descriptive' && (
                 <div className={`flex items-center gap-1 text-xs font-bold font-mono px-2 py-1 rounded transition-colors ${timeLeft <= 3 ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-gray-800'}`}>
                     <span className="material-symbols-outlined text-sm">timer</span>
                     {timeLeft}s
                 </div>
             )}
             <span className="text-text-secondary text-sm font-medium bg-surface-dark px-3 py-1 rounded-full border border-surface-darker">
                {currentStepGlobal + 1} de {totalSteps}
            </span>
          </div>
        </div>
        
        {/* Main Progress Bar */}
        <div className="relative w-full h-2 rounded-full bg-surface-darker overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Timer Bar (Countdown Visual) */}
        {phase !== 'descriptive' && !isPaused && (
             <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden opacity-50">
                 <div 
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-gray-400'}`}
                    style={{ width: `${(timeLeft / currentLimit) * 100}%` }}
                 ></div>
             </div>
        )}
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
            <div className={`flex flex-col gap-4 py-4 ${isTransitioning ? 'pointer-events-none opacity-80' : ''}`}>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((val) => (
                  <label key={val} className="group/option cursor-pointer relative">
                    <input 
                      type="radio" 
                      name={`q_${currentQuestion.id}`} 
                      value={val}
                      checked={currentAnswer === val}
                      onChange={() => handleQuestionAnswer(val)}
                      disabled={isTransitioning}
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
            <div className={`flex flex-col gap-3 ${isTransitioning ? 'pointer-events-none opacity-80' : ''}`}>
              {shuffledOptions.map((opt, idx) => (
                <label key={idx} className="relative cursor-pointer group/opt">
                  <input
                    type="radio"
                    name={`d_${currentDilemma.id}`}
                    value={opt.value}
                    checked={currentAnswer === opt.value}
                    onChange={() => handleDilemmaAnswer(opt.value)}
                    disabled={isTransitioning}
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
          disabled={isTransitioning || isPaused}
          className="group flex items-center gap-2 px-6 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-surface-dark transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span className="font-bold">Anterior</span>
        </button>

        <button 
          onClick={() => handleNext()}
          disabled={(phase !== 'descriptive' && currentAnswer === undefined) || isTransitioning || isPaused}
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