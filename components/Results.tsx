import React, { useRef, useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Scatter, ZAxis, Cell, ReferenceLine, BarChart, Bar, Legend, Area, AreaChart, ScatterChart } from 'recharts';
import { ScoreResult, UserProfile, RoleResult, LeadershipLevel, TextAnswers, BlockResult, Answers, Dilemma, CategoryValidation } from '../types';
import { descriptiveQuestions } from '../data/descriptive';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';

interface Props {
  results: ScoreResult;
  profile: UserProfile;
  textAnswers: TextAnswers;
  answers: Answers; // Need full answers to check dilemmas scores
  dilemmas: Dilemma[]; // Need dilemma info for texts
  totalTime?: number; // Total time taken in seconds
  onRestart: () => void;
}

// Helper: Ideal Curves based on Level
const IDEAL_CURVES: Record<string, number[]> = {
  [LeadershipLevel.L1]: [4.2, 4.0, 3.0, 2.0, 1.5], // Operacional forte
  [LeadershipLevel.L2]: [3.5, 4.0, 4.2, 3.0, 2.0], // Tático/Gestão
  [LeadershipLevel.L3]: [2.0, 3.0, 4.0, 4.5, 3.5], // Estratégico
  [LeadershipLevel.L4]: [1.5, 2.5, 3.5, 4.5, 4.5], // Transformador
  [LeadershipLevel.Comum]: [3,3,3,3,3]
};

// Helper: Category Horizon Mapping
const CATEGORY_HORIZONS: Record<string, number> = {
  'Segurança Psicológica': 0,
  'Feedback & Desenvolvimento Contínuo': 1,
  'Reconhecimento & Motivação': 0,
  'Empatia & Escuta Ativa': 0,
  'Gestão de Conflitos & Conversas Difíceis': 2,
  'Comunicação Clara & Intencional': 1,
  'Cultura & Valores': 3,
  'Autoconsciência & Autogestão Emocional': 1,
  'Planejamento & Organização': 0,
  'Execução & Acompanhamento da Performance': 0,
  'Tomada de Decisão Complexa': 2,
  'Gestão de Performance': 1,
  'Alinhamento & Direção': 3,
  'Pensamento Sistêmico': 3,
  'Gestão de Relacionamentos & Confiança': 2,
  'Adaptação & Aprendizagem Contínua': 2,
  'Inovação & Melhoria Contínua': 1,
  'Aprendizagem Externa & Benchmark': 2,
  'Tomada de Decisão Ética': 4,
  'Liderança de Transformação & Mudança': 4,
  'Delegação & Empowerment': 1
};

