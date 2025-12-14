import React, { useState, useMemo, useEffect } from 'react';
import Welcome from './components/Welcome';
import PersonalInfo from './components/PersonalInfo';
import Assessment from './components/Assessment';
import Results from './components/Results';
import HelpModal from './components/HelpModal';
import { LeadershipLevel, UserProfile, Answers, Question, TextAnswers } from './types';
import { questions as allQuestions } from './data/questions';
import { questions360 } from './data/questions360';
import { dilemmas } from './data/dilemmas';
import { calculateScores } from './services/scoringService';

type Step = 'welcome' | 'info' | 'assessment' | 'results';

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [step, setStep] = useState<Step>(() => {
    const saved = localStorage.getItem('app_step');
    return (saved as Step) || 'welcome';
  });
  
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('app_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [answers, setAnswers] = useState<Answers>(() => {
    const saved = localStorage.getItem('app_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [textAnswers, setTextAnswers] = useState<TextAnswers>(() => {
    const saved = localStorage.getItem('app_text_answers');
    return saved ? JSON.parse(saved) : {};
  });

  // Store total time taken for the assessment
  const [totalTime, setTotalTime] = useState<number>(0);

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Effects to save state changes
  useEffect(() => {
    localStorage.setItem('app_step', step);
  }, [step]);

  useEffect(() => {
    if (profile) localStorage.setItem('app_profile', JSON.stringify(profile));
    else localStorage.removeItem('app_profile');
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('app_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem('app_text_answers', JSON.stringify(textAnswers));
  }, [textAnswers]);

  // Logic: Filter questions based on Level OR use 360 Questions
  const filteredQuestions = useMemo(() => {
    if (!profile) return [];
    
    if (profile.is360) {
        return questions360;
    }

    return allQuestions.filter(q => 
        q.level === LeadershipLevel.Comum || q.level === profile.level
    );
  }, [profile]);

  const handleStart = () => setStep('info');

  const handleInfoComplete = (userProfile: UserProfile) => {
    setProfile(userProfile);
    // Clear previous answers if switching users/modes
    setAnswers({});
    setTextAnswers({});
    setTotalTime(0);
    setStep('assessment');
  };

  const handleAssessmentComplete = (userAnswers: Answers, userTextAnswers: TextAnswers, timeTaken: number) => {
    setAnswers(userAnswers);
    setTextAnswers(userTextAnswers);
    setTotalTime(timeTaken);
    setStep('results');
  };

  const handleRestart = () => {
    // Clear State
    setProfile(null);
    setAnswers({});
    setTextAnswers({});
    setTotalTime(0);
    setStep('welcome');
    // Clear Storage
    localStorage.removeItem('app_step');
    localStorage.removeItem('app_profile');
    localStorage.removeItem('app_answers');
    localStorage.removeItem('app_text_answers');
  };

  const scores = useMemo(() => {
    if (!profile) return null;
    return calculateScores(filteredQuestions, dilemmas, answers, profile.level);
  }, [filteredQuestions, answers, profile]);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background-dark text-white selection:bg-primary selection:text-white">
      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-surface-darker/80 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center text-primary bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">Radar de Liderança 360º</h2>
          </div>
          <div className="flex items-center gap-4">
             {profile && (
                 <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        {profile.is360 ? 'Avaliando:' : 'Líder:'}
                    </span>
                    <span className="text-sm font-bold">
                        {profile.is360 ? profile.targetLeaderName : profile.name}
                    </span>
                 </div>
             )}
            <div className="h-8 w-[1px] bg-gray-700 hidden sm:block"></div>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
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
                is360={profile?.is360}
            />
        )}
        {step === 'results' && profile && scores && (
            <Results 
              results={scores} 
              profile={{
                  ...profile,
                  name: profile.is360 ? (profile.targetLeaderName || profile.name) : profile.name // Ensure results show target name in 360
              }}
              textAnswers={textAnswers} 
              answers={answers} // Pass raw answers to check dilemmas
              dilemmas={dilemmas} // Pass dilemmas definition
              totalTime={totalTime} // Pass total time taken
              onRestart={handleRestart} 
            />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-6 mt-auto border-t border-gray-800 bg-surface-darker">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            © 2024 Radar de Liderança 360º. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;