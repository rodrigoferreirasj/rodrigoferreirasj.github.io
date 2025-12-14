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
  
  // 360 Mode State
  const [is360, setIs360] = useState(false);
  const [targetLeaderName, setTargetLeaderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (is360) {
        // In 360 mode, only target name is required, others are optional (but we pass empty strings if not filled)
        if (targetLeaderName) {
             onComplete({ 
                 name: name || 'Avaliador Anônimo', 
                 email: email || 'anonimo@360.com', 
                 company: company || 'N/A', 
                 role: role || 'Avaliador', 
                 whatsapp: whatsapp || '00000000000', 
                 level: LeadershipLevel.Comum, // 360 uses common questions set
                 is360: true,
                 targetLeaderName 
             });
        }
    } else {
        // Standard flow
        if (name && email && company && role && whatsapp && level) {
            onComplete({ name, email, company, role, whatsapp, level, is360: false });
        }
    }
  };

  const toggle360 = () => {
      setIs360(!is360);
      // Reset level if switching to 360 (since 360 doesn't filter by level)
      if (!is360) setLevel(null);
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-fade-in pb-12">
      {/* Left Column: Form Section */}
      <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1">
        
        {/* Progress Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Passo 1 de 4</span>
            <span className="text-sm text-slate-400">25% Completo</span>
          </div>
          <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* INSTRUCTIONS BLOCK (BEFORE STARTING) */}
        <div className="bg-surface-dark border border-gray-700 rounded-xl p-6 md:p-8 space-y-6 shadow-lg">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Antes de começar
                </h2>
                <p className="text-slate-300 leading-relaxed">
                    Este assessment foi desenhado para capturar suas respostas mais naturais e instintivas.
                    Não existe resposta “certa” ou “errada” — existe apenas o que você faz de verdade no dia a dia da liderança.
                </p>
                
                <div className="bg-surface-darker rounded-lg p-5 border border-gray-800">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Instruções essenciais</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">check</span>
                            Responda pensando no seu comportamento real, não no ideal.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">timer</span>
                            Algumas perguntas têm tempo limitado de resposta.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">schedule_send</span>
                            Se não responder a tempo, o sistema seguirá automaticamente.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">favorite</span>
                            Confie na primeira resposta — ela é a mais valiosa.
                        </li>
                    </ul>
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <span className="material-symbols-outlined text-yellow-500">warning</span>
                    <p className="text-sm text-yellow-200">
                        <strong>Este não é um teste de conhecimento.</strong><br/>
                        É um diagnóstico de maturidade de liderança.
                    </p>
                </div>
            </div>
        </div>

        {/* 360 Toggle Section */}
        <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                 <div>
                    <h3 className="text-lg font-bold text-white">Avaliação 360° <span className="text-sm font-normal text-slate-500">(opcional)</span></h3>
                    <p className="text-sm text-slate-400">Você pode usar este mesmo instrumento para avaliar outro líder.</p>
                 </div>
                 <button
                    type="button"
                    onClick={toggle360}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 transition-all text-sm font-bold shadow-lg ${
                      is360 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/20' 
                        : 'bg-surface-dark border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white'
                    }`}
                 >
                    <span className="material-symbols-outlined text-lg">360</span>
                    {is360 ? 'Modo 360º Ativo' : 'Ativar Avaliação 360º'}
                 </button>
            </div>
            
            {is360 && (
              <div className="space-y-2 p-4 border border-purple-500/30 bg-purple-500/10 rounded-lg animate-fade-in">
                <label htmlFor="targetName" className="block text-sm font-bold text-white">
                  Nome do Líder Avaliado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                    <span className="material-symbols-outlined">person_search</span>
                  </div>
                  <input
                    type="text"
                    id="targetName"
                    required={is360}
                    value={targetLeaderName}
                    onChange={(e) => setTargetLeaderName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-500 transition-shadow sm:text-sm"
                    placeholder="Quem você está avaliando?"
                  />
                </div>
              </div>
            )}
        </div>

        {/* Form Header */}
        <div className="space-y-2 border-t border-gray-800 pt-6">
          <h2 className="text-2xl font-bold text-white">
             Informações profissionais
          </h2>
          <p className="text-base text-slate-400">
             Essas informações ajudam a calibrar a análise de acordo com seu contexto atual de liderança.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className={`grid grid-cols-1 gap-6 ${is360 ? 'opacity-70 transition-opacity' : ''}`}>
            <div className="space-y-2">
              <label htmlFor="fullname" className="block text-sm font-medium text-slate-300">
                Seu Nome Completo {is360 && <span className="text-xs text-gray-500">(Opcional)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input
                  type="text"
                  id="fullname"
                  required={!is360}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                  placeholder="Ex: Ana Silva"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  E-mail Corporativo {is360 && <span className="text-xs text-gray-500">(Opcional)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    required={!is360}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                    placeholder="voce@empresa.com.br"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-300">
                  WhatsApp {is360 && <span className="text-xs text-gray-500">(Opcional)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    required={!is360}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="company" className="block text-sm font-medium text-slate-300">
                  Empresa {is360 && <span className="text-xs text-gray-500">(Opcional)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined">business</span>
                  </div>
                  <input
                    type="text"
                    id="company"
                    required={!is360}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                  Cargo Atual {is360 && <span className="text-xs text-gray-500">(Opcional)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <input
                    type="text"
                    id="role"
                    required={!is360}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                    placeholder="Ex: Gerente de Operações"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {!is360 && (
                <>
                <label className="block text-sm font-medium text-slate-300">
                  Qual é o seu nível de liderança atual?
                </label>
                <div className="grid grid-cols-1 gap-4">
                {[
                    { 
                    val: LeadershipLevel.L1, 
                    label: 'L1 — Primeira liderança', 
                    sub: 'Lidera colaboradores individuais. Foco em operação, rotina e desenvolvimento do time.', 
                    icon: 'person' 
                    },
                    { 
                    val: LeadershipLevel.L2, 
                    label: 'L2 — Liderança intermediária', 
                    sub: 'Lidera outros líderes. Foco em integração de áreas, visão tática e sucessão.', 
                    icon: 'groups' 
                    },
                    { 
                    val: LeadershipLevel.L3, 
                    label: 'L3 — Alta liderança', 
                    sub: 'Lidera a organização. Foco em estratégia, cultura, visão de longo prazo e sustentabilidade.', 
                    icon: 'domain' 
                    },
                ].map((opt) => (
                    <label key={opt.val} className="relative cursor-pointer group">
                    <input
                        type="radio"
                        name="leadership_level"
                        value={opt.val}
                        checked={level === opt.val}
                        onChange={() => setLevel(opt.val)}
                        className="peer sr-only"
                    />
                    <div className="h-full p-4 rounded-xl border-2 border-gray-700 bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-start gap-4">
                        <div className="size-10 shrink-0 rounded-full bg-surface-darker flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                             <span className="material-symbols-outlined">{opt.icon}</span>
                        </div>
                        <div className="flex-grow">
                            <span className="block font-bold text-white text-base mb-1">{opt.label}</span>
                            <span className="text-sm text-slate-400 leading-relaxed block">{opt.sub}</span>
                        </div>
                        <div className="text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                             <span className="material-symbols-outlined filled">check_circle</span>
                        </div>
                    </div>
                    </label>
                ))}
                </div>
                </>
            )}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={is360 ? !targetLeaderName : (!name || !email || !company || !role || !whatsapp || !level)}
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/30"
            >
              <span>{is360 ? 'Iniciar Avaliação 360º' : 'Avançar'}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Visual/Inspirational */}
      <div className="lg:col-span-5 order-1 lg:order-2 hidden lg:block">
        <div className="sticky top-24">
          <div className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-2xl">
            {/* Background Image - Corporate Leader */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800")' }}
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>
            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 gap-6">
              <div className="size-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-white text-2xl font-bold leading-tight">
                  Análise de Perfil: Assessment que avalia o líder de maneira sistêmica
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-8 bg-primary"></div>
                  <p className="text-slate-300 text-sm font-medium">Liderança 360º</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Pilares</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">1h</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Tempo Estimado</p>
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