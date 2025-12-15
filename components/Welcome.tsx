import React from 'react';

interface Props {
  onStart: () => void;
}

const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="container animate-fade-in" style={{paddingTop: '3rem', paddingBottom: '3rem'}}>
        {/* Step Indicator */}
        <div className="w-full" style={{marginBottom: '2rem'}}>
            <div className="flex items-center justify-between" style={{marginBottom: '0.5rem'}}>
                <span className="text-xs font-bold text-primary" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Abertura • Passo 0 de 4</span>
                <span className="text-xs text-gray">Tempo estimado: ~1 hora</span>
            </div>
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{width: '5%'}}></div>
            </div>
        </div>

        {/* Hero */}
        <div className="grid-layout items-center" style={{padding: '2rem 0'}}>
            <div className="flex flex-col gap-6">
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <h1 style={{fontSize: '3rem', fontWeight: '900', lineHeight: 1.1}}>
                        Descubra seu verdadeiro nível de <span className="text-primary">maturidade em liderança</span>
                    </h1>
                    <h2 style={{fontSize: '1.25rem', color: '#e2e8f0', fontWeight: 500}}>
                        Uma análise profunda, estruturada e baseada em dados para revelar como você lidera na prática — e não apenas como você acredita que lidera.
                    </h2>
                    <p className="text-gray" style={{fontSize: '1rem', lineHeight: 1.6}}>
                        Este assessment avalia mais de 120 aspectos críticos da liderança moderna, integrando pessoas, resultados, estratégia, inovação, ética e tomada de decisão sob pressão.
                        Ao final, você receberá um retrato claro do seu estágio atual de liderança, seus principais gaps ocultos e os próximos passos para evoluir.
                    </p>
                </div>
                <div className="flex flex-col gap-4" style={{marginTop: '0.5rem'}}>
                    <button onClick={onStart} className="btn btn-primary" style={{height: '3.5rem', fontSize: '1.1rem', padding: '0 2rem'}}>
                        <span>Iniciar Assessment</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <p className="text-sm text-gray flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{fontSize: '1rem'}}>lock</span>
                        Dados 100% confidenciais
                    </p>
                </div>
            </div>
            
            {/* Image Card */}
            <div className="relative card" style={{padding: 0, overflow: 'hidden', aspectRatio: '4/3', border: '1px solid var(--border-color)'}}>
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, #1e1b4b, #000)'}}></div>
                <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <img alt="Leadership" style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6}} src="https://picsum.photos/800/600?blur=4" />
                </div>
                {/* Floating Card */}
                <div className="absolute" style={{bottom: '1.5rem', left: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '0.75rem'}}>
                    <div className="flex gap-4">
                        <div style={{width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                            <span className="material-symbols-outlined text-white">psychology</span>
                        </div>
                        <div>
                            <p style={{fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem'}}>Análise de Perfil</p>
                            <p className="text-sm" style={{color: '#cbd5e1'}}>Este teste avalia o líder de maneira sistêmica, combinando comportamento, decisões reais e consistência interna.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Benefits */}
        <div className="card" style={{marginTop: '4rem', background: 'rgba(21, 25, 43, 0.5)'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem'}}>
                {[
                    { icon: 'verified', title: 'Clareza', desc: 'Sobre seus pontos fortes reais.' },
                    { icon: 'compare_arrows', title: 'Coerência', desc: 'Identificação de incoerências entre intenção e prática.' },
                    { icon: 'leaderboard', title: 'Diagnóstico', desc: 'Por nível de liderança (L1, L2 ou L3).' },
                    { icon: 'tips_and_updates', title: 'Evolução', desc: 'Insights acionáveis para evolução imediata.' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary">
                             <span className="material-symbols-outlined">{item.icon}</span>
                             <h3 className="font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-sm text-gray">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Welcome;