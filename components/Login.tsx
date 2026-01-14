
import React, { useState } from 'react';
import { validateAccessKey } from '../services/authService';

interface Props {
  onLoginSuccess: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 4) {
      value = value.replace(/^(\d\d)(\d\d)(\d{0,4})/, '$1/$2/$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d\d)(\d{0,2})/, '$1/$2');
    }
    setDate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic Validation
    if (!email || date.length !== 10 || !accessKey) {
      setError('Por favor, preencha todos os campos corretamente.');
      setIsLoading(false);
      return;
    }

    const isValid = await validateAccessKey(email, date, accessKey);

    if (isValid) {
      onLoginSuccess();
    } else {
      setError('A chave informada não é válida para os dados fornecidos. Verifique os dados ou entre em contato para suporte.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark animate-fade-in">
       {/* Background Elements */}
       <div className="fixed top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
       <div className="fixed bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

       <div className="w-full max-w-md bg-surface-dark border border-gray-700 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-12 flex items-center justify-center text-primary bg-primary/10 rounded-xl">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
            <p className="text-slate-400 text-center text-sm">
              Insira seus dados de compra para acessar o Assessment de Liderança.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-300">E-mail cadastrado</label>
               <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-3 text-slate-500">mail</span>
                 <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-darker border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder-slate-600"
                    placeholder="exemplo@email.com"
                    required
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-300">Data da Compra</label>
               <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-3 text-slate-500">calendar_month</span>
                 <input 
                    type="text" 
                    value={date}
                    onChange={handleDateChange}
                    className="w-full bg-surface-darker border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder-slate-600"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    required
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-300">Chave de Acesso</label>
               <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-3 text-slate-500">key</span>
                 <input 
                    type="password" 
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full bg-surface-darker border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder-slate-600 font-mono"
                    placeholder="Cole sua chave aqui"
                    required
                 />
               </div>
             </div>

             {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                 <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">error</span>
                 <p className="text-sm text-red-400 leading-snug">{error}</p>
               </div>
             )}

             <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">login</span>
                    Acessar Sistema
                  </>
                )}
             </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Precisa de ajuda? <a href="#" className="text-primary hover:underline">Entre em contato com o suporte</a>.
            </p>
          </div>
       </div>
    </div>
  );
};

export default Login;
