import React from 'react';

interface Props {
  onStart: () => void;
}

const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto animate-fade-in">
        {/* Step Indicator */}
        <div className="w-full mb-8 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Abertura • Passo 0 de 4</span>
                <span className="text-xs font-medium text-slate-400">Tempo estimado: ~1 hora</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-dark">
                <div className="h-1 w-[5%] rounded-full bg-primary shadow-[0_0_10px_rgba(19,55,236,0.5)]"></div>
            </div>
        </div>

        {/* Hero */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center py-8">
            <div className="flex flex-col gap-6">
                <div className="space-y-4">
                    <h1 className="font-sans text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Descubra seu verdadeiro nível de <span className="text-primary">maturidade em liderança</span>
                    </h1>
                    <h2 className="text-xl font-medium text-slate-200">
                        Uma análise profunda, estruturada e baseada em dados para revelar como você lidera na prática — e não apenas como você acredita que lidera.
                    </h2>
                    <p className="text-base leading-relaxed text-slate-400 max-w-xl">
                        Este assessment avalia mais de 120 aspectos críticos da liderança moderna, integrando pessoas, resultados, estratégia, inovação, ética e tomada de decisão sob pressão.
                        Ao final, você receberá um retrato claro do seu estágio atual de liderança, seus principais gaps ocultos e os próximos passos para evoluir.
                    </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center mt-2">
                    <button onClick={onStart} className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(19,55,236,0.4)]">
                        <span className="relative z-10">Iniciar Assessment</span>
                        <span className="material-symbols-outlined relative z-10 text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </button>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">lock</span>
                        Dados 100% confidenciais
                    </p>
                </div>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-dark shadow-2xl border border-gray-800 group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-60 z-0"></div>
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <img 
                        alt="Leadership Analysis" 
                        className="h-full w-full object-cover opacity-80 mix-blend-normal hover:scale-105 transition-transform duration-700" 
                        src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800" 
                    />
                </div>
                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 right-6 z-20 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-lg animate-bounce-slow">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <span className="material-symbols-outlined text-2xl">psychology</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white mb-1">Análise de Perfil</p>
                            <p className="text-sm text-slate-300 leading-snug">Este teste avalia o líder de maneira sistêmica, combinando comportamento, decisões reais e consistência interna.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 w-full bg-surface-darker/50 border border-gray-800 rounded-2xl p-8 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { icon: 'verified', title: 'Clareza', desc: 'Sobre seus pontos fortes reais.' },
                    { icon: 'compare_arrows', title: 'Coerência', desc: 'Identificação de incoerências entre intenção e prática.' },
                    { icon: 'leaderboard', title: 'Diagnóstico', desc: 'Por nível de liderança (L1, L2 ou L3).' },
                    { icon: 'tips_and_updates', title: 'Evolução', desc: 'Insights acionáveis para evolução imediata.' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-primary">
                             <span className="material-symbols-outlined">{item.icon}</span>
                             <h3 className="font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Welcome;