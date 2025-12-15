import React, { useState, useMemo, useEffect } from 'react';
import Welcome from './components/Welcome';
import PersonalInfo from './components/PersonalInfo';
import Assessment from './components/Assessment';
import Results from './components/Results';
import HelpModal from './components/HelpModal';
import { LeadershipLevel, UserProfile, Answers, TextAnswers } from './types';
import { questions as allQuestions } from './data/questions';
import { questions360 } from './data/questions360';
import { dilemmas } from './data/dilemmas';
import { calculateScores } from './services/scoringService';

type Step = 'welcome' | 'info' | 'assessment' | 'results';

const App: React.FC = () => {
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

  const [totalTime, setTotalTime] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => { localStorage.setItem('app_step', step); }, [step]);
  useEffect(() => {
    if (profile) localStorage.setItem('app_profile', JSON.stringify(profile));
    else localStorage.removeItem('app_profile');
  }, [profile]);
  useEffect(() => { localStorage.setItem('app_answers', JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem('app_text_answers', JSON.stringify(textAnswers)); }, [textAnswers]);

  const filteredQuestions = useMemo(() => {
    if (!profile) return [];
    if (profile.is360) return questions360;
    return allQuestions.filter(q => q.level === LeadershipLevel.Comum || q.level === profile.level);
  }, [profile]);

  const handleStart = () => setStep('info');

  const handleInfoComplete = (userProfile: UserProfile) => {
    setProfile(userProfile);
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
    setProfile(null);
    setAnswers({});
    setTextAnswers({});
    setTotalTime(0);
    setStep('welcome');
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
    <div className="flex flex-col h-screen">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <header className="app-header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(19, 55, 236, 0.1)', borderRadius: 8, color: 'var(--primary)'}}>
              <span className="material-symbols-outlined">radar</span>
            </div>
            <h2 style={{fontWeight: 'bold', fontSize: '1.1rem'}}>Radar de Liderança 360º</h2>
          </div>
          <div className="flex items-center gap-4">
             {profile && (
                 <div className="hidden lg:flex items-center gap-2">
                    <span className="text-xs text-gray">
                        {profile.is360 ? 'Avaliando:' : 'Líder:'}
                    </span>
                    <span className="text-sm font-bold">
                        {profile.is360 ? profile.targetLeaderName : profile.name}
                    </span>
                 </div>
             )}
            <div style={{height: 20, width: 1, background: '#374151'}}></div>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="btn-outline"
              style={{border: 'none', padding: '0.5rem'}}
            >
              Ajuda
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start relative w-full">
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
                  name: profile.is360 ? (profile.targetLeaderName || profile.name) : profile.name
              }}
              textAnswers={textAnswers} 
              answers={answers} 
              dilemmas={dilemmas} 
              totalTime={totalTime} 
              onRestart={handleRestart} 
            />
        )}
      </main>

      <footer style={{borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', marginTop: 'auto', background: 'var(--bg-surface-darker)'}}>
        <div className="container text-center">
          <p className="text-xs text-gray">
            © 2024 Radar de Liderança 360º. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;