import React, { useState } from 'react';
import { LeadershipLevel, UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const PersonalInfo: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [level, setLevel] = useState<LeadershipLevel | null>(null);
  const [is360, setIs360] = useState(false);
  const [targetLeaderName, setTargetLeaderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (is360) {
        if (targetLeaderName) {
             onComplete({ name: name || 'Avaliador Anônimo', email: email || 'anonimo@360.com', company: company || 'N/A', role: role || 'Avaliador', whatsapp: whatsapp || '00000000000', level: LeadershipLevel.Comum, is360: true, targetLeaderName });
        }
    } else {
        if (name && email && company && role && whatsapp && level) {
            onComplete({ name, email, company, role, whatsapp, level, is360: false });
        }
    }
  };

  const toggle360 = () => {
      setIs360(!is360);
      if (!is360) setLevel(null);
  };

  return (
    <div className="container animate-fade-in" style={{paddingBottom: '3rem', paddingTop: '2rem'}}>
      <div className="grid-layout">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
            
            {/* Progress */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-primary" style={{textTransform: 'uppercase'}}>Passo 1 de 4</span>
                    <span className="text-sm text-gray">25% Completo</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{width: '25%'}}></div>
                </div>
            </div>

            {/* Instructions */}
            <div className="card">
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <h2 style={{fontSize: '1.5rem', fontWeight: 'bold'}}>Antes de começar</h2>
                    <p className="text-gray" style={{lineHeight: 1.6}}>
                        Este assessment foi desenhado para capturar suas respostas mais naturais e instintivas.
                        Não existe resposta “certa” ou “errada” — existe apenas o que você faz de verdade no dia a dia da liderança.
                    </p>
                    
                    <div style={{background: 'var(--bg-surface-darker)', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)'}}>
                        <h3 className="text-sm font-bold text-white" style={{textTransform: 'uppercase', marginBottom: '0.75rem'}}>Instruções essenciais</h3>
                        <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}} className="text-gray text-sm">
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check</span>Responda pensando no seu comportamento real.</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">timer</span>Algumas perguntas têm tempo limitado.</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">schedule_send</span>O sistema seguirá automaticamente se o tempo acabar.</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">favorite</span>Confie na primeira resposta.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 360 Toggle */}
            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>
                <div className="flex items-center justify-between" style={{marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem'}}>
                     <div>
                        <h3 style={{fontSize: '1.125rem', fontWeight: 'bold'}}>Avaliação 360° <span className="text-sm text-gray font-normal">(opcional)</span></h3>
                        <p className="text-sm text-gray">Avalie outro líder com este instrumento.</p>
                     </div>
                     <button type="button" onClick={toggle360} className="btn" style={{border: is360 ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)', background: is360 ? 'var(--accent-purple)' : 'transparent', color: is360 ? 'white' : 'var(--text-gray)'}}>
                        <span className="material-symbols-outlined">360</span>
                        {is360 ? 'Modo 360º Ativo' : 'Ativar Avaliação 360º'}
                     </button>
                </div>
                
                {is360 && (
                  <div className="animate-fade-in" style={{padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '0.5rem', marginBottom: '1rem'}}>
                    <label className="text-sm font-bold" style={{display: 'block', marginBottom: '0.5rem'}}>Nome do Líder Avaliado</label>
                    <input type="text" value={targetLeaderName} onChange={(e) => setTargetLeaderName(e.target.value)} className="input-field" placeholder="Quem você está avaliando?" />
                  </div>
                )}
            </div>

            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Informações profissionais</h2>
                <p className="text-gray text-sm">Essas informações ajudam a calibrar a análise.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div style={{display: 'grid', gap: '1.5rem', opacity: is360 ? 0.7 : 1}}>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray">Seu Nome Completo</label>
                        <input type="text" className="input-field" required={!is360} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Silva" />
                    </div>
                    <div className="grid-2 flex gap-4" style={{display: 'grid', gridTemplateColumns: '1fr 1fr'}}>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray">E-mail</label>
                            <input type="email" className="input-field" required={!is360} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray">WhatsApp</label>
                            <input type="tel" className="input-field" required={!is360} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
                        </div>
                    </div>
                    <div className="grid-2 flex gap-4" style={{display: 'grid', gridTemplateColumns: '1fr 1fr'}}>
                         <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray">Empresa</label>
                            <input type="text" className="input-field" required={!is360} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray">Cargo</label>
                            <input type="text" className="input-field" required={!is360} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Gerente" />
                        </div>
                    </div>
                </div>

                {!is360 && (
                    <div style={{marginTop: '1rem'}}>
                        <label className="text-sm text-gray" style={{display:'block', marginBottom: '1rem'}}>Qual é o seu nível de liderança atual?</label>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {[
                            { val: LeadershipLevel.L1, label: 'L1 — Primeira liderança', sub: 'Lidera colaboradores individuais. Foco em operação.', icon: 'person' },
                            { val: LeadershipLevel.L2, label: 'L2 — Liderança intermediária', sub: 'Lidera outros líderes. Foco em tática e sucessão.', icon: 'groups' },
                            { val: LeadershipLevel.L3, label: 'L3 — Alta liderança', sub: 'Lidera a organização. Foco em estratégia e cultura.', icon: 'domain' },
                        ].map((opt) => (
                            <label key={opt.val} className="card" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: level === opt.val ? '1px solid var(--primary)' : '1px solid var(--border-color)', backgroundColor: level === opt.val ? 'rgba(19, 55, 236, 0.1)' : 'var(--bg-surface)'}}>
                                <input type="radio" name="leadership_level" value={opt.val} checked={level === opt.val} onChange={() => setLevel(opt.val)} className="hidden" />
                                <div style={{width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'}}>
                                     <span className="material-symbols-outlined">{opt.icon}</span>
                                </div>
                                <div style={{flex: 1}}>
                                    <span style={{display: 'block', fontWeight: 'bold', marginBottom: '0.25rem'}}>{opt.label}</span>
                                    <span className="text-sm text-gray">{opt.sub}</span>
                                </div>
                                {level === opt.val && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </label>
                        ))}
                        </div>
                    </div>
                )}

                <button type="submit" disabled={is360 ? !targetLeaderName : (!name || !email || !company || !role || !whatsapp || !level)} className="btn btn-primary" style={{marginTop: '1rem', width: '100%'}}>
                  <span>{is360 ? 'Iniciar Avaliação 360º' : 'Avançar'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </form>
        </div>

        {/* Right Column (Visual) */}
        <div className="hidden" style={{display: 'block'}}>
            <div style={{position: 'sticky', top: '6rem'}}>
                 <div style={{borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', aspectRatio: '3/4'}}>
                    <div style={{position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800")', backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.4), transparent)'}}></div>
                    <div style={{position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem'}}>
                         <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '1.5rem'}}>
                            <span className="material-symbols-outlined text-white">psychology</span>
                         </div>
                         <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>Análise de Perfil Sistêmica</h3>
                         <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
                            <div>
                                <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>4</p>
                                <p className="text-xs text-gray" style={{textTransform: 'uppercase'}}>Pilares</p>
                            </div>
                            <div>
                                <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>1h</p>
                                <p className="text-xs text-gray" style={{textTransform: 'uppercase'}}>Tempo</p>
                            </div>
                         </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;