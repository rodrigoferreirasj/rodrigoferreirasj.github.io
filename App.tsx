import React, { useState, useMemo, useEffect } from 'react';
import Welcome from './components/Welcome';
import PersonalInfo from './components/PersonalInfo';
import Assessment from './components/Assessment';
import Results from './components/Results';
import HelpModal from './components/HelpModal';
import Login from './components/Login';
import { LeadershipLevel, UserProfile, Answers, Question, TextAnswers, SpeedAnalysis, ScoreResult } from './types';
import { questions as allQuestions } from './data/questions';
import { dilemmas } from './data/dilemmas';
import { calculateScores } from './services/scoringService';
import emailjs from '@emailjs/browser';

type Step = 'welcome' | 'login' | 'info' | 'assessment' | 'results';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [step, setStep] = useState<Step>('welcome');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [totalTime, setTotalTime] = useState<number>(0);
  const [speedAnalysis, setSpeedAnalysis] = useState<SpeedAnalysis>({ 
    instinctive: 0, 
    natural: 0, 
    reflexive: 0 
  });
  const [results, setResults] = useState<ScoreResult | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (!profile) return [];
    return allQuestions.filter(q => q.level === LeadershipLevel.Comum || q.level === profile.level);
  }, [profile]);

  const sendResultsEmail = async (
    currentProfile: UserProfile, 
    currentResults: ScoreResult, 
    currentAnswers: Answers, 
    currentTextAnswers: TextAnswers,
    currentTotalTime: number
  ) => {
    const SERVICE_ID = 'service_jmkr2dn'; 
    const TEMPLATE_ID = 'assessment_template';
    const PUBLIC_KEY = 'dh8MnuS1CHuhkCk4X';

    const horizonLabels: Record<number, string> = { 0: 'Imediato', 1: 'Curto Prazo', 2: 'Médio Prazo', 3: 'Longo Prazo', 4: 'Transformador' };
    const horizonColors: Record<number, string> = { 0: '#4b5563', 1: '#3b82f6', 2: '#10b981', 3: '#8b5cf6', 4: '#eab308' };

    const getMatrixPos = (v: number) => {
      if (v < 2.5) return (v / 2.5) * 50; 
      if (v < 4.0) return 50 + ((v - 2.5) / 1.5) * 30; 
      return 80 + ((v - 4.0) / 1.0) * 20; 
    };

    const matrixX = getMatrixPos(currentResults.matrix.x);
    const matrixY = getMatrixPos(currentResults.matrix.y);

    // Checklist Calculations Mirror
    const getChecklistScoreInternal = (qIds: number[]) => {
      let sum = 0;
      let count = 0;
      qIds.forEach(id => {
        const val = currentAnswers[id];
        if (val !== undefined && val !== null) {
          const q = allQuestions.find(q => q.id === id);
          const normalizedVal = q?.inverted ? 6 - val : val;
          sum += normalizedVal;
          count++;
        }
      });
      return count > 0 ? sum / count : 0;
    };

    const checklistData = [
      {
        category: 'Autonomia & Pessoas',
        items: [
          { text: 'Onboarding cria autonomia real desde o início', score: getChecklistScoreInternal([56]) },
          { text: 'Sei exatamente o que cada pessoa pode decidir sozinha', score: getChecklistScoreInternal([103]) },
          { text: 'Delego decisões, não só tarefas', score: getChecklistScoreInternal([103, 228]) },
          { text: 'Tenho um mapa claro das capacidades do time', score: getChecklistScoreInternal([53]) },
          { text: 'Existe um marco explícito de transferência de responsabilidade', score: getChecklistScoreInternal([241]) },
        ]
      },
      {
        category: 'Estilo de Liderança',
        items: [
          { text: 'Ajusto meu estilo à maturidade da pessoa para a tarefa', score: getChecklistScoreInternal([7, 54]) },
          { text: 'Reduzi controle do “como” e aumentei clareza do “resultado”', score: getChecklistScoreInternal([242]) },
          { text: 'Ensino critérios de decisão, não apenas instruções', score: getChecklistScoreInternal([244]) },
          { text: 'Pratico micro-liderança no fluxo do trabalho', score: getChecklistScoreInternal([73]) },
        ]
      },
      {
        category: 'Trabalho & Sistema',
        items: [
          { text: 'Papéis e responsabilidades estão claros', score: getChecklistScoreInternal([9, 21]) },
          { text: 'Existem critérios explícitos de “bom o suficiente”', score: getChecklistScoreInternal([242]) },
          { text: 'Tenho limites claros de WIP (trabalho em andamento)', score: getChecklistScoreInternal([243]) },
          { text: 'Priorizo de verdade (nem tudo é urgente)', score: getChecklistScoreInternal([15]) },
          { text: 'Decidimos conscientemente o que não será feito', score: getChecklistScoreInternal([15, 29]) },
        ]
      },
      {
        category: 'Agenda & Energia do Líder',
        items: [
          { text: 'Reduzi a latência das decisões', score: getChecklistScoreInternal([16, 122]) },
          { text: 'Reuniões têm função clara (decidir, alinhar ou encerrar)', score: getChecklistScoreInternal([20]) },
          { text: 'Uso dados simples para soltar controle', score: getChecklistScoreInternal([245]) },
          { text: 'A tecnologia reduz dependência de mim', score: getChecklistScoreInternal([93]) },
          { text: 'Não centralizo emocionalmente o time em mim', score: getChecklistScoreInternal([247]) },
        ]
      },
      {
        category: 'Desenvolvimento que Gera Tempo',
        items: [
          { text: 'Feedback é contínuo e leve', score: getChecklistScoreInternal([2, 55]) },
          { text: 'Aplico o mínimo viável que gera alavancagem', score: getChecklistScoreInternal([46]) },
          { text: 'Construo ciclos pequenos e consistentes de ganho de tempo', score: getChecklistScoreInternal([246]) },
        ]
      }
    ];

    const allChecklistItems = checklistData.flatMap(d => d.items);
    const controlGaps = allChecklistItems.filter(i => i.score < 3.0);
    const leverageWins = allChecklistItems.filter(i => i.score >= 4.0);
    const priorityFixes = [...allChecklistItems].sort((a, b) => a.score - b.score).slice(0, 3);

    const checklistDiagnosticText = `
      Com base nos dados, a perda de tempo ocorre principalmente em: ${controlGaps.length > 0 ? controlGaps.map(g => g.text).slice(0, 2).join(' e ') : 'baixo impacto imediato'}. 
      Gera alavancagem em: ${leverageWins.length > 0 ? leverageWins.map(w => w.text).slice(0, 1).join('') : 'rituais básicos'}. 
      Prioridades de ajuste: ${priorityFixes.map(f => f.text).join(', ')}.
    `.trim();

    const exportData = {
      profile: currentProfile,
      timestamp: new Date().toISOString(),
      totalTime: currentTotalTime,
      results: currentResults,
      processedDatasets: {
        temporalData: [0, 1, 2, 3, 4].map(h => ({
          name: `H${h}`,
          label: horizonLabels[h],
          leader: currentResults.horizons[h] || 0
        })),
        needsData: Object.entries(currentResults.needs).map(([name, res]) => ({ 
          name, 
          score: res.score, 
          horizon: res.horizon, 
          fill: horizonColors[res.horizon]
        })),
        skillsData: Object.entries(currentResults.skills).map(([name, res]) => ({ 
          name, 
          score: res.score, 
          horizon: res.horizon, 
          fill: horizonColors[res.horizon]
        })),
        blocksData: Object.entries(currentResults.blocks).map(([name, res]) => ({
          name,
          score: res.score,
          horizon: res.horizon,
          fill: horizonColors[res.horizon]
        })),
        categoriesData: Object.entries(currentResults.categories).map(([name, res]) => ({
          name,
          score: res.score,
          horizon: res.horizon,
          fill: horizonColors[res.horizon]
        })).sort((a, b) => b.score - a.score),
        matrix: {
          x: currentResults.matrix.x,
          y: currentResults.matrix.y,
          matrixX,
          matrixY
        }
      },
      checklist: { data: checklistData, diagnosticText: checklistDiagnosticText },
      textAnswers: currentTextAnswers
    };

    const summaryBlock = `
* MATURIDADE GERAL: ${currentResults.total}%
* STATUS: ${currentResults.consistency.status}
* CONSISTÊNCIA COMPORTAMENTAL: ${currentResults.behavioralConsistency.status} (${currentResults.behavioralConsistency.score}%)
* HORIZONTE DOMINANTE: H${currentResults.predominantHorizon}
* TEMPO TOTAL: ${Math.floor(currentTotalTime / 60)}m ${currentResults.total % 60}s
* PAPÉIS:
  - Líder: ${currentResults.roles['Líder']?.score.toFixed(2)}
  - Gestor: ${currentResults.roles['Gestor']?.score.toFixed(2)}
  - Estrategista: ${currentResults.roles['Estrategista']?.score.toFixed(2)}
  - Intraempreendedor: ${currentResults.roles['Intraempreendedor']?.score.toFixed(2)}

* DIAGNÓSTICO LÍDER SEM TEMPO:
  ${checklistDiagnosticText}
    `.trim();

    const templateParams = {
      user_origem: 'Radar Liderança 360',
      user_name: currentProfile.name,
      user_position: currentProfile.role,
      user_company: currentProfile.company,
      user_email: currentProfile.email,
      user_whatsapp: currentProfile.whatsapp,
      assessment_name: currentProfile.is360 ? `Avaliação 360 (Alvo: ${currentProfile.targetLeaderName})` : 'Autoavaliação de Liderança',
      timestamp: new Date().toLocaleString('pt-BR'),
      assessment_summary_block: summaryBlock,
      assessment_details_block: JSON.stringify(exportData, null, 2),
      assessment_tags: `Nível: ${currentProfile.level}, Status: ${currentResults.consistency.status}, Perfil: ${currentProfile.is360 ? '360' : 'Self'}`
    };

    try {
      const response = await emailjs.send(
        SERVICE_ID, 
        TEMPLATE_ID, 
        templateParams,
        PUBLIC_KEY
      );
      console.log('E-mail de diagnóstico enviado com sucesso:', response.status, response.text);
    } catch (error: any) {
      const errorMsg = error?.text || error?.message || JSON.stringify(error);
      console.error('Falha crítica no envio do e-mail:', errorMsg);
    }
  };

  const handleAssessmentComplete = (
    finalAnswers: Answers, 
    finalTextAnswers: TextAnswers, 
    finalTime: number, 
    finalSpeed: SpeedAnalysis
  ) => {
    if (!profile) return;

    const calculated = calculateScores(filteredQuestions, dilemmas, finalAnswers, profile.level, finalSpeed);
    
    setAnswers(finalAnswers);
    setTextAnswers(finalTextAnswers);
    setTotalTime(finalTime);
    setSpeedAnalysis(finalSpeed);
    setResults(calculated);
    
    sendResultsEmail(profile, calculated, finalAnswers, finalTextAnswers, finalTime);
    
    setStep('results');
  };

  const handleRestart = () => {
    localStorage.clear();
    setProfile(null);
    setAnswers({});
    setTextAnswers({});
    setResults(null);
    setStep('welcome');
    // Mantenha autenticado se já logou uma vez nesta sessão, para não pedir login de novo no restart
  };

  const handleStart = () => {
    if (isAuthenticated) {
      setStep('info');
    } else {
      setStep('login');
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setStep('info');
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background-dark text-white">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-surface-darker/80 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">radar</span>
            <h2 className="text-white text-lg font-bold tracking-tight uppercase">Radar Liderança 360</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsHelpOpen(true)} className="text-slate-400 hover:text-white text-sm font-bold">AJUDA</button>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-start p-4">
        {step === 'welcome' && <Welcome onStart={handleStart} />}
        {step === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
        {step === 'info' && <PersonalInfo onComplete={(p) => { setProfile(p); setStep('assessment'); }} onBack={() => setStep('welcome')} />}
        {step === 'assessment' && profile && (
          <Assessment 
            questions={filteredQuestions} 
            dilemmas={dilemmas} 
            onComplete={handleAssessmentComplete} 
            onBack={() => setStep('info')} 
            is360={profile.is360} 
          />
        )}
        {step === 'results' && results && profile && (
            <Results 
              results={results} 
              profile={profile} 
              textAnswers={textAnswers} 
              answers={answers} 
              dilemmas={dilemmas} 
              totalTime={totalTime} 
              onRestart={handleRestart} 
            />
        )}
      </main>
    </div>
  );
};

export default App;