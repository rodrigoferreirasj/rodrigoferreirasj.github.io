import React, { useRef, useState, useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Scatter, ZAxis, Cell, ScatterChart } from 'recharts';
import { ScoreResult, UserProfile, LeadershipLevel, TextAnswers, BlockResult, Answers, Dilemma, CategoryValidation } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  results: ScoreResult;
  profile: UserProfile;
  textAnswers: TextAnswers;
  answers: Answers;
  dilemmas: Dilemma[];
  totalTime?: number;
  onRestart: () => void;
}

const Results: React.FC<Props> = ({ results, profile, textAnswers, answers, dilemmas, totalTime, onRestart }) => {
  const { matrix, roles, horizons, consistency, predominantHorizon, categories, blocks, roleValidation, omissionAnalysis } = results;
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  const formatTotalTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const horizonColors: Record<number, string> = { 0: '#4b5563', 1: '#3b82f6', 2: '#0bda65', 3: '#8b5cf6', 4: '#eab308' };
  const predominantColor = horizonColors[predominantHorizon];

  // Dynamic styles for Print vs Dark Mode
  const styles = useMemo(() => {
    if (printMode) {
      return {
        bgMain: '#ffffff',
        textPrimary: '#111827',
        textSecondary: '#4b5563',
        cardBorder: '1px solid #e5e7eb',
        cardBg: '#ffffff',
        chartText: '#374151',
        chartGrid: '#e5e7eb',
        barBg: '#e5e7eb'
      };
    } else {
      return {
        bgMain: 'var(--bg-dark)',
        textPrimary: '#ffffff',
        textSecondary: '#9ca3af',
        cardBorder: '1px solid var(--border-color)',
        cardBg: 'var(--bg-surface)',
        chartText: '#9ca3af',
        chartGrid: '#374151',
        barBg: 'rgba(255,255,255,0.1)'
      };
    }
  }, [printMode]);

  const roleNames = ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'];
  const detailedRoleData: any[] = [];
  roleNames.forEach((role, idx) => {
      const roleRes = roles[role];
      if(!roleRes) return;
      // Main role bubble
      detailedRoleData.push({ 
          roleName: role, 
          score: roleRes.score, 
          type: 'Average', 
          size: 400, 
          color: printMode ? '#000000' : '#ffffff', 
          stroke: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][idx % 4] 
      });
      // Horizon bubbles
      Object.entries(roleRes.horizons).forEach(([h, score]) => {
           detailedRoleData.push({ 
               roleName: role, 
               score: score, 
               type: `H${h}`, 
               size: 100, 
               color: horizonColors[Number(h)], 
               stroke: 'transparent' 
           });
      });
  });

  // Sort Categories for Chart
  const categoryData = useMemo(() => {
      return Object.entries(categories)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
  }, [categories]);

  // Calculate Matrix Dot Position (Percentages match logic: Low <2.5 (50%), Med <4.0 (30%), High >4.0 (20%))
  const getMatrixPos = (val: number) => {
    if (val <= 2.5) return (val / 2.5) * 50;
    else if (val <= 4.0) return 50 + ((val - 2.5) / 1.5) * 30;
    else return 80 + ((val - 4.0) / 1.0) * 20;
  };
  const matrixX = getMatrixPos(matrix.x);
  const matrixY = getMatrixPos(matrix.y);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    setPrintMode(true);
    setTimeout(async () => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const sections = Array.from(printRef.current!.children) as HTMLElement[];
            let currentY = 10;
            
            for (const section of sections) {
                if (section.offsetHeight === 0 || section.style.display === 'none') continue;
                const canvas = await html2canvas(section, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
                const imgHeight = (Number(canvas.height) * 190) / Number(canvas.width);
                if (currentY + imgHeight > 280) { pdf.addPage(); currentY = 10; }
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, currentY, 190, imgHeight);
                currentY += imgHeight + 5; 
            }
            pdf.save(`Radar_Lideranca_${profile.name}.pdf`);
        } catch (error) { console.error("PDF Error:", error); } 
        finally { setPrintMode(false); setIsGeneratingPdf(false); }
    }, 800);
  };

  const handleDownloadJSON = () => {
      const blob = new Blob([JSON.stringify({ profile, results, answers: { scale: answers, text: textAnswers } }, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Resultado_${profile.name}.json`;
      link.click();
  };

  const getScoreColor = (score: number) => {
      if (score >= 4.0) return '#22c55e'; // Green
      if (score >= 2.5) return '#eab308'; // Yellow
      return '#ef4444'; // Red
  };

  return (
    <div className={`container animate-fade-in ${printMode ? 'print-mode' : ''}`} style={{paddingTop: '2rem', paddingBottom: '3rem'}}>
      
      {/* WRAPPER FOR PRINTING */}
      <div ref={printRef} style={{display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: styles.bgMain, transition: 'background-color 0.3s'}}>
        
        {/* 1. HEADER CARD */}
        <div className="card results-header">
            <div>
               <div className="flex gap-2" style={{marginBottom: '0.75rem'}}>
                 <span style={{padding: '0.25rem 0.75rem', borderRadius: 99, border: `1px solid ${styles.textSecondary}`, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: styles.textSecondary}}>
                    {profile.level}
                 </span>
                 <span style={{padding: '0.25rem 0.75rem', borderRadius: 99, border: `1px solid ${predominantColor}`, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: predominantColor}}>
                    Horizonte H{predominantHorizon}
                 </span>
               </div>
               <h1 className="text-2xl font-bold" style={{color: styles.textPrimary, lineHeight: 1.1, marginBottom: '0.5rem'}}>
                 <span className="text-primary">Líder {matrix.quadrantName}</span>
               </h1>
               <p style={{fontSize: '1rem', color: styles.textSecondary, lineHeight: 1.5}}>
                 {consistency.message}
               </p>
            </div>
            
            <div className="score-badge">
               <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: styles.textSecondary, marginBottom: '0.5rem'}}>
                   Nota Geral
               </span>
               <span style={{display: 'block', fontSize: '3.5rem', fontWeight: '900', color: styles.textPrimary, lineHeight: 1}}>
                   {results.total}
               </span>
            </div>
        </div>

        {/* 2. READINESS INDEX CARD */}
        <div className="card readiness-container">
            <div className="donut-chart">
                <svg viewBox="0 0 36 36" style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={printMode ? '#e5e7eb' : '#374151'} strokeWidth="3" />
                    <path 
                        strokeDasharray={`${omissionAnalysis.readinessIndex}, 100`} 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke={omissionAnalysis.readinessIndex > 80 ? '#22c55e' : '#eab308'} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                    />
                </svg>
                <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{fontSize: '1.5rem', fontWeight: '900', color: styles.textPrimary}}>{omissionAnalysis.readinessIndex}%</span>
                    <span style={{fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', color: styles.textSecondary}}>Prontidão</span>
                </div>
            </div>
            
            <div style={{flex: 1}}>
                <div className="flex justify-between items-center" style={{marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem'}}>
                    <h3 className="text-xl font-bold" style={{color: styles.textPrimary}}>Índice de Prontidão Decisória</h3>
                    {totalTime && (
                        <div style={{padding: '0.25rem 0.75rem', borderRadius: 99, border: `1px solid ${styles.textSecondary}`, fontSize: '0.75rem', color: styles.textPrimary, fontWeight: 'bold'}}>
                            Tempo: {formatTotalTime(totalTime)}
                        </div>
                    )}
                </div>
                <p style={{fontSize: '0.9rem', color: styles.textSecondary, marginBottom: '1rem', lineHeight: 1.6}}>
                    {omissionAnalysis.interpretation}
                </p>
            </div>
        </div>

        {/* 3. MATRIX & ROLES GRID */}
        <div className="grid-layout">
          {/* MATRIX COLUMN */}
          <div className="card flex flex-col">
             <h3 className="text-xl font-bold" style={{marginBottom: '0.5rem', color: styles.textPrimary}}>Matriz de Liderança 9-Box</h3>
             <p className="text-sm text-gray" style={{marginBottom: '1rem'}}>Cruzamento entre foco em Pessoas e foco em Resultados.</p>
             
             <div className="matrix-wrapper">
                 <div style={{position: 'absolute', inset: 0, opacity: printMode ? 0.2 : 0.1, background: `linear-gradient(to top right, #ef4444, #eab308, #22c55e)`}}></div>
                 
                 {/* 9-BOX GRID LINES (Logic: Low < 2.5, Med < 4.0, High >= 4.0) */}
                 {/* Visual Thresholds: 2.5 maps to 50%, 4.0 maps to 80% */}
                 
                 {/* Vertical Lines (X Axis) */}
                 <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(128,128,128,0.5)', borderLeft: '1px dashed rgba(255,255,255,0.3)'}}></div>
                 <div style={{position: 'absolute', left: '80%', top: 0, bottom: 0, width: 1, background: 'rgba(128,128,128,0.5)', borderLeft: '1px dashed rgba(255,255,255,0.3)'}}></div>

                 {/* Horizontal Lines (Y Axis) - Calculated from Bottom */}
                 <div style={{position: 'absolute', bottom: '50%', left: 0, right: 0, height: 1, background: 'rgba(128,128,128,0.5)', borderTop: '1px dashed rgba(255,255,255,0.3)'}}></div>
                 <div style={{position: 'absolute', bottom: '80%', left: 0, right: 0, height: 1, background: 'rgba(128,128,128,0.5)', borderTop: '1px dashed rgba(255,255,255,0.3)'}}></div>

                 {/* The Dot */}
                 <div style={{
                     position: 'absolute', 
                     width: 24, height: 24, 
                     background: predominantColor, 
                     borderRadius: '50%', 
                     border: '3px solid white', 
                     boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
                     left: `${matrixX}%`, 
                     bottom: `${matrixY}%`, 
                     transform: 'translate(-50%, 50%)', 
                     zIndex: 10
                 }}></div>

                 {/* Axis Labels */}
                 <span style={{position: 'absolute', top: '5%', right: '5%', fontSize: '0.6rem', fontWeight: 'bold', color: styles.textPrimary, opacity: 0.7}}>ALTO</span>
                 <span style={{position: 'absolute', bottom: '5%', left: '5%', fontSize: '0.6rem', fontWeight: 'bold', color: styles.textPrimary, opacity: 0.7}}>BAIXO</span>
                 <span style={{position: 'absolute', bottom: '5%', right: '5%', fontSize: '0.6rem', fontWeight: 'bold', color: styles.textPrimary, opacity: 0.7}}>ALTO</span>
                 <span style={{position: 'absolute', top: '5%', left: '5%', fontSize: '0.6rem', fontWeight: 'bold', color: styles.textPrimary, opacity: 0.7}}>BAIXO</span>
             </div>
             
             <div className="flex justify-between" style={{marginTop: '1rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: styles.textSecondary}}>
                <span>Foco em Pessoas ({matrix.x})</span>
                <span>Foco em Resultados ({matrix.y})</span>
             </div>
          </div>

          {/* ROLES CHART COLUMN */}
          <div className="card flex flex-col">
            <h3 className="text-xl font-bold" style={{marginBottom: '0.5rem', color: styles.textPrimary}}>Os 4 Papéis</h3>
            <p className="text-sm text-gray" style={{marginBottom: '1rem'}}>Distribuição de energia entre os arquétipos.</p>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                  <XAxis 
                    type="category" 
                    dataKey="roleName" 
                    tick={{fill: styles.chartText, fontSize: 11}} 
                    allowDuplicatedCategory={false} 
                    axisLine={{stroke: styles.chartGrid}}
                    tickLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="score" 
                    domain={[0, 6]} 
                    tick={{fill: styles.chartText, fontSize: 11}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <ZAxis type="number" dataKey="size" range={[80, 400]} />
                  <Tooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    contentStyle={{backgroundColor: styles.cardBg, borderColor: styles.cardBorder, color: styles.textPrimary, borderRadius: '8px'}} 
                  />
                  <Scatter name="Pontuação" data={detailedRoleData}>
                    {detailedRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.stroke} strokeWidth={entry.type === 'Average' ? 3 : 0} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. CATEGORIES DETAIL (NEW SECTION) */}
        <div className="card">
            <h3 className="text-xl font-bold" style={{marginBottom: '1.5rem', color: styles.textPrimary}}>Detalhamento por Competência</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'}}>
                {categoryData.map(cat => (
                    <div key={cat.name}>
                        <div className="flex justify-between items-end mb-2">
                            <span style={{fontSize: '0.85rem', color: styles.textPrimary, fontWeight: '500'}}>{cat.name}</span>
                            <span style={{fontSize: '0.85rem', fontWeight: 'bold', color: getScoreColor(cat.score)}}>{cat.score}</span>
                        </div>
                        <div style={{width: '100%', height: '8px', backgroundColor: styles.barBg, borderRadius: '99px', overflow: 'hidden'}}>
                            <div style={{
                                width: `${(cat.score / 5) * 100}%`,
                                height: '100%',
                                backgroundColor: getScoreColor(cat.score),
                                borderRadius: '99px',
                                transition: 'width 1s ease-out'
                            }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* ACTIONS */}
        <div className="flex justify-center gap-4" style={{flexWrap: 'wrap', marginTop: '1rem'}}>
            <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="btn" style={{backgroundColor: 'white', color: 'black', border: '1px solid #e5e7eb'}}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
            </button>
            <button onClick={handleDownloadJSON} className="btn" style={{backgroundColor: 'var(--accent-purple)', color: 'white'}}>
                <span className="material-symbols-outlined">data_object</span>
                Baixar JSON
            </button>
            <button onClick={onRestart} className="btn btn-outline">
                <span className="material-symbols-outlined">restart_alt</span>
                Reiniciar
            </button>
        </div>

      </div>
    </div>
  );
};

export default Results;