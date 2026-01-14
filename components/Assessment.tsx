import React, { useState, useEffect } from 'react';
import { Question, Answers, Dilemma, TextAnswers, SpeedAnalysis } from '../types';
import { descriptiveQuestions } from '../data/descriptive';

interface Props {
  questions: Question[];
  dilemmas: Dilemma[];
  onComplete: (answers: Answers, textAnswers: TextAnswers, totalTime: number, speedAnalysis: SpeedAnalysis) => void;
  onBack: () => void;
  is360?: boolean;
}

type Phase = 'questions' | 'dilemmas' | 'descriptive';

const QUESTION_TIME = 20;
const DILEMMA_TIME = 40;

const Assessment: React.FC<Props> = ({ questions, dilemmas, onComplete, onBack, is360 = false }) => {
  const [phase, setPhase] = useState<Phase>(() => (localStorage.getItem('assessment_phase') as Phase) || 'questions');
  const [currentIdx, setCurrentIdx] = useState<number>(() => parseInt(localStorage.getItem('assessment_idx') || '0'));
  
  const [shuffledQuestions] = useState<Question[]>(() => {
      const saved = localStorage.getItem('assessment_shuffled_qs');
      if (saved) return JSON.parse(saved);
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      localStorage.setItem('assessment_shuffled_qs', JSON.stringify(shuffled));
      return shuffled;
  });

  const [shuffledDilemmas] = useState<Dilemma[]>(() => {
      const saved = localStorage.getItem('assessment_shuffled_ds');
      if (saved) return JSON.parse(saved);
      const shuffled = [...dilemmas].sort(() => Math.random() - 0.5);
      localStorage.setItem('assessment_shuffled_ds', JSON.stringify(shuffled));
      return shuffled;
  });

  const [answers, setAnswers] = useState<Answers>(() => JSON.parse(localStorage.getItem('app_answers') || '{}'));
  const [textAnswers, setTextAnswers] = useState<TextAnswers>(() => JSON.parse(localStorage.getItem('app_text_answers') || '{}'));
  const [speedAnalysis, setSpeedAnalysis] = useState<SpeedAnalysis>(() => JSON.parse(localStorage.getItem('app_speed_analysis') || '{ "instinctive": 0, "natural": 0, "reflexive": 0 }'));
  const [elapsedTotal, setElapsedTotal] = useState(() => Number(localStorage.getItem('app_total_time') || 0));
  const [timeLeft, setTimeLeft] = useState(phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME);
  
  // Novos estados para pausa e omissões
  const [omissionStreak, setOmissionStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    localStorage.setItem('assessment_phase', phase);
    localStorage.setItem('assessment_idx', currentIdx.toString());
    localStorage.setItem('app_total_time', elapsedTotal.toString());
  }, [phase, currentIdx, elapsedTotal]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setElapsedTotal(p => p + 1);
        if (phase !== 'descriptive') setTimeLeft(p => (p > 0 ? p - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, isPaused]);

  useEffect(() => {
    if (timeLeft === 0 && phase !== 'descriptive' && !isPaused) handleAnswer(null);
  }, [timeLeft, isPaused]);

  const handleAnswer = (val: number | null) => {
    const q = phase === 'questions' ? shuffledQuestions[currentIdx] : shuffledDilemmas[currentIdx];
    if (!q) return;

    // Lógica de Streak de Omissão
    if (val === null) {
      const newStreak = omissionStreak + 1;
      setOmissionStreak(newStreak);
      if (newStreak >= 3) {
        setIsPaused(true);
        return;
      }
    } else {
      setOmissionStreak(0);
      const spent = (phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME) - timeLeft;
      const pct = spent / (phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME);
      setSpeedAnalysis(p => {
          const n = { ...p };
          if (pct < 0.3) n.instinctive++;
          else if (pct <= 0.75) n.natural++;
          else n.reflexive++;
          return n;
      });
    }

    const nextAnswers = { ...answers, [q.id]: val };
    setAnswers(nextAnswers);
    localStorage.setItem('app_answers', JSON.stringify(nextAnswers));

    const totalStepsCurrent = phase === 'questions' ? shuffledQuestions.length : phase === 'dilemmas' ? shuffledDilemmas.length : descriptiveQuestions.length;
    
    if (currentIdx < totalStepsCurrent - 1) {
        setCurrentIdx(currentIdx + 1);
        setTimeLeft(phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME);
    } else {
        if (phase === 'questions') {
            if (is360) onComplete(nextAnswers, textAnswers, elapsedTotal, speedAnalysis);
            else { setPhase('dilemmas'); setCurrentIdx(0); setTimeLeft(DILEMMA_TIME); }
        } else if (phase === 'dilemmas') { setPhase('descriptive'); setCurrentIdx(0); }
        else onComplete(nextAnswers, textAnswers, elapsedTotal, speedAnalysis);
    }
  };

  const handleTextAnswer = (val: string) => {
    const q = descriptiveQuestions[currentIdx];
    const newTextAnswers = { ...textAnswers, [q.id]: val };
    setTextAnswers(newTextAnswers);
    localStorage.setItem('app_text_answers', JSON.stringify(newTextAnswers));
  };

  const currentQ = phase === 'questions' ? shuffledQuestions[currentIdx] : phase === 'dilemmas' ? shuffledDilemmas[currentIdx] : descriptiveQuestions[currentIdx];
  const maxTime = phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME;
  const timePercent = (timeLeft / maxTime) * 100;

  const totalStepsCurrent = phase === 'questions' ? shuffledQuestions.length : phase === 'dilemmas' ? shuffledDilemmas.length : descriptiveQuestions.length;
  const progressPercent = Math.round((currentIdx / totalStepsCurrent) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col gap-6">
      {/* Informações de Progresso e Tempo Total */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-dark/40 p-6 rounded-3xl border border-white/5 no-pdf">
          <div className="flex items-center gap-4">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tempo Total Decorrido</span>
                  <span className="text-xl font-mono font-black text-white">{formatTime(elapsedTotal)}</span>
              </div>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Progresso da Fase</span>
                  <span className="text-xl font-black text-primary">{progressPercent}%</span>
              </div>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Questão</span>
              <span className="text-xl font-black text-white">{currentIdx + 1} <span className="text-slate-600 text-sm">/ {totalStepsCurrent}</span></span>
          </div>
      </div>

      <div className="bg-surface-dark p-12 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col gap-12 relative overflow-hidden">
        {/* Overlay de Pausa */}
        {isPaused && (
          <div className="absolute inset-0 z-[60] bg-surface-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="size-20 bg-accent-yellow/20 text-accent-yellow rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl">pause_circle</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 uppercase">Teste Pausado</h3>
              <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                  Detectamos 3 questões seguidas sem resposta. O teste foi pausado para garantir que você não perca mais tempo. Quando estiver pronto, clique no botão abaixo para continuar.
              </p>
              <button 
                  onClick={() => {
                      setIsPaused(false);
                      setOmissionStreak(0);
                      setTimeLeft(phase === 'questions' ? QUESTION_TIME : DILEMMA_TIME);
                  }}
                  className="px-10 py-5 bg-primary hover:bg-primary-hover text-white font-black uppercase text-sm rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 flex items-center gap-3"
              >
                  <span className="material-symbols-outlined">play_arrow</span>
                  Retomar Agora
              </button>
          </div>
        )}

        {phase !== 'descriptive' && (
          <div className="absolute top-0 left-0 w-full h-2 bg-white/5 z-20">
            <div className={`h-full transition-all duration-1000 linear ${timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' : 'bg-primary'}`} style={{ width: `${timePercent}%` }}></div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center gap-12">
            {/* MASSIVE TIMER */}
            {phase !== 'descriptive' && (
                <div className="shrink-0 relative size-32 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className={`${timeLeft <= 5 ? 'text-red-500' : 'text-primary'}`} strokeDasharray={`${timePercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-4xl font-black font-mono leading-none ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Segundos</span>
                    </div>
                </div>
            )}

            <div className="flex-1 text-center md:text-left space-y-4">
                <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">
                    {phase === 'questions' ? 'Competências Críticas' : phase === 'dilemmas' ? 'Dilemas Reais' : 'Evidências Qualitativas'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-[1.3] animate-fade-in" key={currentQ?.id}>
                    {phase === 'dilemmas' ? (currentQ as Dilemma).scenario : currentQ?.text}
                </h2>
            </div>
        </div>

        <div className="space-y-10">
            {phase === 'questions' && (
                <div className="grid grid-cols-6 gap-2 sm:gap-4">
                    {[0, 1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => handleAnswer(v)} className="flex flex-col items-center justify-center py-8 bg-surface-darker border-2 border-transparent rounded-[2rem] hover:border-primary hover:bg-primary/5 transition-all group active:scale-95">
                            <span className="text-3xl font-black text-slate-600 group-hover:text-primary transition-colors mb-2">{v}</span>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter group-hover:text-slate-300 text-center px-1 leading-tight">
                                {v === 0 ? 'NÃO SEI' : v === 1 ? 'Nunca' : v === 5 ? 'Sempre' : v === 3 ? 'Às vezes' : ''}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            {phase === 'dilemmas' && (currentQ as Dilemma).options && (
                <div className="flex flex-col gap-4">
                    {(currentQ as Dilemma).options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt.value)} className="w-full p-6 text-left bg-surface-darker border-2 border-transparent rounded-2xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-5 group active:scale-[0.99]">
                            <div className="size-5 rounded-full border-2 border-slate-700 group-hover:border-primary transition-colors flex-shrink-0"></div>
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors leading-snug">{opt.text}</span>
                        </button>
                    ))}
                </div>
            )}
            {phase === 'descriptive' && (
                <textarea value={textAnswers[currentQ.id] || ''} onChange={e => handleTextAnswer(e.target.value)} className="w-full h-48 bg-surface-darker border-2 border-gray-800 rounded-3xl p-8 text-white text-lg focus:border-primary outline-none transition-all resize-none shadow-inner" placeholder="Descreva sua evidência prática aqui..."/>
            )}
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-white/5">
            <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"><span className="material-symbols-outlined">arrow_back</span> Voltar</button>
            {phase === 'descriptive' && (
                <button onClick={() => {
                  if (currentIdx < (is360 ? 0 : descriptiveQuestions.length) - 1) setCurrentIdx(currentIdx + 1);
                  else onComplete(answers, textAnswers, elapsedTotal, speedAnalysis);
                }} className="px-12 py-5 bg-primary rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-white shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all">
                    {currentIdx === (is360 ? (descriptiveQuestions.length > 0 ? 0 : -1) : descriptiveQuestions.length - 1) ? 'Finalizar Teste' : 'Próxima Questão'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Assessment;