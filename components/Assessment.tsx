import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, Answers, Dilemma, TextAnswers, DescriptiveQuestion } from '../types';
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
const DILEMMA_TIME = 20;

const Assessment: React.FC<Props> = ({ questions, dilemmas, onComplete, onBack, is360 = false }) => {
  const [phase, setPhase] = useState<Phase>('questions');
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledDilemmas, setShuffledDilemmas] = useState<Dilemma[]>([]);
  const [shuffledDescriptive, setShuffledDescriptive] = useState<DescriptiveQuestion[]>([]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentDIndex, setCurrentDIndex] = useState(0);
  const [currentDescIndex, setCurrentDescIndex] = useState(0);

  const [answers, setAnswers] = useState<Answers>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [consecutiveOmissions, setConsecutiveOmissions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    setShuffledDilemmas([...dilemmas].sort(() => Math.random() - 0.5));
    setShuffledDescriptive([...descriptiveQuestions].sort(() => Math.random() - 0.5));
  }, [questions, dilemmas]);

  const currentQuestion = shuffledQuestions[currentQIndex];
  const currentDilemma = shuffledDilemmas[currentDIndex];
  const currentDescriptive = shuffledDescriptive[currentDescIndex];
  const currentLimit = phase === 'dilemmas' ? DILEMMA_TIME : QUESTION_TIME;

  useEffect(() => {
      setTimeLeft(currentLimit);
  }, [currentQIndex, currentDIndex, phase, currentLimit]);

  useEffect(() => {
      if (isPaused || isTransitioning || phase === 'descriptive' || (phase === 'questions' && !currentQuestion) || (phase === 'dilemmas' && !currentDilemma)) return;
      if (timeLeft === 0) { handleTimeout(); return; }
      const tick = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => window.clearTimeout(tick);
  }, [timeLeft, isPaused, isTransitioning, phase, currentQuestion, currentDilemma]); 

  const handleTimeout = () => {
      const id = phase === 'questions' ? currentQuestion?.id : currentDilemma?.id;
      if (!id) return;
      setTotalTimeTaken(prev => prev + currentLimit);
      const newAnswers = { ...answers, [id]: null };
      setAnswers(newAnswers);
      const newConsecutive = consecutiveOmissions + 1;
      setConsecutiveOmissions(newConsecutive);
      if (newConsecutive >= 3) setIsPaused(true);
      else handleNext(newAnswers, true);
  };

  const handleResume = () => {
      setConsecutiveOmissions(0);
      setIsPaused(false);
  };

  const shuffledOptions = useMemo(() => {
    if (!currentDilemma) return [];
    return [...currentDilemma.options].sort(() => Math.random() - 0.5);
  }, [currentDilemma?.id]);

  if (shuffledQuestions.length === 0 || shuffledDilemmas.length === 0 || shuffledDescriptive.length === 0) {
      return <div className="text-center" style={{marginTop: '5rem'}}>Carregando avaliação...</div>;
  }

  const handleQuestionAnswer = (score: number) => {
    if (!currentQuestion || isTransitioning || isPaused) return;
    setConsecutiveOmissions(0);
    setTotalTimeTaken(prev => prev + (currentLimit - timeLeft));
    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);
    setTimeout(() => handleNext(newAnswers), 250);
  };

  const handleDilemmaAnswer = (score: number) => {
    if (!currentDilemma || isTransitioning || isPaused) return;
    setConsecutiveOmissions(0);
    setTotalTimeTaken(prev => prev + (currentLimit - timeLeft));
    const newAnswers = { ...answers, [currentDilemma.id]: score };
    setAnswers(newAnswers);
    setTimeout(() => handleNext(newAnswers), 250);
  };

  const handleTextChange = (text: string) => {
      if (!currentDescriptive) return;
      setTextAnswers(prev => ({ ...prev, [currentDescriptive.id]: text }));
  };

  const handleNext = (updatedAnswers?: Answers, autoAdvance = false) => {
    if (isTransitioning && !autoAdvance) return; 
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);

    const currentAnswersState = updatedAnswers || answers;
    setDirection('next');
    
    if (phase === 'questions') {
      if (currentQIndex < shuffledQuestions.length - 1) setCurrentQIndex(prev => prev + 1);
      else is360 ? onComplete(currentAnswersState, textAnswers, totalTimeTaken) : (setPhase('dilemmas'), setCurrentDIndex(0));
    } else if (phase === 'dilemmas') {
      if (currentDIndex < shuffledDilemmas.length - 1) setCurrentDIndex(prev => prev + 1);
      else (setPhase('descriptive'), setCurrentDescIndex(0));
    } else {
      if (currentDescIndex < shuffledDescriptive.length - 1) setCurrentDescIndex(prev => prev + 1);
      else onComplete(currentAnswersState, textAnswers, totalTimeTaken);
    }
  };

  const handlePrev = () => {
    if (isTransitioning || isPaused) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);
    setDirection('prev');

    if (phase === 'descriptive') {
      if (currentDescIndex > 0) setCurrentDescIndex(prev => prev - 1);
      else (setPhase('dilemmas'), setCurrentDIndex(shuffledDilemmas.length - 1));
    } else if (phase === 'dilemmas') {
      if (currentDIndex > 0) setCurrentDIndex(prev => prev - 1);
      else (setPhase('questions'), setCurrentQIndex(shuffledQuestions.length - 1));
    } else {
      if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
      else onBack();
    }
  };
  
  const totalSteps = is360 ? shuffledQuestions.length : shuffledQuestions.length + shuffledDilemmas.length + shuffledDescriptive.length;
  let currentStepGlobal = 0;
  if (phase === 'questions') currentStepGlobal = currentQIndex;
  else if (phase === 'dilemmas') currentStepGlobal = shuffledQuestions.length + currentDIndex;
  else currentStepGlobal = shuffledQuestions.length + shuffledDilemmas.length + currentDescIndex;
  const progress = ((currentStepGlobal + 1) / totalSteps) * 100;
  const currentAnswer = phase === 'questions' && currentQuestion ? answers[currentQuestion.id] : phase === 'dilemmas' && currentDilemma ? answers[currentDilemma.id] : null;

  return (
    <div style={{maxWidth: 800, width: '100%', margin: '0 auto', padding: '2rem 1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      {/* Background blobs simplified */}
      <div style={{position: 'fixed', top: '20%', left: '10%', width: 256, height: 256, background: 'rgba(19, 55, 236, 0.1)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'}}></div>
      
      {/* PAUSE MODAL */}
      {isPaused && (
          <div style={{position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
              <div className="card text-center" style={{maxWidth: 400}}>
                  <div style={{width: 64, height: 64, margin: '0 auto 1.5rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <span className="material-symbols-outlined" style={{fontSize: 32}}>hourglass_pause</span>
                  </div>
                  <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>Pausa Automática</h3>
                  <p className="text-gray" style={{marginBottom: '2rem'}}>
                      Percebemos que você não respondeu algumas perguntas seguidas. Respire fundo e retome quando estiver pronto.
                  </p>
                  <button onClick={handleResume} className="btn btn-primary w-full">Estou pronto para continuar</button>
              </div>
          </div>
      )}

      {/* Progress Section */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-primary" style={{textTransform: 'uppercase'}}>
              {phase === 'questions' ? 'Avaliação de Competências' : phase === 'dilemmas' ? 'Análise de Cenários' : 'Auto-Reflexão'}
          </span>
          <div className="flex items-center gap-4">
             {phase !== 'descriptive' && (
                 <div className="flex items-center gap-1 text-xs font-bold" style={{background: '#1f2937', padding: '0.25rem 0.5rem', borderRadius: 4, color: timeLeft <= 3 ? '#ef4444' : '#9ca3af'}}>
                     <span className="material-symbols-outlined text-sm">timer</span>
                     {timeLeft}s
                 </div>
             )}
             <span className="text-sm text-gray" style={{background: 'var(--bg-surface)', padding: '0.25rem 0.75rem', borderRadius: 99, border: '1px solid var(--border-color)'}}>
                {currentStepGlobal + 1} de {totalSteps}
            </span>
          </div>
        </div>
        
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        {phase !== 'descriptive' && !isPaused && (
             <div style={{width: '100%', height: 4, background: '#374151', borderRadius: 99, overflow: 'hidden', opacity: 0.5}}>
                 <div style={{height: '100%', background: timeLeft <= 3 ? '#ef4444' : '#9ca3af', width: `${(timeLeft / currentLimit) * 100}%`, transition: 'width 1s linear'}}></div>
             </div>
        )}
      </div>

      {/* --- PHASE: QUESTIONS --- */}
      {phase === 'questions' && currentQuestion && (
        <div key={`q-${currentQuestion.id}`} className="card animate-fade-in" style={{opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.5s'}}>
          <div className="flex flex-col gap-6">
              <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', lineHeight: 1.4}}>{currentQuestion.text}</h1>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem'}}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <label key={val} style={{cursor: 'pointer'}}>
                    <input type="radio" name={`q_${currentQuestion.id}`} value={val} checked={currentAnswer === val} onChange={() => handleQuestionAnswer(val)} disabled={isTransitioning} className="hidden" />
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '0.5rem', borderRadius: '0.75rem', border: currentAnswer === val ? '2px solid var(--primary)' : '2px solid transparent', background: currentAnswer === val ? 'rgba(19, 55, 236, 0.1)' : 'var(--bg-surface-darker)', transition: 'all 0.2s'}}>
                      <div style={{width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem', background: currentAnswer === val ? 'var(--primary)' : 'rgba(0,0,0,0.2)', color: currentAnswer === val ? 'white' : 'var(--text-gray)'}}>{val}</div>
                      <span className="text-xs text-gray text-center" style={{color: currentAnswer === val ? 'white' : 'var(--text-gray)'}}>
                        {val === 1 ? 'Nunca' : val === 2 ? 'Raramente' : val === 3 ? 'Às vezes' : val === 4 ? 'Frequent.' : 'Sempre'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
          </div>
        </div>
      )}

      {/* --- PHASE: DILEMMAS --- */}
      {phase === 'dilemmas' && currentDilemma && (
        <div key={`d-${currentDilemma.id}`} className="card animate-fade-in" style={{opacity: isTransitioning ? 0.5 : 1}}>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold" style={{color: 'var(--accent-yellow)', textTransform: 'uppercase', marginBottom: '0.5rem'}}>
                <span className="material-symbols-outlined">crisis_alert</span>
                <span>Cenário {currentDIndex + 1}</span>
              </div>
              <p style={{fontSize: '1.25rem', fontStyle: 'italic', color: '#e2e8f0', marginBottom: '0.5rem'}}>"{currentDilemma.scenario}"</p>
              <p className="text-sm text-gray">Como você agiria nesta situação?</p>
            </div>
            <div className="flex flex-col gap-3">
              {shuffledOptions.map((opt, idx) => (
                <label key={idx} style={{cursor: 'pointer'}}>
                  <input type="radio" name={`d_${currentDilemma.id}`} value={opt.value} checked={currentAnswer === opt.value} onChange={() => handleDilemmaAnswer(opt.value)} disabled={isTransitioning} className="hidden" />
                  <div style={{padding: '1.25rem', borderRadius: '0.75rem', border: currentAnswer === opt.value ? '2px solid var(--primary)' : '2px solid var(--border-color)', background: currentAnswer === opt.value ? 'rgba(19, 55, 236, 0.2)' : 'var(--bg-surface-darker)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s'}}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', border: currentAnswer === opt.value ? '6px solid var(--primary)' : '2px solid #6b7280', flexShrink: 0, background: 'transparent'}}></div>
                    <span style={{color: currentAnswer === opt.value ? 'white' : '#d1d5db'}}>{opt.text}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PHASE: DESCRIPTIVE --- */}
      {phase === 'descriptive' && currentDescriptive && (
        <div key={`desc-${currentDescriptive.id}`} className="card animate-fade-in">
          <div className="flex flex-col gap-6">
              <div>
                 <div className="flex items-center gap-2 text-sm text-gray" style={{marginBottom: '0.5rem'}}>
                    <span className="material-symbols-outlined">edit_note</span>
                    <span>{currentDescriptive.theme} • {currentDescriptive.category}</span>
                 </div>
                 <h1 style={{fontSize: '1.25rem', fontWeight: 'bold'}}>{currentDescriptive.text}</h1>
              </div>
              <textarea 
                className="input-field" 
                style={{height: '10rem', resize: 'none'}}
                placeholder="Escreva sua reflexão aqui..."
                value={textAnswers[currentDescriptive.id] || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center" style={{marginTop: '1rem'}}>
        <button onClick={handlePrev} disabled={isTransitioning || isPaused} className="btn" style={{color: 'var(--text-gray)'}}>
          <span className="material-symbols-outlined">arrow_back</span>
          Anterior
        </button>
        <button onClick={() => handleNext()} disabled={(phase !== 'descriptive' && currentAnswer === undefined) || isTransitioning || isPaused} className="btn btn-primary">
          <span>{phase === 'descriptive' ? (currentDescIndex === shuffledDescriptive.length - 1 ? 'Finalizar' : (textAnswers[currentDescriptive.id] ? 'Próxima' : 'Pular')) : 'Próxima'}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default Assessment;