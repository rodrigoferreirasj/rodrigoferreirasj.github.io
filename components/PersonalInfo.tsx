
import React, { useState } from 'react';
import { LeadershipLevel, UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

const PersonalInfo: React.FC<Props> = ({ onComplete, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [level, setLevel] = useState<LeadershipLevel | null>(null);
  const [is360, setIs360] = useState(false);
  const [targetLeaderName, setTargetLeaderName] = useState('');

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
    else if (value.length > 0) value = value.replace(/^(\d*)/, '($1');
    setWhatsapp(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (is360 && targetLeaderName) {
        onComplete({ name: name || 'Avaliador', email: email || 'anonimo@360.com', company: company || 'N/A', role: role || 'Avaliador', whatsapp: whatsapp || '00000000000', level: LeadershipLevel.Comum, is360: true, targetLeaderName });
    } else if (name && email && company && role && whatsapp && level) {
        onComplete({ name, email, company, role, whatsapp, level, is360: false });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col gap-3 mb-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-primary uppercase tracking-[0.2em]">Passo 1 de 4 • Perfil</span>
          <span className="text-sm text-slate-500 font-bold">25% Completo</span>
        </div>
        <div className="h-1.5 w-full bg-surface-dark rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: '25%' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Coluna Esquerda: Dados Cadastrais */}
        <div className="space-y-8 bg-surface-dark/40 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Informações Básicas</h2>
            <p className="text-slate-400 text-sm">Dados necessários para identificação e envio do relatório.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Nome Completo</label>
              <input type="text" required={!is360} value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-darker border border-gray-700 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Rodrigo Andrade" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 tracking-widest">E-mail</label>
                <input type="email" required={!is360} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface-darker border border-gray-700 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="voce@empresa.com" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 tracking-widest">WhatsApp</label>
                <input type="tel" required={!is360} value={whatsapp} onChange={handleWhatsappChange} className="w-full bg-surface-darker border border-gray-700 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Empresa</label>
                <input type="text" required={!is360} value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-surface-darker border border-gray-700 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Nome da empresa" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Cargo</label>
                <input type="text" required={!is360} value={role} onChange={e => setRole(e.target.value)} className="w-full bg-surface-darker border border-gray-700 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Diretor de RH" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex gap-4">
             <button type="button" onClick={onBack} className="px-8 py-4 border border-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/5 transition-all">Voltar</button>
             <button type="submit" disabled={is360 ? !targetLeaderName : (!name || !email || !level)} className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-30 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-primary/20 transition-all active:scale-95">Iniciar Jornada</button>
          </div>
        </div>

        {/* Coluna Direita: Nível de Liderança e Modo 360 */}
        <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Contexto de Liderança</h2>
              <p className="text-slate-400 text-sm">Selecione seu nível atual para calibrarmos as questões.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {[
                    { val: LeadershipLevel.L1, label: 'L1 — Líder de Si e Operação', sub: 'Foco em execução direta, rotina e autogestão profissional.', icon: 'person' },
                    { val: LeadershipLevel.L2, label: 'L2 — Líder de Outros e Times', sub: 'Lidera equipes diretas. Foco em feedback, pessoas e integração.', icon: 'groups' },
                    { val: LeadershipLevel.L3, label: 'L3 — Líder de Líderes e Org.', sub: 'Foco em estratégia, cultura, sucessão e visão sistêmica.', icon: 'domain' },
                ].map((opt) => (
                    <label key={opt.val} className="relative cursor-pointer group">
                        <input type="radio" name="level" checked={level === opt.val} onChange={() => setLevel(opt.val)} className="peer sr-only" />
                        <div className="p-6 rounded-[2rem] border-2 border-gray-800 bg-surface-dark/40 hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-center gap-6 shadow-xl">
                            <div className="size-14 rounded-2xl bg-surface-darker flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">{opt.icon}</span>
                            </div>
                            <div className="flex-1">
                                <span className="block font-black text-white text-lg mb-1">{opt.label}</span>
                                <span className="text-sm text-slate-500 font-medium leading-tight block">{opt.sub}</span>
                            </div>
                            <div className="text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined filled text-3xl">check_circle</span>
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            {/* Modo 360º */}
            <div className="p-8 rounded-[2rem] bg-purple-600/10 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-purple-400 uppercase text-xs tracking-widest">Avaliação 360°</h3>
                        <p className="text-sm text-slate-400">Deseja avaliar outro líder?</p>
                    </div>
                    <button type="button" onClick={() => setIs360(!is360)} className={`size-12 rounded-2xl border-2 flex items-center justify-center transition-all ${is360 ? 'bg-purple-600 border-purple-600 text-white' : 'border-purple-600/50 text-purple-600'}`}>
                        <span className="material-symbols-outlined">{is360 ? '360' : 'add'}</span>
                    </button>
                </div>
                {is360 && (
                    <div className="animate-slide-in-right space-y-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Nome do Líder Avaliado</label>
                             <input type="text" value={targetLeaderName} onChange={e => setTargetLeaderName(e.target.value)} className="w-full bg-black/20 border border-purple-500/30 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Diretor João Silva" />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            * Ao ativar o modo 360, as perguntas serão formuladas na terceira pessoa e você avaliará o comportamento observado no líder alvo.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfo;
