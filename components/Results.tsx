
import React, { useRef, useState, useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Scatter, ZAxis, Cell, ScatterChart, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, LineChart, Line, LabelList, Legend, Area, ComposedChart } from 'recharts';
import { ScoreResult, UserProfile, LeadershipLevel, TextAnswers, GallupResult, RoleResult, Question, CategoryValidation } from '../types';
import { descriptiveQuestions } from '../data/descriptive';
import { questions as allQuestions } from '../data/questions';
import { dilemmas as allDilemmas } from '../data/dilemmas';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  results: ScoreResult;
  profile: UserProfile;
  textAnswers: TextAnswers;
  answers: Record<string | number, number | null>;
  dilemmas: any;
  totalTime?: number;
  onRestart: () => void;
}

const Results: React.FC<Props> = ({ results, profile, textAnswers, onRestart, totalTime, answers }) => {
  const { roles, horizons, predominantHorizon, needs, skills, blocks, categories, omissionAnalysis, speedAnalysis, consistency, behavioralConsistency, matrix } = results;
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreviewPdfMode, setIsPreviewPdfMode] = useState(false);
  
  const horizonColors: Record<number, string> = { 0: '#4b5563', 1: '#3b82f6', 2: '#10b981', 3: '#8b5cf6', 4: '#eab308' };
  const horizonLabels: Record<number, string> = { 0: 'Imediato', 1: 'Curto Prazo', 2: 'Médio Prazo', 3: 'Longo Prazo', 4: 'Transformador' };
  const levelLabels: Record<string, string> = { 
    'L1': 'Líder de Si (Operação)', 
    'L2': 'Líder de Outros (Equipes)', 
    'L3': 'Líder de Líderes (Estratégico)',
    'Comum': 'Liderança Geral'
  };

  const idealCurves: Record<string, Record<number, number>> = {
    [LeadershipLevel.L1]: { 0: 4.5, 1: 4.0, 2: 2.5, 3: 1.5, 4: 1.0 },
    [LeadershipLevel.L2]: { 0: 3.0, 1: 4.5, 2: 4.0, 3: 2.5, 4: 1.5 },
    [LeadershipLevel.L3]: { 0: 2.0, 1: 3.5, 2: 4.5, 3: 4.0, 4: 3.0 },
    [LeadershipLevel.Comum]: { 0: 3.0, 1: 4.0, 2: 4.0, 3: 3.0, 4: 2.0 },
  };
  
  const formatTotalTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMatrixPos = (v: number) => {
    if (v < 2.5) return (v / 2.5) * 50; 
    if (v < 4.0) return 50 + ((v - 2.5) / 1.5) * 30; 
    return 80 + ((v - 4.0) / 1.0) * 20; 
  };
  const matrixX = getMatrixPos(matrix.x);
  const matrixY = getMatrixPos(matrix.y);

  const rolesList = ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'];

  const scatterData = useMemo(() => {
    const data: any[] = [];
    rolesList.forEach((roleName) => {
        const roleData = roles[roleName];
        if (!roleData) return;
        
        let maxVal = -1;
        let domH = 0;
        (Object.entries(roleData.horizons) as [string, number][]).forEach(([h, s]) => {
            if (s > maxVal) { maxVal = s; domH = Number(h); }
        });

        data.push({
            role: roleName,
            score: roleData.score,
            size: 800,
            fill: horizonColors[domH],
            type: 'Média Geral',
            label: 'Média'
        });

        (Object.entries(roleData.horizons) as [string, number][]).forEach(([h, s]) => {
            data.push({
                role: roleName,
                score: s,
                size: 150,
                fill: horizonColors[Number(h)],
                type: `H${h}`,
                label: `H${h}`
            });
        });
    });
    return data;
  }, [roles]);

  const needsData = (Object.entries(needs) as [string, GallupResult][]).map(([name, res]) => ({ 
    name, 
    score: res.score, 
    horizon: res.horizon, 
    fill: horizonColors[res.horizon],
    displayLabel: `${res.score.toFixed(2)} | H${res.horizon}`
  }));

  const skillsData = (Object.entries(skills) as [string, GallupResult][]).map(([name, res]) => ({ 
    name, 
    score: res.score, 
    horizon: res.horizon, 
    fill: horizonColors[res.horizon],
    displayLabel: `${res.score.toFixed(2)} | H${res.horizon}`
  }));

  const blocksData = useMemo(() => {
    return (Object.entries(blocks || {}) as [string, { score: number; horizon: number }][]).map(([name, res]) => ({
      name,
      score: res.score,
      horizon: res.horizon,
      fill: horizonColors[res.horizon],
      displayLabel: `${res.score.toFixed(2)} | H${res.horizon}`
    }));
  }, [blocks]);

  const topBlocks = useMemo(() => {
    return [...blocksData].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [blocksData]);

  const bottomBlocks = useMemo(() => {
    return [...blocksData].sort((a, b) => a.score - b.score).slice(0, 3);
  }, [blocksData]);

  const categoriesData = useMemo(() => {
    return (Object.entries(categories || {}) as [string, GallupResult][])
      .map(([name, res]) => ({
        name,
        score: res.score,
        horizon: res.horizon,
        fill: horizonColors[res.horizon],
        displayLabel: `${res.score.toFixed(2)} | H${res.horizon}`
      }))
      .sort((a, b) => b.score - a.score);
  }, [categories]);

  const temporalData = useMemo(() => {
    const ideal = idealCurves[profile.level] || idealCurves[LeadershipLevel.Comum];
    return [0, 1, 2, 3, 4].map(h => ({
      name: `H${h}`,
      label: horizonLabels[h],
      leader: horizons[h] || 0,
      ideal: ideal[h] || 0
    }));
  }, [horizons, profile.level]);

  const generateExportData = () => {
    return {
      profile,
      timestamp: new Date().toISOString(),
      totalTime,
      results,
      processedDatasets: {
        temporalData,
        scatterData,
        needsData,
        skillsData,
        blocksData,
        categoriesData,
        matrix: {
          x: matrix.x,
          y: matrix.y,
          matrixX,
          matrixY
        }
      },
      textAnswers
    };
  };

  const handleDownloadJSON = () => {
    const exportData = generateExportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dados_Assessment_${profile.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return; 
    setIsGeneratingPdf(true);
    
    const wasPreviewMode = isPreviewPdfMode;
    setIsPreviewPdfMode(true);
    
    window.scrollTo(0, 0);

    setTimeout(async () => {
      try {
        const container = printRef.current!;
        const canvas = await html2canvas(container, { 
          scale: 2, 
          backgroundColor: '#ffffff', 
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollY: -window.scrollY,
          height: container.scrollHeight,
          windowHeight: container.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        const finalPdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, pdfHeight + 20]
        });
        
        finalPdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight);
        finalPdf.save(`Relatorio_Lideranca_${profile.name.replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error("PDF Generation Error:", err);
      } finally { 
        setIsGeneratingPdf(false); 
        if (!wasPreviewMode) setIsPreviewPdfMode(false);
      }
    }, 500);
  };

  const icdTotal = Math.max(1, speedAnalysis.instinctive + speedAnalysis.natural + speedAnalysis.reflexive);

  const getConsistencyMessage = (stdDev: number) => {
    if (stdDev < 0.6) {
        return {
            title: "Alta Integração Funcional",
            message: "Seu perfil é altamente integrado. Você consegue transitar entre os quatro papéis com fluidez, garantindo que a execução técnica não perca a visão estratégica e vice-versa.",
            color: "text-accent-green",
            bg: "bg-accent-green/10",
            border: "border-accent-green/20"
        };
    } else if (stdDev < 1.2) {
        return {
            title: "Versatilidade Equilibrada",
            message: "Você demonstra versatilidade. Embora tenha papéis de preferência clara, mantém um nível saudável de entrega em todas as frentes de liderança sem negligenciar áreas críticas.",
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20"
        };
    } else {
        return {
            title: "Especialização Acentuada",
            message: "Seu perfil é altamente especializado. Existe uma discrepância significativa entre seus papéis mais fortes e os mais frágeis, o que pode gerar 'pontos cegos' na sua gestão diária.",
            color: "text-accent-yellow",
            bg: "bg-accent-yellow/10",
            border: "border-accent-yellow/20"
        };
    }
  };

  const consistencyInfo = getConsistencyMessage(consistency.stdDev);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-12 animate-fade-in space-y-16 text-white">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface-dark p-6 rounded-3xl border border-white/10 shadow-xl no-pdf">
          <div className="flex items-center gap-4">
              <button 
                  onClick={() => setIsPreviewPdfMode(!isPreviewPdfMode)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isPreviewPdfMode ? 'bg-accent-yellow text-black' : 'bg-white/5 text-white border border-white/10'}`}
              >
                  <span className="material-symbols-outlined">{isPreviewPdfMode ? 'visibility_off' : 'visibility'}</span>
                  {isPreviewPdfMode ? 'Desativar modo de impressão' : 'Visualizar modo de impressão'}
              </button>
          </div>

          <div className="flex gap-4">
              <button onClick={handleDownloadJSON} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-black uppercase text-xs rounded-2xl hover:text-white hover:border-primary transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">code</span>
                  Baixar JSON
              </button>
              <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-black uppercase text-xs rounded-2xl shadow-xl flex items-center gap-2 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">download</span>
                  {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
              </button>
          </div>
      </div>

      <div ref={printRef} className={`space-y-12 transition-all duration-500 overflow-visible ${isPreviewPdfMode ? 'pdf-export-mode' : 'bg-background-dark p-4 md:p-8'}`}>
          {/* BOX EXECUTIVO */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                  <div className="shrink-0 text-center lg:text-left">
                      <span className="text-8xl md:text-[10rem] font-black text-primary tracking-tighter block leading-none">
                          {results.total}%
                      </span>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mt-3 block">Maturidade Geral</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
                      <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Líder Avaliado</span>
                          <span className="text-2xl font-bold text-white block leading-tight">{profile.name}</span>
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Nível de Liderança</span>
                          <span className="text-2xl font-bold text-white block leading-tight">{levelLabels[profile.level] || profile.level}</span>
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Horizonte Dominante</span>
                          <div className="flex items-center gap-3">
                              <div className="size-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: horizonColors[predominantHorizon] }}></div>
                              <span className="text-2xl font-bold text-white block leading-tight">H{predominantHorizon} — {horizonLabels[predominantHorizon]}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="h-px w-full bg-white/5"></div>

              <div className="space-y-6">
                  <div className="space-y-1">
                      <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em] block">Status do Perfil</span>
                      <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter uppercase italic text-white/90">
                          {consistency.status}
                      </h1>
                  </div>
                  
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 shadow-inner max-w-4xl">
                      <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed italic">
                          "{consistency.message}"
                      </p>
                  </div>
              </div>
          </div>

          {/* BOX PRONTIDÃO E CONVICÇÃO */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Prontidão e Convicção</h3>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                      <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tempo Total:</span>
                      <span className="text-sm font-black text-white">{formatTotalTime(totalTime || 0)}</span>
                  </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-4 flex flex-col items-center justify-center border-r border-white/5 pr-0 lg:pr-12">
                      <div className="relative size-56 flex items-center justify-center">
                          <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                              <path className="text-primary" strokeDasharray={`${omissionAnalysis.readinessIndex}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                              <span className="text-6xl font-black">{omissionAnalysis.readinessIndex}%</span>
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Prontidão</span>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-8 flex flex-col justify-center gap-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-label">Instintivo</span>
                                  <span className="text-2xl font-black text-value">{Math.round((speedAnalysis.instinctive/icdTotal)*100)}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${(speedAnalysis.instinctive/icdTotal)*100}%` }}></div>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-label">Natural</span>
                                  <span className="text-2xl font-black text-value">{Math.round((speedAnalysis.natural/icdTotal)*100)}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-accent-green" style={{ width: `${(speedAnalysis.natural/icdTotal)*100}%` }}></div>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <div className="flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-label">Reflexivo</span>
                                  <span className="text-2xl font-black text-value">{Math.round((speedAnalysis.reflexive/icdTotal)*100)}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-accent-purple" style={{ width: `${(speedAnalysis.reflexive/icdTotal)*100}%` }}></div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 mt-4">
                          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
                              O <strong className="text-primary uppercase">Índice de Convicção (ICD)</strong> mede o tempo de resposta em relação ao tempo limite, indicando o nível de prontidão e segurança nas escolhas. O percentual <strong className="text-primary italic">Instintivo</strong> reflete comportamentos já automatizados; o <strong className="text-accent-green italic">Natural</strong> indica decisões conscientes e confortáveis; e o <strong className="text-accent-purple italic">Reflexivo</strong> aponta para situações que exigiram maior esforço cognitivo ou geraram dúvida.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* MATRIZ PESSOAS X RESULTADOS */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <h3 className="text-3xl font-black uppercase tracking-tight italic">Matriz Pessoas x Resultados</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="-rotate-90 origin-center shrink-0 w-8">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em]">Resultados</span>
                  </div>

                  <div className="relative flex-1 w-full aspect-[21/9] bg-surface-darker/50 border-2 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-inner group">
                      <div className="absolute inset-0 grid grid-cols-[2.5fr_1.5fr_1fr] grid-rows-[1fr_1.5fr_2.5fr] pointer-events-none">
                          <div className="bg-green-400/10 border-r border-b border-white/5"></div>
                          <div className="bg-green-600/15 border-r border-b border-white/5"></div>
                          <div className="bg-emerald-500/25 border-b border-white/5"></div>
                          <div className="bg-orange-500/10 border-r border-b border-white/5"></div>
                          <div className="bg-yellow-500/10 border-r border-b border-white/5"></div>
                          <div className="bg-lime-500/15 border-b border-white/5"></div>
                          <div className="bg-red-900/30 border-r border-white/5"></div>
                          <div className="bg-red-700/20 border-r border-white/5"></div>
                          <div className="bg-orange-800/20"></div>
                      </div>

                      <div className="absolute inset-0 grid grid-cols-[2.5fr_1.5fr_1fr] grid-rows-[1fr_1.5fr_2.5fr] w-full h-full p-8 md:p-12 pointer-events-none text-[9px] md:text-[11px] font-black uppercase text-slate-400">
                          <div className="flex items-start justify-start opacity-60">Inspirador</div>
                          <div className="flex items-start justify-center opacity-60">Construtor</div>
                          <div className="flex items-start justify-end opacity-60 text-accent-yellow">Completo</div>
                          <div className="flex items-center justify-start opacity-60">Relacional</div>
                          <div className="flex items-center justify-center opacity-60">Equilibrado</div>
                          <div className="flex items-center justify-end opacity-60">Estratégico</div>
                          <div className="flex items-end justify-start opacity-60">Técnico</div>
                          <div className="flex items-end justify-center opacity-60">Executor</div>
                          <div className="flex items-end justify-end opacity-60">Demandante</div>
                      </div>

                      <div className="absolute size-12 md:size-16 rounded-full border-[3px] md:border-[5px] border-white shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20 flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-1000" 
                           style={{ 
                               left: `${matrixX}%`, 
                               bottom: `${matrixY}%`, 
                               backgroundColor: horizonColors[predominantHorizon],
                               boxShadow: `0 0 20px ${horizonColors[predominantHorizon]}66`
                           }}>
                          <span className="text-white text-[10px] md:text-xs font-black leading-none uppercase">H{predominantHorizon}</span>
                      </div>
                  </div>
              </div>

              <div className="w-full space-y-6">
                  <div className="flex justify-center">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em]">Pessoas</span>
                  </div>
                  <div className="flex justify-center gap-8 py-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner max-w-lg mx-auto">
                      <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Score Pessoas</span>
                          <span className="text-2xl font-black text-primary">{matrix.x.toFixed(2)}</span>
                      </div>
                      <div className="h-10 w-px bg-white/10 self-center"></div>
                      <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Score Resultados</span>
                          <span className="text-2xl font-black text-accent-green">{matrix.y.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* OS 4 PAPÉIS */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <h3 className="text-3xl font-black uppercase tracking-tight italic">Os 4 Papéis da Liderança</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <div className="w-full">
                      <div className="h-[450px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" vertical={false} />
                                  <XAxis dataKey="role" type="category" allowDuplicatedCategory={false} tick={{ fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 10, fontStyle: 'italic', fontWeight: 900 }} />
                                  <YAxis type="number" dataKey="score" domain={[0, 5]} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                                  <Tooltip 
                                      cursor={{ strokeDasharray: '3 3' }} 
                                      content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                              const data = payload[0].payload;
                                              return (
                                                  <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl text-white">
                                                      <p className="text-[10px] font-black uppercase text-primary mb-1">{data.role}</p>
                                                      <p className="text-xs font-bold">{data.type}: <span className="text-primary">{data.score.toFixed(2)}</span></p>
                                                  </div>
                                              );
                                          }
                                          return null;
                                      }}
                                  />
                                  <ZAxis type="number" dataKey="size" range={[50, 800]} />
                                  <Scatter data={scatterData}>
                                      {scatterData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.type === 'Média Geral' ? (isPreviewPdfMode ? '#000' : '#fff') : 'transparent'} strokeWidth={entry.type === 'Média Geral' ? 2 : 0} />
                                      ))}
                                  </Scatter>
                              </ScatterChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="space-y-8">
                      <div className="bg-surface-darker/50 rounded-3xl border border-white/5 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-white/5 text-[9px] font-black uppercase text-slate-500 tracking-widest border-b border-white/5">
                                      <th className="py-5 px-6">Papel Liderança</th>
                                      <th className="py-5 px-3 text-center">H0</th>
                                      <th className="py-5 px-3 text-center">H1</th>
                                      <th className="py-5 px-3 text-center">H2</th>
                                      <th className="py-5 px-3 text-center">H3</th>
                                      <th className="py-5 px-3 text-center text-accent-yellow">H4</th>
                                      <th className="py-5 px-6 text-right text-primary">Média</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {rolesList.map(roleName => {
                                      const r = roles[roleName];
                                      if (!r) return null;
                                      return (
                                          <tr key={roleName} className="hover:bg-white/5 transition-colors group">
                                              <td className="py-5 px-6 font-black text-white group-hover:text-primary transition-colors text-cell">{roleName}</td>
                                              <td className="py-5 px-3 text-center text-slate-400 font-mono text-sm">{r.horizons[0]?.toFixed(1)}</td>
                                              <td className="py-5 px-3 text-center text-slate-400 font-mono text-sm">{r.horizons[1]?.toFixed(1)}</td>
                                              <td className="py-5 px-3 text-center text-slate-400 font-mono text-sm">{r.horizons[2]?.toFixed(1)}</td>
                                              <td className="py-5 px-3 text-center text-slate-400 font-mono text-sm">{r.horizons[3]?.toFixed(1)}</td>
                                              <td className="py-5 px-3 text-center text-accent-yellow/70 font-mono text-sm font-bold">{r.horizons[4]?.toFixed(1)}</td>
                                              <td className="py-5 px-6 text-right font-black text-primary text-base">{r.score.toFixed(2)}</td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>

                      <div className={`p-8 rounded-[2rem] border ${consistencyInfo.border} ${consistencyInfo.bg} space-y-4 shadow-xl`}>
                          <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined ${consistencyInfo.color}`}>analytics</span>
                              <h4 className={`text-sm font-black uppercase tracking-widest ${consistencyInfo.color}`}>
                                  {consistencyInfo.title}
                              </h4>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed font-medium text-consistency">
                              {consistencyInfo.message}
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* NECESSIDADES E HABILIDADES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-surface-dark border border-white/5 rounded-[3rem] p-12 space-y-10">
                  <h3 className="text-2xl font-black uppercase tracking-widest text-primary italic">Necessidades (Gallup)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={needsData} layout="vertical" margin={{ left: 40, right: 60 }}>
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis type="category" dataKey="name" tick={{fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 12, fontWeight: 900}} width={140} />
                          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={40}>
                              {needsData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              <LabelList dataKey="displayLabel" position="right" fill={isPreviewPdfMode ? '#000' : '#fff'} fontSize={14} fontWeight={900} offset={12} />
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <div className="bg-surface-dark border border-white/5 rounded-[3rem] p-12 space-y-10">
                  <h3 className="text-2xl font-black uppercase tracking-widest text-accent-green italic">Habilidades (Gallup)</h3>
                  <ResponsiveContainer width="100%" height={500}>
                      <BarChart data={skillsData} layout="vertical" margin={{ left: 40, right: 60 }}>
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis type="category" dataKey="name" tick={{fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 12, fontWeight: 900}} width={140} />
                          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={32}>
                              {skillsData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              <LabelList dataKey="displayLabel" position="right" fill={isPreviewPdfMode ? '#000' : '#fff'} fontSize={14} fontWeight={900} offset={12} />
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* POR BLOCO DE COMPETÊNCIA */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <h3 className="text-3xl font-black uppercase tracking-tight italic">Por Bloco de Competência</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8">
                      <ResponsiveContainer width="100%" height={600}>
                          <BarChart data={blocksData} layout="vertical" margin={{ left: 20, right: 80 }}>
                              <XAxis type="number" domain={[0, 5]} hide />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                tick={{fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 10, fontWeight: 900}} 
                                width={180}
                                interval={0}
                              />
                              <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={24}>
                                  {blocksData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                  <LabelList dataKey="displayLabel" position="right" fill={isPreviewPdfMode ? '#000' : '#fff'} fontSize={14} fontWeight={900} offset={15} />
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="bg-surface-darker/50 rounded-3xl border border-accent-green/20 p-8 space-y-6 shadow-xl">
                          <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-accent-green">trending_up</span>
                              <h4 className="text-sm font-black uppercase tracking-widest text-accent-green">Maiores Destaques</h4>
                          </div>
                          <div className="space-y-4">
                              {topBlocks.map((b, i) => (
                                  <div key={i} className="flex flex-col gap-1 p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider truncate" title={b.name}>{b.name}</span>
                                      <div className="flex items-center justify-between">
                                          <span className="text-xl font-black text-value">{b.score.toFixed(2)}</span>
                                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full">
                                              <div className="size-1.5 rounded-full" style={{backgroundColor: b.fill}}></div>
                                              <span className="text-[9px] font-black text-slate-400">H{b.horizon}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-surface-darker/50 rounded-3xl border border-red-500/20 p-8 space-y-6 shadow-xl">
                          <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-red-500">trending_down</span>
                              <h4 className="text-sm font-black uppercase tracking-widest text-red-500">Gaps de Maturidade</h4>
                          </div>
                          <div className="space-y-4">
                              {bottomBlocks.map((b, i) => (
                                  <div key={i} className="flex flex-col gap-1 p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider truncate" title={b.name}>{b.name}</span>
                                      <div className="flex items-center justify-between">
                                          <span className="text-xl font-black text-value">{b.score.toFixed(2)}</span>
                                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full">
                                              <div className="size-1.5 rounded-full" style={{backgroundColor: b.fill}}></div>
                                              <span className="text-[9px] font-black text-slate-400">H{b.horizon}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* MATURIDADE TEMPORAL */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Maturidade Temporal (H0-H4)</h3>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                          <div className="h-0.5 w-6 bg-primary"></div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Curva</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="h-0.5 w-6 bg-white/20 border-t border-dashed"></div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ideal {profile.level}</span>
                      </div>
                  </div>
              </div>

              <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={temporalData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" tick={{fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 12, fontWeight: 900}} axisLine={false} tickLine={false} dy={10} />
                          <YAxis domain={[0, 5]} tick={{fill: '#4b5563', fontSize: 10}} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="ideal" fill={isPreviewPdfMode ? "#d1d5db" : "rgba(255,255,255,0.07)"} stroke="none" name="Área Ideal" className="recharts-area-area" />
                          <Line type="monotone" dataKey="ideal" stroke={isPreviewPdfMode ? "#9ca3af" : "rgba(255,255,255,0.2)"} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: isPreviewPdfMode ? '#9ca3af' : 'rgba(255,255,255,0.2)' }} name="Média Ideal" />
                          <Line type="monotone" dataKey="leader" stroke="#1337ec" strokeWidth={4} dot={{ r: 6, fill: '#1337ec', strokeWidth: 2, stroke: isPreviewPdfMode ? '#000' : '#fff' }} activeDot={{ r: 8 }} name="Sua Nota" />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>

              {/* Legenda detalhada de Horizontes */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-8">
                  {temporalData.map((h, i) => {
                      const tolerance = h.ideal * 0.9;
                      const isAbove = h.leader >= h.ideal;
                      const isWithin = h.leader < h.ideal && h.leader >= tolerance;
                      const isBelow = h.leader < tolerance;

                      let statusColor = 'text-slate-400';
                      let statusIcon = 'trending_flat';
                      let statusBg = 'bg-white/5';
                      let statusLabel = 'Dentro do Ideal';

                      if (isAbove) {
                          statusColor = 'text-accent-green';
                          statusIcon = 'trending_up';
                          statusBg = 'bg-accent-green/10';
                          statusLabel = 'Destaque / Acima';
                      } else if (isBelow) {
                          statusColor = 'text-red-500';
                          statusIcon = 'trending_down';
                          statusBg = 'bg-red-500/10';
                          statusLabel = 'Abaixo do Ideal';
                      } else if (isWithin) {
                          statusColor = 'text-primary';
                          statusIcon = 'trending_flat';
                          statusBg = 'bg-primary/10';
                          statusLabel = 'Dentro do Ideal';
                      }

                      return (
                          <div key={i} className={`p-5 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all ${statusBg}`}>
                              <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">H{i}</span>
                                  <span className={`material-symbols-outlined text-sm ${statusColor}`}>{statusIcon}</span>
                              </div>
                              <div className="space-y-1">
                                  <div className="flex justify-between items-end">
                                      <span className="text-2xl font-black text-white">{h.leader.toFixed(1)}</span>
                                      <span className="text-[10px] font-bold text-slate-500 mb-1">Ideal: {h.ideal.toFixed(1)}</span>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* DETALHAMENTO POR CATEGORIA */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <h3 className="text-3xl font-black uppercase tracking-tight italic">Detalhamento por categoria</h3>
              <div className="w-full">
                  <ResponsiveContainer width="100%" height={categoriesData.length * 40}>
                      <BarChart data={categoriesData} layout="vertical" margin={{ left: 20, right: 80 }}>
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis type="category" dataKey="name" tick={{fill: isPreviewPdfMode ? '#000' : '#fff', fontSize: 10, fontWeight: 900}} width={220} interval={0} />
                          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                              {categoriesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              <LabelList dataKey="displayLabel" position="right" fill={isPreviewPdfMode ? '#000' : '#fff'} fontSize={12} fontWeight={900} offset={12} />
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* BOX CONSISTÊNCIA COMPORTAMENTAL (NOVO) */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center ${behavioralConsistency.status === 'Alta' ? 'bg-accent-green/10 text-accent-green' : behavioralConsistency.status === 'Moderada' ? 'bg-primary/10 text-primary' : 'bg-accent-yellow/10 text-accent-yellow'}`}>
                      <span className="material-symbols-outlined text-3xl">psychology_alt</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Consistência Comportamental</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Índice de Coerência</span>
                      <div className="relative size-40 flex items-center justify-center mb-4">
                          <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path className={behavioralConsistency.status === 'Alta' ? 'text-accent-green' : behavioralConsistency.status === 'Moderada' ? 'text-primary' : 'text-accent-yellow'} strokeDasharray={`${behavioralConsistency.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-4xl font-black">{behavioralConsistency.score}%</span>
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest ${behavioralConsistency.status === 'Alta' ? 'text-accent-green' : behavioralConsistency.status === 'Moderada' ? 'text-primary' : 'text-accent-yellow'}`}>Consistência {behavioralConsistency.status}</span>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                          <h4 className="text-lg font-bold text-white mb-2 uppercase italic">Análise de Percepção vs Ação</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">
                              {behavioralConsistency.message}
                          </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {behavioralConsistency.details.slice(0, 4).map((detail, idx) => (
                           <div key={idx} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate max-w-[150px]">{detail.item}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${detail.diff < 0.75 ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-yellow/10 text-accent-yellow'}`}>
                                  {detail.diff < 0.75 ? 'Consistente' : 'Inconsistente'}
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-600 uppercase">Autoimagem (Escala)</span>
                                  <span className="text-lg font-black text-white">{detail.scaleScore}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-black text-slate-600 uppercase">Ação (Dilemas)</span>
                                  <span className="text-lg font-black text-primary">{detail.scenarioScore}</span>
                                </div>
                              </div>
                           </div>
                        ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* RESPOSTAS DESCRITIVAS */}
          <div className="bg-surface-dark border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12">
              <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">description</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Evidências e Respostas Descritivas</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {descriptiveQuestions.map((q) => (
                      <div key={q.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black uppercase text-primary tracking-widest">{q.theme} — {q.category}</span>
                              <h4 className="text-sm font-bold text-slate-200 leading-snug text-question">{q.text}</h4>
                          </div>
                          <div className="p-5 bg-black/20 rounded-2xl border border-white/5 italic text-sm text-slate-400 leading-relaxed min-h-[100px] text-evidence">
                              {textAnswers[q.id] || "Nenhuma evidência fornecida."}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="flex flex-col gap-12 pb-24 print:hidden items-center">
        <button onClick={onRestart} className="px-14 py-7 bg-surface-dark border-4 border-gray-800 text-white font-black uppercase text-sm rounded-full hover:bg-gray-800 hover:border-primary transition-all active:scale-95 flex items-center gap-3">
            <span className="material-symbols-outlined">restart_alt</span>
            Reiniciar Assessment
        </button>
      </div>
    </div>
  );
};

export default Results;
