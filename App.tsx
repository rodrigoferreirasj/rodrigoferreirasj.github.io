import React, { useState, useMemo } from 'react';
import Welcome from './components/Welcome';
import PersonalInfo from './components/PersonalInfo';
import Assessment from './components/Assessment';
import Results from './components/Results';
import { LeadershipLevel, UserProfile, Answers, Question, TextAnswers } from './types';
import { questions as allQuestions } from './data/questions';
import { dilemmas } from './data/dilemmas';
import { calculateScores } from './services/scoringService';

type Step = 'welcome' | 'info' | 'assessment' | 'results';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});

  // Logic: Filter questions based on Level.
  // Requirement: "If level is L1, only L1 questions should be shown."
  // Interpretation: Core questions (Comum) + Level specific questions.
  const filteredQuestions = useMemo(() => {
    if (!profile) return [];
    return allQuestions.filter(q => 
        q.level === LeadershipLevel.Comum || q.level === profile.level
    );
  }, [profile]);

  const handleStart = () => setStep('info');

  const handleInfoComplete = (userProfile: UserProfile) => {
    setProfile(userProfile);
    setStep('assessment');
  };

  const handleAssessmentComplete = (userAnswers: Answers, userTextAnswers: TextAnswers) => {
    setAnswers(userAnswers);
    setTextAnswers(userTextAnswers);
    setStep('results');
  };

  const handleRestart = () => {
    setProfile(null);
    setAnswers({});
    setTextAnswers({});
    setStep('welcome');
  };

  const scores = useMemo(() => {
    if (!profile) return null;
    return calculateScores(filteredQuestions, dilemmas, answers, profile.level);
  }, [filteredQuestions, answers, profile]);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background-dark text-white selection:bg-primary selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-surface-darker/80 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center text-primary bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">Radar de Liderança</h2>
          </div>
          <div className="flex items-center gap-4">
             {profile && (
                 <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-gray-400">Logado como</span>
                    <span className="text-sm font-bold">{profile.name}</span>
                 </div>
             )}
            <div className="h-8 w-[1px] bg-gray-700 hidden sm:block"></div>
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Ajuda
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start relative">
        {step === 'welcome' && <Welcome onStart={handleStart} />}
        {step === 'info' && <PersonalInfo onComplete={handleInfoComplete} />}
        {step === 'assessment' && (
            <Assessment 
                questions={filteredQuestions} 
                dilemmas={dilemmas}
                onComplete={handleAssessmentComplete}
                onBack={() => setStep('info')}
            />
        )}
        {step === 'results' && profile && scores && (
            <Results results={scores} profile={profile} textAnswers={textAnswers} onRestart={handleRestart} />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-6 mt-auto border-t border-gray-800 bg-surface-darker">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            © 2024 Radar de Liderança. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;