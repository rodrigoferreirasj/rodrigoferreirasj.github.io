import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-surface-dark border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-surface-darker">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">help</span>
            <h2 className="text-xl font-bold text-white">Central de Ajuda</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
            
            {/* Block 1 */}
            <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    O que este assessment avalia
                </h3>
                <p>Este assessment integra cinco dimensões principais da liderança:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
                    <li>Pessoas</li>
                    <li>Resultados</li>
                    <li>Estratégia</li>
                    <li>Ética e coerência decisória</li>
                    <li>Inovação e adaptabilidade</li>
                </ul>
                <p className="mt-2">Essas dimensões são analisadas por meio de 4 papéis da liderança (Líder, Gestor, Estrategista e Intraempreendedor), horizontes temporais (H0 a H4) e perguntas de consistência.</p>
            </section>

            <div className="h-px bg-gray-800 w-full"></div>

            {/* Block 2 */}
            <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Sobre o tempo das perguntas
                </h3>
                <p>Algumas perguntas possuem tempo máximo de resposta para capturar sua reação instintiva:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
                    <li><strong>Perguntas de escala:</strong> 10 segundos</li>
                    <li><strong>Perguntas de cenário/dilema:</strong> tempo maior para leitura e escolha</li>
                </ul>
                <p className="mt-2 text-yellow-500/80 italic">Se três perguntas seguidas não forem respondidas, o sistema pausa automaticamente para verificar se você ainda está presente.</p>
            </section>

            <div className="h-px bg-gray-800 w-full"></div>

            {/* Block 3 */}
            <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Perguntas invertidas e de consistência
                </h3>
                <p>Algumas perguntas são formuladas de maneira inversa ou relacionadas entre si para avaliar coerência interna. Isso ajuda a identificar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
                    <li>Autoimagem inflada</li>
                    <li>Respostas socialmente desejáveis</li>
                    <li>Diferença entre discurso e prática</li>
                </ul>
            </section>

            <div className="h-px bg-gray-800 w-full"></div>

             {/* Block 4 */}
             <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Sobre os dilemas
                </h3>
                <p>Os dilemas simulam situações reais de liderança sob pressão. Eles revelam como você decide quando valores entram em conflito (ex.: resultado vs ética, autonomia vs controle).</p>
            </section>

            <div className="h-px bg-gray-800 w-full"></div>

            {/* Block 5 */}
            <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Confidencialidade
                </h3>
                <p>Todos os dados são tratados de forma confidencial. Os resultados pertencem exclusivamente a você ou à organização que conduziu a avaliação.</p>
            </section>

             <div className="h-px bg-gray-800 w-full"></div>

            {/* Block 6 */}
            <section className="space-y-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Como usar seus resultados
                </h3>
                <p>Ao final, você receberá:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
                    <li>Seu nível de maturidade em liderança</li>
                    <li>Pontos fortes consolidados</li>
                    <li>Gaps críticos e ocultos</li>
                    <li>Recomendações práticas de desenvolvimento</li>
                </ul>
                <p className="font-bold text-white mt-2">Este assessment não é um fim — é um ponto de partida para evolução consciente.</p>
            </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-surface-darker flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-surface-dark border border-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;