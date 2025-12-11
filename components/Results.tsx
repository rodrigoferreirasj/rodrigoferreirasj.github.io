import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { ScoreResult, UserProfile } from '../types';

interface Props {
  results: ScoreResult;
  profile: UserProfile;
}

const Results: React.FC<Props> = ({ results, profile }) => {
  const { matrix, roles, horizons, consistency, predominantHorizon } = results;

  // Horizon Colors
  const horizonColors: Record<number, string> = {
    0: '#4b5563', // Cinza (H0)
    1: '#3b82f6', // Azul (H1)
    2: '#22c55e', // Verde (H2)
    3: '#a855f7', // Roxo (H3)
    4: '#eab308'  // Dourado (H4)
  };

  const predominantColor = horizonColors[predominantHorizon];

  // Data for Horizon Line Chart
  const horizonData = [
    { name: 'H0', score: horizons[0], desc: 'Imediato' },
    { name: 'H1', score: horizons[1], desc: 'Curto' },
    { name: 'H2', score: horizons[2], desc: 'Médio' },
    { name: 'H3', score: horizons[3], desc: 'Longo' },
    { name: 'H4', score: horizons[4], desc: 'Expansão' },
  ];

  // Role Scatter Data
  const roleData = Object.keys(roles).map((r, idx) => ({
    name: r,
    score: roles[r].score,
    index: idx
  }));

  // Matrix Positioning Logic (Mapping 0-5 scores to Percentage positions in the custom grid)
  const getMatrixPos = (val: number) => {
    // 0-2.5 (50% of width)
    // 2.5-4.0 (30% of width)
    // 4.0-5.0 (20% of width)
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
            {/* Grid Lines Overlay - Custom based on 2.5 and 4.0 breaks */}
            {/* Vertical Lines */}
            <div className="absolute top-0 bottom-0 border-r border-dashed border-gray-600 left-[50%]">
                 <span className="absolute -bottom-6 -left-2 text-[10px] text-gray-500">2.5</span>
            </div>
            <div className="absolute top-0 bottom-0 border-r border-dashed border-gray-600 left-[80%]">
                 <span className="absolute -bottom-6 -left-2 text-[10px] text-gray-500">4.0</span>
            </div>
            {/* Horizontal Lines */}
            <div className="absolute left-0 right-0 border-t border-dashed border-gray-600 bottom-[50%]">
                 <span className="absolute -left-6 -top-2 text-[10px] text-gray-500">2.5</span>
            </div>
            <div className="absolute left-0 right-0 border-t border-dashed border-gray-600 bottom-[80%]">
                 <span className="absolute -left-6 -top-2 text-[10px] text-gray-500">4.0</span>
            </div>

            {/* Quadrant Labels (simplified positioning) */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 text-[10px] sm:text-xs text-gray-600 font-bold uppercase pointer-events-none">
                {/* Row 3 (High Results 4.0-5.0) - 20% height */}
                <div className="col-span-5 row-span-2 border-b border-r border-gray-800/30 flex items-center justify-center bg-blue-500/5">7. Inspirador</div>
                <div className="col-span-3 row-span-2 border-b border-r border-gray-800/30 flex items-center justify-center bg-blue-500/10">8. Construtor</div>
                <div className="col-span-2 row-span-2 border-b border-gray-800/30 flex items-center justify-center bg-blue-500/20 text-blue-200">9. Completo</div>

                {/* Row 2 (Med Results 2.5-4.0) - 30% height */}
                <div className="col-span-5 row-span-3 border-b border-r border-gray-800/30 flex items-center justify-center bg-blue-500/5">4. Relacional</div>
                <div className="col-span-3 row-span-3 border-b border-r border-gray-800/30 flex items-center justify-center bg-blue-500/5">5. Equilibrado</div>
                <div className="col-span-2 row-span-3 border-b border-gray-800/30 flex items-center justify-center bg-blue-500/10">6. Estratégico</div>

                 {/* Row 1 (Low Results 0-2.5) - 50% height */}
                <div className="col-span-5 row-span-5 border-r border-gray-800/30 flex items-center justify-center bg-red-500/5 text-red-300/50">1. Técnico</div>
                <div className="col-span-3 row-span-5 border-r border-gray-800/30 flex items-center justify-center bg-blue-500/5">2. Executor</div>
                <div className="col-span-2 row-span-5 flex items-center justify-center bg-blue-500/5">3. Demandante</div>
            </div>

            {/* The User Dot */}
            <div 
                className="absolute w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transform -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center group cursor-pointer transition-all duration-1000 ease-out"
                style={{ 
                    left: `${matrixX}%`, 
                    bottom: `${matrixY}%`,
                    backgroundColor: predominantColor 
                }}
            >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    P:{matrix.x} | R:{matrix.y} (H{predominantHorizon})
                </div>
                <span className="text-[10px] font-bold text-black">H{predominantHorizon}</span>
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
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis type="category" dataKey="name" name="Papel" tick={{fill: '#9ca3af', fontSize: 12}} interval={0} />
                <YAxis type="number" dataKey="score" name="Nota" domain={[0, 5]} tick={{fill: '#9ca3af'}} />
                <ZAxis type="number" range={[100, 100]} />
                <ReTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                <Scatter name="Papéis" data={roleData} fill="#8884d8">
                    {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 4 ? '#22c55e' : entry.score < 2.5 ? '#ef4444' : '#3b82f6'} />
                    ))}
                </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-surface-darker border border-gray-700">
             <h4 className="text-sm font-bold text-white mb-1">Diagnóstico Automático:</h4>
             <p className="text-sm text-gray-400">{consistency.message}</p>
          </div>
        </div>
      </div>

      {/* 4. Horizon Chart */}
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

      {/* 5. Internal Consistency Warnings */}
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

    </div>
  );
};

export default Results;