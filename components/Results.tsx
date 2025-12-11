import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, ComposedChart, Scatter, ZAxis, Cell, ReferenceLine, BarChart, Bar, Legend, Area, AreaChart } from 'recharts';
import { ScoreResult, UserProfile, RoleResult, LeadershipLevel, TextAnswers } from '../types';
import { descriptiveQuestions } from '../data/descriptive';

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

// Helper: Category Horizon Mapping (Static approximation for visual consistency with screenshot)
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
  const { matrix, roles, horizons, consistency, predominantHorizon, categories } = results;

  // Horizon Colors
  const horizonColors: Record<number, string> = {
    0: '#4b5563', // Cinza (H0)
    1: '#3b82f6', // Azul (H1)
    2: '#0bda65', // Verde (H2)
    3: '#8b5cf6', // Roxo (H3)
    4: '#eab308'  // Dourado (H4)
  };

  const predominantColor = horizonColors[predominantHorizon];

  // Data for Horizon Line Chart (Existing)
  const horizonData = [
    { name: 'H0', score: horizons[0], desc: 'Imediato' },
    { name: 'H1', score: horizons[1], desc: 'Curto' },
    { name: 'H2', score: horizons[2], desc: 'Médio' },
    { name: 'H3', score: horizons[3], desc: 'Longo' },
    { name: 'H4', score: horizons[4], desc: 'Expansão' },
  ];

  // Data for Comparison Chart (New)
  const idealCurve = IDEAL_CURVES[profile.level] || IDEAL_CURVES[LeadershipLevel.Comum];
  const comparisonData = horizonData.map((h, i) => ({
    ...h,
    ideal: idealCurve[i]
  }));

  // Role Scatter Data & Average Calculation
  const roleValues = Object.values(roles).map((r: RoleResult) => r.score);
  const averageRoleScore = roleValues.reduce((a, b) => a + b, 0) / roleValues.length;

  const roleData = Object.keys(roles).map((r, idx) => ({
    name: r,
    score: roles[r].score,
    index: idx
  }));

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

  // --- Calculations for New Sections ---

  // Percentages
  const pctPeople = Math.round((matrix.x / 5) * 100);
  const pctResults = Math.round((matrix.y / 5) * 100);
  
  // Consistency Index (Inverse of StdDev, normalized roughly)
  const consistencyIndex = Math.max(0, Math.min(100, Math.round((1 - (consistency.stdDev / 1.5)) * 100)));

  // Lowest Category - sort using numbers explicitly
  const sortedCategories = Object.entries(categories).sort(([,a], [,b]) => (a as number) - (b as number));
  const lowestCategory = sortedCategories[0];

  // Pass Thresholds (Hypothetical defaults based on image)
  const thresholds = {
    people: 65,
    results: 55,
    roles: {
      'Líder': 70,
      'Gestor': 60,
      'Estrategista': 40,
      'Intraempreendedor': 50
    }
  };

  // Category Chart Data - map using explicit numbers
  const categoryChartData = Object.entries(categories).map(([name, score]) => ({
    name: name.length > 25 ? name.substring(0, 25) + '...' : name,
    fullName: name,
    score: score as number,
    horizon: CATEGORY_HORIZONS[name] ?? 1 // Fallback
  })).sort((a, b) => b.score - a.score); // Sort best to worst

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8 animate-fade-in text-white space-y-12">
      
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
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
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
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
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    P:{matrix.x} | R:{matrix.y} (H{predominantHorizon})
                </div>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase">
              <span>Foco em Pessoas</span>
              <span>Foco em Resultados</span>
          </div>
        </div>

        {/* 3. Roles Analysis */}
        <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-purple">diversity_3</span>
            Os 4 Papéis (Consistência: {consistency.stdDev})
          </h3>

          <div className="flex-grow flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={250}>
                <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis type="category" dataKey="name" name="Papel" tick={{fill: '#9ca3af', fontSize: 12}} interval={0} />
                <YAxis type="number" dataKey="score" name="Nota" domain={[0, 5]} tick={{fill: '#9ca3af'}} />
                <ZAxis type="number" range={[100, 100]} />
                <ReTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                
                {/* Average Line */}
                <ReferenceLine y={averageRoleScore} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: 'Média', fill: '#9ca3af', fontSize: 10, position: 'right' }} />
                
                <Scatter name="Papéis" data={roleData} fill="#8884d8">
                    {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 4 ? '#22c55e' : entry.score < 2.5 ? '#ef4444' : '#3b82f6'} />
                    ))}
                </Scatter>
                </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-surface-darker border border-gray-700">
             <h4 className="text-sm font-bold text-white mb-1">Diagnóstico Automático:</h4>
             <p className="text-sm text-gray-400">{consistency.message}</p>
          </div>
        </div>
      </div>

      {/* 4. Horizon Chart (Existing) */}
      <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
         <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-yellow">timeline</span>
            Curva de Maturidade Temporal
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-3xl">
            Abaixo, sua distribuição de energia entre execução imediata (H0) e legado futuro (H4). 
            Compare a forma da sua curva com o esperado para nível {profile.level}.
          </p>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={horizonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{fill: '#9ca3af'}} />
                    <YAxis domain={[0, 5]} tick={{fill: '#9ca3af'}} />
                    <ReTooltip 
                        contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}}
                        labelStyle={{color: '#9ca3af'}}
                    />
                    <Line type="monotone" dataKey="score" stroke="#1337ec" strokeWidth={4} activeDot={{ r: 8 }} dot={{r: 4, fill: '#1337ec'}} />
                </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {horizonData.map((h, i) => (
                  <div key={i} className="text-center p-3 rounded bg-surface-darker border border-gray-700">
                      <div className="text-xs text-gray-500 uppercase font-bold mb-1">{h.desc}</div>
                      <div className="text-xl font-bold" style={{color: horizonColors[i]}}>{h.score}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* 5. Maturity Legend & Gaps */}
      <div className="grid gap-8 md:grid-cols-2">
         {/* Legend */}
         <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Tipos de líderes por maturidade temporal:</h3>
            <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                    <span className="font-bold text-white">1. Reativo:</span>
                    <span>H0 alto, H1–H4 baixos → Age no impulso</span>
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-white">2. Operacional:</span>
                    <span>H0-H1 altos, H2–H4 baixos → Bom gestor de tarefas</span>
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-white">3. Sistêmico:</span>
                    <span>H2 alto → Integra áreas, pensa causas-raiz</span>
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-white">4. Estratégico:</span>
                    <span>H3 alto → Planeja, antecipa cenários</span>
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-white">5. Transformador:</span>
                    <span>H4 emergente, H3 consistente → Ápice do desenvolvimento</span>
                </li>
            </ul>
         </div>

         {/* Gaps Identificados - Logic based on Low H4 */}
         {horizons[4] < 2.5 && (
            <div className="bg-orange-900/10 border border-orange-500/30 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-orange-400 mb-2">Gaps Identificados</h3>
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                    <h4 className="font-bold text-orange-300 mb-2">H4 mais baixo</h4>
                    <p className="text-sm text-orange-200/80 mb-3">
                        O líder pensa bem o futuro, mas não pensa o porquê do futuro. Não articula propósito, legado, ética ampliada.
                    </p>
                    <p className="text-sm font-medium text-green-400">
                        <span className="font-bold">Recomendação:</span> Aprofundamento em propósito, ética, impacto social, senso de legado, valores organizacionais como bússola.
                    </p>
                </div>
            </div>
         )}
      </div>

      {/* 6. Axis & Roles Percentage */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Eixos & Papéis</h3>
        
        {/* Axis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${pctPeople >= thresholds.people ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'}`}>
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Pessoas</span>
                    {pctPeople >= thresholds.people && <span className="material-symbols-outlined text-green-500">check</span>}
                </div>
                <div className="text-3xl font-bold mb-1">{pctPeople}%</div>
                <div className="text-xs text-gray-400">Mínimo: {thresholds.people}%</div>
            </div>
            <div className={`p-4 rounded-xl border ${pctResults >= thresholds.results ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'}`}>
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Resultados</span>
                    {pctResults >= thresholds.results && <span className="material-symbols-outlined text-green-500">check</span>}
                </div>
                <div className="text-3xl font-bold mb-1">{pctResults}%</div>
                <div className="text-xs text-gray-400">Mínimo: {thresholds.results}%</div>
            </div>
        </div>

        {/* Roles Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(roles).map(([role, rawData]) => {
                const data = rawData as RoleResult;
                const pct = Math.round((data.score / 5) * 100);
                // @ts-ignore
                const min = thresholds.roles[role] || 50;
                const passed = pct >= min;
                
                // Color Logic
                let colorClass = 'bg-gray-800 border-gray-700';
                if (role === 'Líder') colorClass = 'bg-blue-900/10 border-blue-800 text-blue-100';
                if (role === 'Gestor') colorClass = 'bg-emerald-900/10 border-emerald-800 text-emerald-100';
                if (role === 'Estrategista') colorClass = 'bg-purple-900/10 border-purple-800 text-purple-100';
                if (role === 'Intraempreendedor') colorClass = 'bg-amber-900/10 border-amber-800 text-amber-100';

                return (
                    <div key={role} className={`p-4 rounded-xl border ${passed ? 'bg-green-900/5 border-green-900/30' : 'bg-red-900/5 border-red-900/30'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm text-white">{role}</span>
                            {passed && <span className="material-symbols-outlined text-green-500 text-sm">check</span>}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{pct}%</div>
                        <div className="text-xs text-gray-500">Mín: {min}%</div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-800">
                             <p className="text-xs text-gray-400 mb-1">
                                {role === 'Líder' && 'Cuida das pessoas, engajamento e desenvolvimento'}
                                {role === 'Gestor' && 'Cuida das metas, métodos e produtividade'}
                                {role === 'Estrategista' && 'Integração entre áreas e ambiente externo'}
                                {role === 'Intraempreendedor' && 'Mudanças, inovação e criação de soluções'}
                             </p>
                             <span className="text-[10px] uppercase font-bold text-gray-500">Peso: 25%</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* 7. Consistency Details */}
      <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
         <h3 className="text-xl font-bold text-white mb-6">Consistência entre Papéis</h3>
         
         <div className="bg-surface-darker rounded-lg p-6 border border-gray-700 mb-6">
             <div className="flex items-center gap-4 mb-4">
                 <div className="size-12 rounded-full bg-black border border-gray-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">circle</span>
                 </div>
                 <div>
                     <h4 className="text-lg font-bold text-white uppercase">{consistency.status}</h4>
                     <p className="text-sm text-gray-400">{consistency.message}</p>
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-8 border-t border-gray-700 pt-4">
                 <div>
                     <div className="text-sm text-gray-500">Desvio Padrão</div>
                     <div className="text-3xl font-bold text-primary">{consistency.stdDev}</div>
                     <div className="text-xs text-gray-400">
                         {consistency.stdDev <= 0.3 ? 'Consistência Alta' : consistency.stdDev <= 0.6 ? 'Consistência Moderada' : 'Consistência Baixa'}
                     </div>
                 </div>
                 <div>
                     <div className="text-sm text-gray-500">Índice de Consistência</div>
                     <div className="text-3xl font-bold text-primary">{consistencyIndex}%</div>
                 </div>
             </div>
         </div>

         <div className="text-xs text-gray-500 space-y-1">
             <p className="font-bold mb-2">Referência de desvio padrão:</p>
             <p>• 0,00 a 0,30 → Consistência Alta (líder maduro e equilibrado)</p>
             <p>• 0,31 a 0,60 → Consistência Moderada (padrões naturais + pequenos gaps)</p>
             <p>• 0,61 a 1,00 → Consistência Baixa (liderança assimétrica)</p>
             <p>• Acima de 1,00 → Consistência Crítica (liderança frágil ou contraditória)</p>
         </div>
      </div>

      {/* 8. Categories Chart & List */}
      <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-2">Categorias</h3>
          <p className="text-sm text-gray-400 mb-6">Média por categoria com maturidade temporal predominante</p>

          {/* Chart */}
          <div className="h-[500px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={categoryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{fill: '#9ca3af', fontSize: 11}} interval={0} />
                    <ReTooltip 
                        contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                        {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={horizonColors[entry.horizon]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
                 {[0,1,2,3,4].map(h => (
                     <div key={h} className="flex items-center gap-2">
                         <div className="size-3 rounded-full" style={{backgroundColor: horizonColors[h]}}></div>
                         <span className="text-xs text-gray-400">H{h}</span>
                     </div>
                 ))}
            </div>
          </div>

          {/* List Details */}
          <div className="space-y-3">
              {categoryChartData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded bg-surface-darker border border-gray-700/50 hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white`} style={{backgroundColor: horizonColors[cat.horizon]}}>
                              H{cat.horizon}
                          </span>
                          <span className="text-sm font-medium text-gray-200">{cat.fullName}</span>
                      </div>
                      <div className="text-sm font-bold text-primary">{cat.score.toFixed(2)}/5</div>
                  </div>
              ))}
          </div>
      </div>

      {/* 9. Detailed Maturity Comparison */}
      <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
         <h3 className="text-xl font-bold mb-2">Maturidade Temporal (H0-H4)</h3>
         <p className="text-sm text-gray-400 mb-6">Como você distribui sua atenção entre presente, curto, médio e longo prazo</p>
         
         {/* Curve Comparison Chart */}
         <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{fill: '#9ca3af'}} />
                    <YAxis domain={[0, 5]} tick={{fill: '#9ca3af'}} />
                    <ReTooltip contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
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
                                <p className="text-xs text-gray-400">
                                    {i === 0 && 'Você faz hoje?'}
                                    {i === 1 && 'Você faz nesta semana/mês?'}
                                    {i === 2 && 'Você faz neste trimestre/semestre?'}
                                    {i === 3 && 'Você sustenta o futuro?'}
                                    {i === 4 && 'Você transforma o futuro?'}
                                </p>
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
         
         <div className="mt-4 p-4 rounded-lg bg-blue-900/10 border border-blue-800">
             <p className="text-sm text-blue-200">
                 <span className="font-bold">Interpretação:</span> H0 alto = liderança operacional forte; H1 alto = consistência e previsibilidade; H2 alto = liderança integrada e visão tática ampliada; H3 alto = liderança estratégica, capacidade de longo prazo.
             </p>
         </div>
      </div>

      {/* 10. Diagnosis & Action Plan */}
      <div className="space-y-6">
          <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
             <div className="flex items-center gap-2 mb-2 text-primary">
                 <span className="material-symbols-outlined">check_circle</span>
                 <h3 className="font-bold">Seu Diagnóstico</h3>
             </div>
             <p className="text-gray-300">
                 Muito bom! Você possui base sólida de liderança. Seu perfil de maturidade é <strong>{matrix.quadrantName}</strong>. 
                 Você é classificado como Líder {matrix.quadrantName}.
             </p>
          </div>

          <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4 text-primary">
                  <span className="material-symbols-outlined">menu_book</span>
                  <h3 className="font-bold">Próximos Passos Recomendados</h3>
              </div>
              <ul className="space-y-3 text-gray-300 list-disc list-inside">
                  <li>Foque nas dimensões com menor pontuação para maximizar seu desenvolvimento</li>
                  <li>Considere trabalhar com um mentor ou coach para acelerar seu crescimento</li>
                  <li>Estabeleça metas específicas para cada dimensão nos próximos 90 dias</li>
                  <li>Reavalie sua maturidade de liderança a cada 6 meses</li>
                  <li>Agende uma consultoria gratuita para um plano de desenvolvimento personalizado</li>
              </ul>
          </div>

          <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-6 shadow-lg">
             <div className="flex items-center gap-2 mb-2 text-purple-400">
                 <span className="material-symbols-outlined">target</span>
                 <h3 className="font-bold">Área de Maior Oportunidade: {lowestCategory?.[0]}</h3>
             </div>
             <p className="text-sm text-purple-200/80">
                 Esta é a dimensão com maior potencial de desenvolvimento em seu perfil. Focar aqui pode gerar o maior impacto em sua efetividade como líder.
             </p>
          </div>
          
          <div className="bg-orange-900/10 border border-orange-500/30 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-orange-400 mb-2">Importante!</h3>
              <p className="text-sm text-orange-200/80">
                  Recomendamos que você imprima seus resultados e agende uma consultoria gratuita para receber um plano de desenvolvimento personalizado.
              </p>
          </div>
      </div>

      {/* 11. Descriptive Answers (New Section) */}
      <div className="bg-surface-dark border border-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6 text-primary">
               <span className="material-symbols-outlined">edit_note</span>
               <h3 className="text-xl font-bold text-white">Auto-Reflexão (Perguntas Descritivas)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {descriptiveQuestions.map((q) => (
                  <div key={q.id} className="bg-surface-darker rounded-xl p-5 border border-gray-700/50 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{q.theme}</span>
                          <h4 className="text-sm font-bold text-white">{q.text}</h4>
                      </div>
                      <div className="mt-auto pt-3 border-t border-gray-700/50">
                          <p className="text-sm text-gray-300 italic">
                             {textAnswers[q.id] ? `"${textAnswers[q.id]}"` : <span className="text-gray-600">Não respondido.</span>}
                          </p>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* 5. Internal Consistency Warnings (Existing - Moving to bottom if needed, but keeping generally) */}
      {consistency.internalInconsistencies.length > 0 && (
          <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
             <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                 <span className="material-symbols-outlined">warning</span>
                 Pontos de Atenção (Inconsistências)
             </h3>
             <ul className="list-disc list-inside space-y-2 text-red-200/80 text-sm">
                 {consistency.internalInconsistencies.map((msg, i) => (
                     <li key={i}>{msg}</li>
                 ))}
             </ul>
          </div>
      )}

      {/* 6. Restart Button */}
      <div className="flex justify-center pt-8 pb-12">
        <button 
            onClick={onRestart}
            className="flex items-center gap-2 px-8 py-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 hover:bg-surface-dark transition-all"
        >
            <span className="material-symbols-outlined">refresh</span>
            <span>Reiniciar Assessment</span>
        </button>
      </div>

    </div>
  );
};

export default Results;