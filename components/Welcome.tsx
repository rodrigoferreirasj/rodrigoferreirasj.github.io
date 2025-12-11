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
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Introdução • Passo 0 de 4</span>
                <span className="text-xs font-medium text-slate-400">Tempo estimado: 15 min</span>
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
                        Descubra seu <span className="text-primary">Potencial de Liderança</span>
                    </h1>
                    <p className="text-lg font-normal leading-relaxed text-slate-400 max-w-xl">
                        Uma análise profunda baseada em dados para impulsionar sua carreira. 
                        Desbloqueie insights estratégicos e fortaleça suas tomadas de decisão hoje mesmo.
                    </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80 z-0"></div>
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <img alt="Abstract data" className="h-full w-full object-cover opacity-60 mix-blend-overlay hover:opacity-80 transition-opacity duration-700 hover:scale-105" src="https://picsum.photos/800/600?blur=4" />
                </div>
                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 right-6 z-20 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-lg animate-bounce-slow">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Análise de Perfil</p>
                            <p className="text-xs text-slate-300">IA analisando 45 pontos de dados...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 sm:mt-24 w-full">
            <div className="mb-10 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Seus Benefícios</h2>
                <p className="mt-2 text-base text-slate-400">O que você desbloqueará ao final desta jornada.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    { icon: 'lightbulb', title: 'Clareza Estratégica', desc: 'Identifique seus pontos fortes e áreas de melhoria com precisão cirúrgica.' },
                    { icon: 'analytics', title: 'Feedback Personalizado', desc: 'Receba uma análise detalhada do seu estilo de liderança.' },
                    { icon: 'rocket_launch', title: 'Plano de Ação', desc: 'Não apenas dados, mas um roteiro prático para alcançar o próximo nível.' }
                ].map((item, i) => (
                    <div key={i} className="group flex flex-col gap-4 rounded-xl border border-gray-800 bg-surface-dark p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/20 text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Welcome;