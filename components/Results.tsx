import React, { useRef, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Scatter, ZAxis, Cell, ReferenceLine, BarChart, Bar, Legend, Area, AreaChart, ScatterChart } from 'recharts';
import { ScoreResult, UserProfile, RoleResult, LeadershipLevel, TextAnswers, BlockResult } from '../types';
import { descriptiveQuestions } from '../data/descriptive';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  results: ScoreResult;
  profile: UserProfile;
  textAnswers: TextAnswers;
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

const Results: React.FC<Props> = ({ results, profile, textAnswers, onRestart }) => {
  const { matrix, roles, horizons, consistency, predominantHorizon, categories, blocks, roleValidation } = results;
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Horizon Colors
  const horizonColors: Record<number, string> = {
    0: '#4b5563', // Cinza (H0)
    1: '#3b82f6', // Azul (H1)
    2: '#0bda65', // Verde (H2)
    3: '#8b5cf6', // Roxo (H3)
    4: '#eab308'  // Dourado (H4)
  };

  const predominantColor = horizonColors[predominantHorizon];

  // Standard Dark Mode Chart Colors
  const chartColors = {
    text: '#9ca3af',
    grid: '#374151',
    tooltipBg: '#1f2937',
    tooltipText: '#ffffff',
    tooltipBorder: '#374151'
  };

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
  // We need 6 points per role: Average (Big) + 5 Horizons (Small, colored)
  const roleNames = ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'];
  const detailedRoleData: any[] = [];
  
  roleNames.forEach((role, idx) => {
      const roleRes = roles[role];
      if(!roleRes) return;

      // 1. Average Point (Larger)
      detailedRoleData.push({
          roleName: role,
          score: roleRes.score,
          type: 'Average',
          horizon: -1,
          size: 400, // Large size for average
          color: '#ffffff', // White center
          stroke: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][idx % 4] // Role color border
      });

      // 2. Horizon Points (H0-H4)
      Object.entries(roleRes.horizons).forEach(([h, score]) => {
           detailedRoleData.push({
               roleName: role,
               score: score,
               type: `H${h}`,
               horizon: Number(h),
               size: 100, // Smaller size
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPdf(true);

    try {
        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2, 
            backgroundColor: '#101322', // Standard Dark Background
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`Radar_Lideranca_${profile.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8 animate-fade-in text-white space-y-12">
      
      {/* Wrapper ref for PDF generation */}
      <div ref={printRef} className="space-y-12 p-4 sm:p-0 bg-background-dark">

        {/* 1. Header & Score */}
        <div className="bg-surface-dark border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="px-3 py-1 rounded-full bg-surface-darker border border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
                 {profile.level}
               </div>
               <div className="px-3 py-1 rounded-full border border-gray-700 text-xs font-bold uppercase tracking-wider" style={{color: predominantColor, borderColor: predominantColor}}>
                 Horizonte H{predominantHorizon}
               </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
              {profile.name.split(' ')[0]}, você é um <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Líder {matrix.quadrantName}</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
               Sua análise de consistência aponta um perfil <strong>{consistency.status}</strong>. 
               {consistency.message}
            </p>
          </div>
          <div className="flex flex-col items-center z-10 bg-surface-darker/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm min-w-[200px]">
             <span className="text-sm text-gray-400 uppercase font-bold tracking-widest mb-2">Nota Geral</span>
             <span className="text-6xl font-black text-white">{results.total}</span>
             <div className="w-full h-1 bg-gray-700 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-primary" style={{width: `${results.total}%`}}></div>
             </div>
          </div>
        </div>

        {/* 2. The 9-Box Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">grid_view</span>
              Matriz de Liderança (Pessoas x Resultados)
            </h3>
            
            <div className="relative aspect-square w-full max-w-[500px] mx-auto border-2 border-gray-700 bg-surface-darker">
              {/* Grid Lines Overlay */}
              <div className="absolute top-0 bottom-0 border-r border-dashed border-gray-600 left-[50%] z-10"></div>
              <div className="absolute top-0 bottom-0 border-r border-dashed border-gray-600 left-[80%] z-10"></div>
              <div className="absolute left-0 right-0 border-t border-dashed border-gray-600 bottom-[50%] z-10"></div>
              <div className="absolute left-0 right-0 border-t border-dashed border-gray-600 bottom-[80%] z-10"></div>

              {/* Background Gradients (Red -> Yellow -> Green) */}
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 text-[10px] sm:text-xs text-white/80 font-bold uppercase pointer-events-none">
                  
                  {/* Row 3 (High Results 4.0-5.0) */}
                  <div className="col-span-5 row-span-2 border-b border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-yellow-600/30 to-green-500/20">7. Inspirador</div>
                  <div className="col-span-3 row-span-2 border-b border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-green-600/30 to-green-500/40">8. Construtor</div>
                  <div className="col-span-2 row-span-2 border-b border-white/5 flex items-center justify-center bg-green-500/50 text-white shadow-inner">9. Completo</div>

                  {/* Row 2 (Med Results 2.5-4.0) */}
                  <div className="col-span-5 row-span-3 border-b border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-orange-600/30 to-yellow-600/20">4. Relacional</div>
                  <div className="col-span-3 row-span-3 border-b border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-yellow-600/20 to-green-600/20">5. Equilibrado</div>
                  <div className="col-span-2 row-span-3 border-b border-white/5 flex items-center justify-center bg-gradient-to-tr from-green-600/20 to-green-500/30">6. Estratégico</div>

                   {/* Row 1 (Low Results 0-2.5) */}
                  <div className="col-span-5 row-span-5 border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-red-600/40 to-orange-600/30">1. Técnico</div>
                  <div className="col-span-3 row-span-5 border-r border-white/5 flex items-center justify-center bg-gradient-to-tr from-orange-600/30 to-yellow-600/30">2. Executor</div>
                  <div className="col-span-2 row-span-5 flex items-center justify-center bg-gradient-to-tr from-yellow-600/20 to-green-600/10">3. Demandante</div>
              </div>

              {/* The User Dot */}
              <div 
                  className="absolute w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transform -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center group cursor-pointer transition-all duration-1000 ease-out"
                  style={{ 
                      left: `${matrixX}%`, 
                      bottom: `${matrixY}%`,
                      backgroundColor: predominantColor 
                  }}
              >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                      P:{matrix.x} | R:{matrix.y} (H{predominantHorizon})
                  </div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase">
                <span>Foco em Pessoas</span>
                <span>Foco em Resultados</span>
            </div>
          </div>

          {/* 3. Roles Analysis (UPDATED TO 6 POINTS + TABLE) */}
          <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-accent-purple">diversity_3</span>
              Os 4 Papéis (Consistência: {consistency.stdDev})
            </h3>
            <p className="text-xs text-gray-400 mb-4">
                O gráfico abaixo exibe a Média Geral (ponto maior) e a pontuação por horizonte (H0-H4) para cada papel.
            </p>

            {/* Chart Area */}
            <div className="flex-grow flex flex-col justify-center mb-6">
              <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis type="category" dataKey="roleName" name="Papel" tick={{fill: chartColors.text, fontSize: 12}} allowDuplicatedCategory={false} />
                  <YAxis type="number" dataKey="score" name="Nota" domain={[0, 6]} tick={{fill: chartColors.text}} />
                  <ZAxis type="number" dataKey="size" range={[80, 400]} />
                  <Tooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-surface-darker border border-gray-700 p-2 rounded shadow text-xs text-white">
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
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <h4 className="flex items-center gap-2 font-bold text-yellow-500 mb-2 text-sm">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        Atenção: Discrepâncias Identificadas
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                        {roleValidation.alerts.map((alert, idx) => (
                            <li key={idx} className="text-xs text-gray-300">
                                {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detailed Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-400">
                    <thead className="text-xs text-gray-200 uppercase bg-surface-darker">
                        <tr>
                            <th className="px-3 py-2">Papel</th>
                            <th className="px-3 py-2 text-center text-white font-bold">Média</th>
                            <th className="px-3 py-2 text-center text-gray-400">H0</th>
                            <th className="px-3 py-2 text-center text-blue-400">H1</th>
                            <th className="px-3 py-2 text-center text-green-400">H2</th>
                            <th className="px-3 py-2 text-center text-purple-400">H3</th>
                            <th className="px-3 py-2 text-center text-yellow-400">H4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roleNames.map((role, i) => (
                            <tr key={role} className="border-b border-gray-800">
                                <td className="px-3 py-2 font-medium text-white">{role}</td>
                                <td className="px-3 py-2 text-center font-bold text-white bg-white/5">{roles[role]?.score}</td>
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

        {/* 4. Blocks (Temas) - NEW CHART */}
        <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-pink-500">category</span>
                Análise por Blocos de Competência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={blockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false}/>
                            <XAxis type="number" domain={[0, 5]} tick={{fill: chartColors.text}} />
                            <YAxis type="category" dataKey="name" width={150} tick={{fill: chartColors.text, fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText}}
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
                     <div className="p-4 bg-surface-darker rounded-lg border border-gray-700">
                         <h4 className="font-bold text-white mb-2 text-sm uppercase">Legenda de Horizontes</h4>
                         <div className="grid grid-cols-1 gap-2">
                             {Object.entries(horizonColors).map(([h, color]) => (
                                 <div key={h} className="flex items-center gap-2">
                                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></div>
                                     <span className="text-sm text-gray-300">H{h} - {horizonData[Number(h)].desc}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                     <div className="p-4 bg-surface-darker rounded-lg border border-gray-700 flex-grow">
                         <h4 className="font-bold text-white mb-2 text-sm uppercase">Destaque</h4>
                         <p className="text-sm text-gray-400">
                             Seu bloco mais forte é <strong>{blockChartData[0]?.name}</strong> com nota <strong>{blockChartData[0]?.score}</strong>.
                             Isso indica uma facilidade natural em lidar com desafios dessa natureza.
                         </p>
                         <div className="h-px bg-gray-700 my-3"></div>
                         <p className="text-sm text-gray-400">
                             Atenção para <strong>{blockChartData[blockChartData.length - 1]?.name}</strong> (Nota: {blockChartData[blockChartData.length - 1]?.score}), 
                             que pode representar um gargalo para seu desenvolvimento atual.
                         </p>
                     </div>
                </div>
            </div>
        </div>

        {/* 5. Maturity Comparison (Horizons) - RESTORED TO SINGLE AREA CHART */}
        <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
           <h3 className="text-xl font-bold mb-2 text-white">Maturidade Temporal (H0-H4)</h3>
           <p className="text-sm text-gray-400 mb-6">Como você distribui sua atenção entre presente, curto, médio e longo prazo</p>
           
           <div className="h-[300px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="name" tick={{fill: chartColors.text}} />
                      <YAxis domain={[0, 5]} tick={{fill: chartColors.text}} />
                      <Tooltip contentStyle={{backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText}} />
                      <Area type="monotone" dataKey="ideal" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name={`Curva Ideal ${profile.level}`} />
                      <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" name="Sua Curva" />
                      <Legend />
                  </AreaChart>
              </ResponsiveContainer>
           </div>

           {/* H Details List */}
           <div className="space-y-4">
               {comparisonData.map((h, i) => {
                   const diff = h.score - h.ideal;
                   const status = diff > 0.5 ? 'Acima do ideal' : diff < -0.5 ? 'Abaixo do ideal' : 'Dentro do ideal';
                   const statusColor = diff > 0.5 ? 'text-blue-400' : diff < -0.5 ? 'text-orange-400' : 'text-green-400';
                   const icon = diff > 0.5 ? 'arrow_upward' : diff < -0.5 ? 'arrow_downward' : 'check';
                   
                   return (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-darker border border-gray-700">
                          <div className="flex items-center gap-4">
                              <div className={`size-10 rounded-full flex items-center justify-center font-bold text-white`} style={{backgroundColor: horizonColors[i]}}>
                                  {h.name}
                              </div>
                              <div>
                                  <h4 className="font-bold text-white text-sm">{h.desc}</h4>
                                  <div className={`flex items-center gap-1 text-xs mt-1 ${statusColor}`}>
                                      <span className="material-symbols-outlined text-[10px]">{icon}</span>
                                      <span>Ideal: {h.ideal} • {status}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-xl font-bold text-white">{h.score.toFixed(1)}/5</div>
                      </div>
                   );
               })}
           </div>
        </div>

        {/* 6. Detailed Categories Chart - REPLACED TABLE WITH CHART */}
        <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg overflow-hidden">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-cyan-400">bar_chart</span>
                Detalhamento por Categoria
            </h3>
            <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={categoryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false}/>
                        <XAxis type="number" domain={[0, 5]} tick={{fill: chartColors.text}} />
                        <YAxis type="category" dataKey="name" width={200} tick={{fill: chartColors.text, fontSize: 11}} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText}}
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

        {/* 7. Qualitative Analysis (Text Answers) - UPDATED TO SHOW ALL + PLACEHOLDERS */}
        <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-white">edit_note</span>
                Suas Reflexões
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {descriptiveQuestions.map((question) => {
                    const answer = textAnswers[question.id];
                    return (
                        <div key={question.id} className="p-4 bg-surface-darker rounded-lg border border-gray-700 h-full">
                            <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">chat_bubble</span>
                                {question.theme} • {question.category}
                            </h4>
                            <p className="text-white font-medium mb-3 text-sm border-b border-gray-700 pb-2">{question.text}</p>
                            <p className={`text-sm italic ${answer ? 'text-gray-300' : 'text-gray-600'}`}>
                                "{answer || 'Não respondido'}"
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>

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
                    <span className="material-symbols-outlined">download</span>
                    Baixar Relatório Completo
                </>
            )}
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