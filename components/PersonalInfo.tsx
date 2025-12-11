import React from 'react';
import { LeadershipLevel, UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const PersonalInfo: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [level, setLevel] = React.useState<LeadershipLevel | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && level) {
      onComplete({ name, email, level });
    }
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-fade-in">
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

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Informações Pessoais
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Vamos começar construindo o seu perfil. Preencha seus dados para calibrarmos a análise de liderança.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullname" className="block text-sm font-medium text-slate-300">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input
                  type="text"
                  id="fullname"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                  placeholder="Ex: Ana Silva"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-surface-dark border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-slate-500 transition-shadow sm:text-sm"
                  placeholder="voce@empresa.com.br"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="block text-sm font-medium text-slate-300">
              Qual seu nível de liderança atual?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { val: LeadershipLevel.L1, label: 'Primeira liderança (L1)', sub: 'Líder de si / Início', icon: 'person' },
                { val: LeadershipLevel.L2, label: 'Liderança intermediária (L2)', sub: 'Gestão de pessoas', icon: 'groups' },
                { val: LeadershipLevel.L3, label: 'Alta liderança (L3)', sub: 'Estratégia e cultura', icon: 'domain' },
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
                  <div className="h-full p-4 rounded-xl border-2 border-gray-700 bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex flex-col gap-3">
                    <div className="size-10 rounded-full bg-surface-darker flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">{opt.icon}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-white text-sm">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.sub}</span>
                    </div>
                    <div className="absolute top-4 right-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined filled">check_circle</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={!name || !email || !level}
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/30"
            >
              <span>Avançar</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Visual/Inspirational */}
      <div className="lg:col-span-5 order-1 lg:order-2 hidden lg:block">
        <div className="sticky top-24">
          <div className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-2xl">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: 'url("https://picsum.photos/800/1200?grayscale&blur=2")' }}
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-purple-900/40 mix-blend-overlay"></div>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 gap-6">
              <div className="size-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <span className="material-symbols-outlined">format_quote</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-white text-2xl font-bold leading-tight">
                  "A liderança não é sobre ser o melhor. É sobre fazer todos os outros melhores."
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-8 bg-primary"></div>
                  <p className="text-slate-300 text-sm font-medium">Liderança Moderna</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Pilares</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">15m</p>
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