const Results: React.FC<Props> = ({ results, profile, textAnswers, answers, dilemmas, totalTime, onRestart }) => {
  const { matrix, roles, horizons, consistency, predominantHorizon, categories, blocks, roleValidation, omissionAnalysis } = results;
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // State to toggle styles for PDF generation (Invert Colors)
  const [printMode, setPrintMode] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // EMAILJS CONFIGURATION
  const EMAILJS_SERVICE_ID = "service_jmkr2dn";
  const EMAILJS_TEMPLATE_ID = "assessment_template";
  const EMAILJS_PUBLIC_KEY = "dh8MnuS1CHuhkCk4X";

  // Formatter for Total Time
  const formatTotalTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // AUTOMATIC EMAIL SENDING EFFECT (OPTION B: HTML SUMMARY)
  useEffect(() => {
    const sendResultsEmail = async () => {
        if (emailStatus !== 'idle') return; // Prevent double sending

        setEmailStatus('sending');

        try {
            // 1. Format Categories String (Papéis + Blocos)
            const rolesText = Object.entries(roles)
                .map(([r, data]) => `   - ${r}: ${(data as RoleResult).score.toFixed(1)}`)
                .join('\n');
            
            const blocksText = Object.entries(blocks)
                .map(([b, data]) => `   - ${b}: ${(data as BlockResult).score.toFixed(1)}`)
                .join('\n');

            const categoriesString = `[PAPÉIS DE LIDERANÇA]\n${rolesText}\n\n[BLOCOS DE COMPETÊNCIA]\n${blocksText}`;

            // 2. Format Feedback String (Quadrante + Consistência)
            const feedbackString = `QUADRANTE: ${matrix.quadrantName} (Pessoas: ${matrix.x} | Resultados: ${matrix.y})\n\nCONSISTÊNCIA: ${consistency.status}\n\nANÁLISE:\n${consistency.message}`;

            // 3. Map to specific template fields
            const templateParams = {
                // Config Fields
                to_email: "rodrigo@pontosfortes.com.br",
                
                // === DADOS DO USUÁRIO ===
                user_name: profile.name,
                user_company: profile.company,
                user_origem: profile.is360 ? "Radar de Liderança 360" : "Radar de Liderança (Auto)",
                user_position: profile.role,
                user_email: profile.email,
                user_whatsapp: profile.whatsapp,

                // === RESULTADOS DO DIAGNÓSTICO ===
                timestamp: new Date().toLocaleString('pt-BR'),
                assessment_version: "v1.0 (Web)",
                assessment_score: `${results.total}/100`,

                // === PONTUAÇÃO POR CATEGORIA ===
                assessment_categories: categoriesString,

                // === FEEDBACK GERADO ===
                assessment_feedback: feedbackString
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID, 
                EMAILJS_TEMPLATE_ID, 
                templateParams, 
                EMAILJS_PUBLIC_KEY
            );

            setEmailStatus('sent');
            console.log("Email enviado com sucesso via EmailJS!");

        } catch (error) {
            console.error("Erro ao enviar email via EmailJS:", error);
            setEmailStatus('error');
        }
    };

    // Trigger automation on mount
    // sendResultsEmail(); // DISABLED TEMPORARILY AS REQUESTED
  }, []); // Empty dependency array = runs once on mount

  // Identify Low Score Dilemmas (Score = 1)
  const lowScoreDilemmas = dilemmas.filter(d => answers[d.id] === 1);

  // Filter Consistent vs Inconsistent Categories
  const consistentCategories = useMemo(() => {
    const details = consistency.categoryDetails || ({} as Record<string, CategoryValidation>);
    return (Object.entries(details) as [string, CategoryValidation][])
        .filter(([_, data]) => data.status === 'Consistent')
        .sort((a, b) => a[0].localeCompare(b[0]));
  }, [consistency.categoryDetails]);

  const inconsistentCategories = useMemo(() => {
    const details = consistency.categoryDetails || ({} as Record<string, CategoryValidation>);
    return (Object.entries(details) as [string, CategoryValidation][])
        .filter(([_, data]) => data.status === 'Inconsistent')
        .sort((a, b) => b[1].stdDev - a[1].stdDev); // Highest standard deviation first
  }, [consistency.categoryDetails]);

  // Horizon Colors
  const horizonColors: Record<number, string> = {
    0: '#4b5563', // Cinza (H0)
    1: '#3b82f6', // Azul (H1)
    2: '#0bda65', // Verde (H2)
    3: '#8b5cf6', // Roxo (H3)
    4: '#eab308'  // Dourado (H4)
  };

  const predominantColor = horizonColors[predominantHorizon];

  // Dynamic Styles based on Print Mode
  const styles = useMemo(() => {
    if (printMode) {
      // Light Mode / PDF Mode
      return {
        bgMain: 'bg-white',
        bgCard: 'bg-white border-gray-300',
        bgSub: 'bg-gray-100',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-300',
        chart: {
          text: '#374151', // Dark Gray
          grid: '#e5e7eb', // Light Gray
          tooltipBg: '#ffffff',
          tooltipText: '#000000',
          tooltipBorder: '#ccc'
        }
      };
    } else {
      // Dark Mode (Default)
      return {
        bgMain: 'bg-background-dark',
        bgCard: 'bg-surface-dark border-gray-800',
        bgSub: 'bg-surface-darker',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-400',
        border: 'border-gray-800',
        chart: {
          text: '#9ca3af', // Light Gray
          grid: '#374151', // Dark Gray
          tooltipBg: '#1f2937',
          tooltipText: '#ffffff',
          tooltipBorder: '#374151'
        }
      };
    }
  }, [printMode]);

  // Data for Horizon Line Chart
  const horizonData = [
    { name: 'H0', score: horizons[0], desc: 'Imediato' },
    { name: 'H1', score: horizons[1], desc: 'Curto' },
    { name: 'H2', score: horizons[2], desc: 'Médio' },
    { name: 'H3', score: horizons[3], desc: 'Longo' },
    { name: 'H4', score: horizons[4], desc: 'Expansão' },
  ];

  const idealCurve = IDEAL_CURVES[profile.level] || IDEAL_CURVES[LeadershipLevel.Comum];

  const comparisonData = horizonData.map((h, i) => ({
    ...h,
    ideal: idealCurve[i]
  }));

  // Role Scatter Data Construction
  const roleNames = ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'];
  const detailedRoleData: any[] = [];
  
  roleNames.forEach((role, idx) => {
      const roleRes = roles[role];
      if(!roleRes) return;

      // 1. Average Point
      detailedRoleData.push({
          roleName: role,
          score: roleRes.score,
          type: 'Average',
          horizon: -1,
          size: 400,
          color: printMode ? '#000000' : '#ffffff', // Black center for PDF
          stroke: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][idx % 4]
      });

      // 2. Horizon Points
      Object.entries(roleRes.horizons).forEach(([h, score]) => {
           detailedRoleData.push({
               roleName: role,
               score: score,
               type: `H${h}`,
               horizon: Number(h),
               size: 100,
               color: horizonColors[Number(h)],
               stroke: 'transparent'
           });
      });
  });

  // Matrix Positioning Logic
  const getMatrixPos = (val: number) => {
    if (val <= 2.5) {
      return (val / 2.5) * 50;
    } else if (val <= 4.0) {
      return 50 + ((val - 2.5) / 1.5) * 30;
    } else {
      return 80 + ((val - 4.0) / 1.0) * 20;
    }
  };

  const matrixX = getMatrixPos(matrix.x);
  const matrixY = getMatrixPos(matrix.y);

  // Calculations for charts
  const categoryChartData = Object.entries(categories).map(([name, score]) => ({
    name: name.length > 25 ? name.substring(0, 25) + '...' : name,
    fullName: name,
    score: score as number,
    horizon: CATEGORY_HORIZONS[name] ?? 1
  })).sort((a, b) => b.score - a.score);

  const blockChartData = Object.entries(blocks).map(([name, data]) => ({
    name,
    score: (data as BlockResult).score,
    horizon: (data as BlockResult).horizon
  })).sort((a, b) => b.score - a.score);

  // SMART PDF DOWNLOAD (ELEMENT-BY-ELEMENT)
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPdf(true);
    // 1. Switch to Light Mode
    setPrintMode(true);

    // Wait for render cycle to update styles (charts need to redraw with new colors)
    setTimeout(async () => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // A4 Size: 210 x 297 mm
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10; // 10mm margin
            const contentWidth = pageWidth - (2 * margin);
            let currentY = margin;

            // Get all top-level sections (children of the main wrapper)
            const sections = Array.from(printRef.current.children) as HTMLElement[];

            for (const section of sections) {
                // Skip if hidden or empty
                if (section.offsetHeight === 0 || section.style.display === 'none') continue;

                // Capture individual section
                const canvas = await html2canvas(section, {
                    scale: 2, 
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

                // Check if we need a page break
                // If currentY + image height exceeds page height (minus bottom margin)
                if (currentY + imgHeight > (pageHeight - margin)) {
                    pdf.addPage();
                    currentY = margin; // Reset to top
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
                
                // Add some spacing after the component
                currentY += imgHeight + 5; 
            }

            pdf.save(`Radar_Lideranca_${profile.name.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            // 2. Revert to Dark Mode
            setPrintMode(false);
            setIsGeneratingPdf(false);
        }
    }, 800); // slightly longer delay to ensure full chart render
  };

  // JSON DOWNLOAD (Replaces CSV)
  const handleDownloadJSON = () => {
      const exportData = {
          metadata: {
              version: "1.0",
              date: new Date().toISOString(),
              app: "Leadership AI Assessment"
          },
          profile,
          results,
          answers: {
              scale: answers,
              text: textAnswers
          }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Resultado_Completo_${profile.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8 animate-fade-in space-y-12 ${printMode ? 'text-gray-900' : 'text-white'}`}>
      
      {/* Email Status Indicator (Overlay or Banner) */}
      {emailStatus === 'sending' && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
              <h2 className="text-xl font-bold">Enviando resultados por e-mail...</h2>
              <p className="text-sm text-gray-400 mt-2">Um resumo será enviado para rodrigo@pontosfortes.com.br</p>
          </div>
      )}
      {emailStatus === 'sent' && (
           <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-slow">
              <span className="material-symbols-outlined">check_circle</span>
              Resumo enviado com sucesso!
           </div>
      )}
      {emailStatus === 'error' && (
           <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              Erro ao enviar email. Tente novamente mais tarde.
           </div>
      )}

      {/* Wrapper ref for PDF generation */}
      <div ref={printRef} className={`space-y-12 p-4 sm:p-8 ${styles.bgMain} transition-colors duration-300`}>

        {/* 1. Header & Score */}
        <div className={`${styles.bgCard} rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between shadow-xl relative overflow-hidden border`}>
          {!printMode && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>}
          <div className="z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${printMode ? 'bg-gray-200 border-gray-300 text-gray-700' : 'bg-surface-darker border-gray-700 text-gray-400'}`}>
                 {profile.level}
               </div>
               <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider`} style={{color: predominantColor, borderColor: predominantColor}}>
                 Horizonte H{predominantHorizon}
               </div>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${styles.textPrimary}`}>
              {profile.name.split(' ')[0]}, você é um <span className={`${printMode ? 'text-primary' : 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400'}`}>Líder {matrix.quadrantName}</span>
            </h1>
            <p className={`text-lg leading-relaxed ${styles.textSecondary}`}>
               Sua análise de consistência aponta um perfil <strong>{consistency.status}</strong>. 
               {consistency.message}
            </p>
          </div>
          <div className={`flex flex-col items-center z-10 p-6 rounded-xl border backdrop-blur-sm min-w-[200px] ${styles.bgSub} ${styles.border}`}>
             <span className={`text-sm uppercase font-bold tracking-widest mb-2 ${styles.textSecondary}`}>Nota Geral</span>
             <span className={`text-6xl font-black ${styles.textPrimary}`}>{results.total}</span>
             <div className="w-full h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-primary" style={{width: `${results.total}%`}}></div>
             </div>
          </div>
        </div>

        {/* DECISION READINESS INDEX (New Card) */}
        <div className={`${styles.bgCard} rounded-xl p-8 border flex flex-col md:flex-row items-center gap-8 shadow-lg relative overflow-hidden`}>
            {/* Index Visual */}
            <div className="relative size-32 md:size-40 flex items-center justify-center">
                <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className={`${omissionAnalysis.readinessIndex > 80 ? 'text-green-500' : omissionAnalysis.readinessIndex > 60 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                        strokeDasharray={`${omissionAnalysis.readinessIndex}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-3xl md:text-4xl font-black ${styles.textPrimary}`}>{omissionAnalysis.readinessIndex}%</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Prontidão</span>
                </div>
            </div>

            {/* Analysis Text */}
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-bold ${styles.textPrimary}`}>Índice de Prontidão Decisória</h3>
                        <div className="group relative cursor-help">
                             <span className="material-symbols-outlined text-gray-500 text-sm">help</span>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                 Mede sua capacidade de tomar decisões sob pressão de tempo (10s). Omissões reduzem este índice.
                             </div>
                        </div>
                    </div>
                    
                    {/* TOTAL TIME DISPLAY */}
                    {totalTime !== undefined && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${printMode ? 'bg-gray-100 border-gray-300' : 'bg-surface-darker border-gray-700'}`}>
                            <span className="material-symbols-outlined text-sm text-primary">timer</span>
                            <span className={`text-sm font-mono font-bold ${styles.textPrimary}`}>
                                Tempo Total: {formatTotalTime(totalTime)}
                            </span>
                        </div>
                    )}
                </div>
                
                <p className={`text-sm leading-relaxed ${styles.textSecondary}`}>
                    {omissionAnalysis.interpretation}
                </p>

                {omissionAnalysis.mainImpactedCategories.length > 0 && (
                    <div className={`p-4 rounded-lg border text-xs ${printMode ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-900/10 border-red-900/30 text-red-300'}`}>
                        <span className="font-bold flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Pontos de Hesitação:
                        </span>
                        Você tendeu a omitir respostas sob pressão nos temas: <span className="font-bold">{omissionAnalysis.mainImpactedCategories.join(', ')}</span>.
                    </div>
                )}
            </div>
        </div>

        {/* 2. The 9-Box Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
              <span className="material-symbols-outlined text-primary">grid_view</span>
              Matriz de Liderança (Pessoas x Resultados)
            </h3>
            
            <div className={`relative aspect-square w-full max-w-[500px] mx-auto border-2 ${printMode ? 'bg-gray-100 border-gray-300' : 'bg-surface-darker border-gray-700'}`}>
              {/* Grid Lines Overlay */}
              <div className={`absolute top-0 bottom-0 border-r border-dashed left-[50%] z-10 ${printMode ? 'border-gray-400' : 'border-gray-600'}`}></div>
              <div className={`absolute top-0 bottom-0 border-r border-dashed left-[80%] z-10 ${printMode ? 'border-gray-400' : 'border-gray-600'}`}></div>
              <div className={`absolute left-0 right-0 border-t border-dashed bottom-[50%] z-10 ${printMode ? 'border-gray-400' : 'border-gray-600'}`}></div>
              <div className={`absolute left-0 right-0 border-t border-dashed bottom-[80%] z-10 ${printMode ? 'border-gray-400' : 'border-gray-600'}`}></div>

              {/* Background Gradients (Red -> Yellow -> Green) - Simplified for Print */}
              <div className={`absolute inset-0 grid grid-cols-10 grid-rows-10 text-[10px] sm:text-xs font-bold uppercase pointer-events-none ${printMode ? 'text-gray-500 opacity-60' : 'text-white/80'}`}>
                  
                  {/* Row 3 (High Results 4.0-5.0) */}
                  <div className={`col-span-5 row-span-2 border-b border-r flex items-center justify-center ${printMode ? 'bg-green-100 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-yellow-600/30 to-green-500/20'}`}>7. Inspirador</div>
                  <div className={`col-span-3 row-span-2 border-b border-r flex items-center justify-center ${printMode ? 'bg-green-200 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-green-600/30 to-green-500/40'}`}>8. Construtor</div>
                  <div className={`col-span-2 row-span-2 border-b flex items-center justify-center ${printMode ? 'bg-green-300 border-gray-300' : 'border-white/5 bg-green-500/50 shadow-inner'}`}>9. Completo</div>

                  {/* Row 2 (Med Results 2.5-4.0) */}
                  <div className={`col-span-5 row-span-3 border-b border-r flex items-center justify-center ${printMode ? 'bg-yellow-100 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-orange-600/30 to-yellow-600/20'}`}>4. Relacional</div>
                  <div className={`col-span-3 row-span-3 border-b border-r flex items-center justify-center ${printMode ? 'bg-yellow-50 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-yellow-600/20 to-green-600/20'}`}>5. Equilibrado</div>
                  <div className={`col-span-2 row-span-3 border-b flex items-center justify-center ${printMode ? 'bg-green-100 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-green-600/20 to-green-500/30'}`}>6. Estratégico</div>

                   {/* Row 1 (Low Results 0-2.5) */}
                  <div className={`col-span-5 row-span-5 border-r flex items-center justify-center ${printMode ? 'bg-red-100 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-red-600/40 to-orange-600/30'}`}>1. Técnico</div>
                  <div className={`col-span-3 row-span-5 border-r flex items-center justify-center ${printMode ? 'bg-orange-100 border-gray-300' : 'border-white/5 bg-gradient-to-tr from-orange-600/30 to-yellow-600/30'}`}>2. Executor</div>
                  <div className={`col-span-2 row-span-5 flex items-center justify-center ${printMode ? 'bg-yellow-100' : 'bg-gradient-to-tr from-yellow-600/20 to-green-600/10'}`}>3. Demandante</div>
              </div>

              {/* The User Dot */}
              <div 
                  className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center group cursor-pointer transition-all duration-1000 ease-out`}
                  style={{ 
                      left: `${matrixX}%`, 
                      bottom: `${matrixY}%`,
                      backgroundColor: predominantColor 
                  }}
              >
                  {!printMode && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                        P:{matrix.x} | R:{matrix.y} (H{predominantHorizon})
                    </div>
                  )}
              </div>
            </div>
            <div className={`flex justify-between mt-4 text-xs font-bold uppercase ${styles.textSecondary}`}>
                <span>Foco em Pessoas</span>
                <span>Foco em Resultados</span>
            </div>
          </div>

          {/* 3. Roles Analysis (UPDATED TO 6 POINTS + TABLE) */}
          <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg flex flex-col`}>
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
              <span className="material-symbols-outlined text-accent-purple">diversity_3</span>
              Os 4 Papéis (Consistência: {consistency.stdDev})
            </h3>
            <p className={`text-xs mb-4 ${styles.textSecondary}`}>
                O gráfico abaixo exibe a Média Geral (ponto maior) e a pontuação por horizonte (H0-H4) para cada papel.
            </p>

            {/* Chart Area */}
            <div className="flex-grow flex flex-col justify-center mb-6">
              <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.chart.grid} vertical={false} />
                  <XAxis type="category" dataKey="roleName" name="Papel" tick={{fill: styles.chart.text, fontSize: 12}} allowDuplicatedCategory={false} />
                  <YAxis type="number" dataKey="score" name="Nota" domain={[0, 6]} tick={{fill: styles.chart.text}} />
                  <ZAxis type="number" dataKey="size" range={[80, 400]} />
                  <Tooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className={`${styles.chart.tooltipBg} border p-2 rounded shadow text-xs`} style={{borderColor: styles.chart.tooltipBorder, color: styles.chart.tooltipText}}>
                                    <p className="font-bold">{data.roleName}</p>
                                    <p>{data.type === 'Average' ? 'Média Geral' : `Horizonte ${data.type}`}: {data.score}</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Scatter name="Pontuação" data={detailedRoleData}>
                    {detailedRoleData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={entry.stroke} 
                        strokeWidth={entry.type === 'Average' ? 3 : 0} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

             {/* Role Validation Alerts */}
             {roleValidation && roleValidation.alerts.length > 0 && (
                <div className={`mb-6 p-4 rounded-lg border ${printMode ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-700/50'}`}>
                    <h4 className="flex items-center gap-2 font-bold text-yellow-600 mb-2 text-sm">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        Atenção: Discrepâncias Identificadas
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                        {roleValidation.alerts.map((alert, idx) => (
                            <li key={idx} className={`text-xs ${styles.textSecondary}`}>
                                {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detailed Data Table */}
            <div className="overflow-x-auto">
                <table className={`w-full text-xs text-left ${styles.textSecondary}`}>
                    <thead className={`text-xs uppercase ${styles.bgSub} ${styles.textPrimary}`}>
                        <tr>
                            <th className="px-3 py-2">Papel</th>
                            <th className={`px-3 py-2 text-center font-bold ${styles.textPrimary}`}>Média</th>
                            <th className="px-3 py-2 text-center text-gray-500">H0</th>
                            <th className="px-3 py-2 text-center text-blue-500">H1</th>
                            <th className="px-3 py-2 text-center text-green-500">H2</th>
                            <th className="px-3 py-2 text-center text-purple-500">H3</th>
                            <th className="px-3 py-2 text-center text-yellow-600">H4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roleNames.map((role, i) => (
                            <tr key={role} className={`border-b ${styles.border}`}>
                                <td className={`px-3 py-2 font-medium ${styles.textPrimary}`}>{role}</td>
                                <td className={`px-3 py-2 text-center font-bold ${styles.textPrimary} ${styles.bgSub}`}>{roles[role]?.score}</td>
                                <td className="px-3 py-2 text-center">{roles[role]?.horizons[0]}</td>
                                <td className="px-3 py-2 text-center">{roles[role]?.horizons[1]}</td>
                                <td className="px-3 py-2 text-center">{roles[role]?.horizons[2]}</td>
                                <td className="px-3 py-2 text-center">{roles[role]?.horizons[3]}</td>
                                <td className="px-3 py-2 text-center">{roles[role]?.horizons[4]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* 4. Recommendations for Low Score Dilemmas (Hidden in 360) */}
        {!profile.is360 && lowScoreDilemmas.length > 0 && (
          <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg border-l-4 border-l-orange-500`}>
             <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
                <span className="material-symbols-outlined text-orange-500">school</span>
                Recomendações de Desenvolvimento (Cenários Críticos)
            </h3>
            <p className={`text-sm mb-6 ${styles.textSecondary}`}>
              Identificamos oportunidades de melhoria baseadas nas suas respostas aos cenários de dilema. 
              Abaixo estão recomendações específicas para fortalecer sua tomada de decisão.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lowScoreDilemmas.map(dilemma => (
                  <div key={dilemma.id} className={`p-5 rounded-lg border flex flex-col gap-3 ${styles.bgSub} ${styles.border}`}>
                      <div className="flex justify-between items-start">
                          <h4 className={`font-bold text-base ${styles.textPrimary}`}>{dilemma.title}</h4>
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded uppercase">Baixa Maturidade</span>
                      </div>
                      <p className={`text-xs italic ${styles.textSecondary}`}>"{dilemma.scenario}"</p>
                      <div className={`h-px my-1 ${printMode ? 'bg-gray-300' : 'bg-gray-700/50'}`}></div>
                      <p className={`text-sm leading-relaxed ${printMode ? 'text-gray-800' : 'text-gray-300'}`}>
                        {dilemma.lowScoreRecommendation || "Recomendação não disponível para este cenário."}
                      </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 5. Blocks (Temas) */}
        <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
                <span className="material-symbols-outlined text-pink-500">category</span>
                Análise por Blocos de Competência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={blockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chart.grid} horizontal={false}/>
                            <XAxis type="number" domain={[0, 5]} tick={{fill: styles.chart.text}} />
                            <YAxis type="category" dataKey="name" width={150} tick={{fill: styles.chart.text, fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{backgroundColor: styles.chart.tooltipBg, borderColor: styles.chart.tooltipBorder, color: styles.chart.tooltipText}}
                            />
                            <Bar dataKey="score" name="Pontuação" radius={[0, 4, 4, 0]}>
                                {blockChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={horizonColors[entry.horizon]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                     <div className={`p-4 rounded-lg border ${styles.bgSub} ${styles.border}`}>
                         <h4 className={`font-bold mb-2 text-sm uppercase ${styles.textPrimary}`}>Legenda de Horizontes</h4>
                         <div className="grid grid-cols-1 gap-2">
                             {Object.entries(horizonColors).map(([h, color]) => (
                                 <div key={h} className="flex items-center gap-2">
                                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></div>
                                     <span className={`text-sm ${styles.textSecondary}`}>H{h} - {horizonData[Number(h)].desc}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                     <div className={`p-4 rounded-lg border flex-grow ${styles.bgSub} ${styles.border}`}>
                         <h4 className={`font-bold mb-2 text-sm uppercase ${styles.textPrimary}`}>Destaque</h4>
                         <p className={`text-sm ${styles.textSecondary}`}>
                             Seu bloco mais forte é <strong>{blockChartData[0]?.name}</strong> com nota <strong>{blockChartData[0]?.score}</strong>.
                             Isso indica uma facilidade natural em lidar com desafios dessa natureza.
                         </p>
                         <div className={`h-px my-3 ${printMode ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
                         <p className={`text-sm ${styles.textSecondary}`}>
                             Atenção para <strong>{blockChartData[blockChartData.length - 1]?.name}</strong> (Nota: {blockChartData[blockChartData.length - 1]?.score}), 
                             que pode representar um gargalo para seu desenvolvimento atual.
                         </p>
                     </div>
                </div>
            </div>
        </div>

        {/* 6. Maturity Comparison (Horizons) - RESTORED TO SINGLE AREA CHART */}
        <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
           <h3 className={`text-xl font-bold mb-2 ${styles.textPrimary}`}>Maturidade Temporal (H0-H4)</h3>
           <p className={`text-sm mb-6 ${styles.textSecondary}`}>Como você distribui sua atenção entre presente, curto, médio e longo prazo</p>
           
           <div className="h-[300px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={styles.chart.grid} />
                      <XAxis dataKey="name" tick={{fill: styles.chart.text}} />
                      <YAxis domain={[0, 5]} tick={{fill: styles.chart.text}} />
                      <Tooltip contentStyle={{backgroundColor: styles.chart.tooltipBg, borderColor: styles.chart.tooltipBorder, color: styles.chart.tooltipText}} />
                      <Area type="monotone" dataKey="ideal" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name={`Curva Ideal ${profile.level}`} />
                      <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" name="Sua Curva" />
                      <Legend wrapperStyle={{ color: styles.chart.text }}/>
                  </AreaChart>
              </ResponsiveContainer>
           </div>

           {/* H Details List */}
           <div className="space-y-4">
               {comparisonData.map((h, i) => {
                   const diff = h.score - h.ideal;
                   const status = diff > 0.5 ? 'Acima do ideal' : diff < -0.5 ? 'Abaixo do ideal' : 'Dentro do ideal';
                   const statusColor = diff > 0.5 ? 'text-blue-500' : diff < -0.5 ? 'text-orange-500' : 'text-green-500';
                   const icon = diff > 0.5 ? 'arrow_upward' : diff < -0.5 ? 'arrow_downward' : 'check';
                   
                   return (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${styles.bgSub} ${styles.border}`}>
                          <div className="flex items-center gap-4">
                              <div className={`size-10 rounded-full flex items-center justify-center font-bold text-white`} style={{backgroundColor: horizonColors[i]}}>
                                  {h.name}
                              </div>
                              <div>
                                  <h4 className={`font-bold text-sm ${styles.textPrimary}`}>{h.desc}</h4>
                                  <div className={`flex items-center gap-1 text-xs mt-1 ${statusColor}`}>
                                      <span className="material-symbols-outlined text-[10px]">{icon}</span>
                                      <span>Ideal: {h.ideal} • {status}</span>
                                  </div>
                              </div>
                          </div>
                          <div className={`text-xl font-bold ${styles.textPrimary}`}>{h.score.toFixed(1)}/5</div>
                      </div>
                   );
               })}
           </div>
        </div>

        {/* 7. Detailed Categories Chart - REPLACED TABLE WITH CHART */}
        <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg overflow-hidden`}>
             <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
                <span className="material-symbols-outlined text-cyan-400">bar_chart</span>
                Detalhamento por Categoria
            </h3>
            <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={categoryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chart.grid} horizontal={false}/>
                        <XAxis type="number" domain={[0, 5]} tick={{fill: styles.chart.text}} />
                        <YAxis type="category" dataKey="name" width={200} tick={{fill: styles.chart.text, fontSize: 11}} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{backgroundColor: styles.chart.tooltipBg, borderColor: styles.chart.tooltipBorder, color: styles.chart.tooltipText}}
                        />
                        <Bar dataKey="score" name="Nota" radius={[0, 4, 4, 0]}>
                            {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={horizonColors[entry.horizon]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* New Section: Consistency Details Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Consistent */}
            <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.textPrimary} text-green-500`}>
                <span className="material-symbols-outlined">check_circle</span>
                Consistência Alta
                </h3>
                <p className={`text-xs mb-4 ${styles.textSecondary}`}>Temas onde suas respostas foram coerentes.</p>
                <div className="flex flex-wrap gap-2">
                {consistentCategories.map(([cat]) => (
                    <span key={cat} className={`px-2 py-1 rounded text-xs border ${printMode ? 'bg-green-50 border-green-200 text-green-800' : 'bg-green-900/20 border-green-800 text-green-400'}`}>
                    {cat}
                    </span>
                ))}
                {consistentCategories.length === 0 && <span className="text-xs text-gray-500">Nenhum item.</span>}
                </div>
            </div>

            {/* Inconsistent */}
            <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.textPrimary} text-orange-500`}>
                <span className="material-symbols-outlined">warning</span>
                Atenção à Consistência
                </h3>
                <p className={`text-xs mb-4 ${styles.textSecondary}`}>Temas com variação significativa nas respostas.</p>
                <div className="space-y-2">
                {inconsistentCategories.map(([cat, data]) => (
                    <div key={cat} className={`flex justify-between items-center p-2 rounded border ${printMode ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/10 border-orange-800/50'}`}>
                    <span className={`text-xs font-medium ${printMode ? 'text-gray-800' : 'text-gray-300'}`}>{cat}</span>
                    <div className="flex items-center gap-1 group relative cursor-help">
                        <span className="text-xs font-bold text-orange-500">SD: {data.stdDev.toFixed(2)}</span>
                        <span className="material-symbols-outlined text-[14px] text-orange-400">help</span>
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Desvio Padrão: Mede a dispersão das suas notas. Alto desvio indica contradição nas respostas do mesmo tema.
                        </div>
                    </div>
                    </div>
                ))}
                {inconsistentCategories.length === 0 && <span className="text-xs text-gray-500">Nenhuma inconsistência crítica.</span>}
                </div>
            </div>
        </div>

        {/* 8. Qualitative Analysis (Text Answers) - UPDATED TO SHOW ALL + PLACEHOLDERS (Hidden in 360) */}
        {!profile.is360 && (
          <div className={`${styles.bgCard} border rounded-xl p-6 shadow-lg`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.textPrimary}`}>
                  <span className="material-symbols-outlined text-gray-400">edit_note</span>
                  Suas Reflexões
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {descriptiveQuestions.map((question) => {
                      const answer = textAnswers[question.id];
                      return (
                          <div key={question.id} className={`p-4 rounded-lg border h-full ${styles.bgSub} ${styles.border}`}>
                              <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base">chat_bubble</span>
                                  {question.theme} • {question.category}
                              </h4>
                              <p className={`font-medium mb-3 text-sm border-b pb-2 ${styles.textPrimary} ${printMode ? 'border-gray-300' : 'border-gray-700'}`}>{question.text}</p>
                              <p className={`text-sm italic ${answer ? styles.textSecondary : 'text-gray-400/50'}`}>
                                  "{answer || 'Não respondido'}"
                              </p>
                          </div>
                      );
                  })}
              </div>
          </div>
        )}

      </div>

      {/* Action Buttons (Fixed or Bottom) */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 print:hidden">
        <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
        >
            {isGeneratingPdf ? (
                <>
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                    Gerando PDF...
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    Baixar PDF (Versão Clara)
                </>
            )}
        </button>
        <button
            onClick={handleDownloadJSON}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-purple hover:bg-purple-700 text-white font-bold rounded-lg transition-all"
        >
            <span className="material-symbols-outlined">data_object</span>
            Baixar JSON (Dados)
        </button>
        <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-dark border border-gray-600 text-white font-bold rounded-lg hover:bg-surface-darker transition-all"
        >
            <span className="material-symbols-outlined">restart_alt</span>
            Nova Avaliação
        </button>
      </div>
    </div>
  );
};

export default Results;