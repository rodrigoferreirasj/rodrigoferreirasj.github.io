import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)'}} onClick={onClose}></div>
      <div className="card animate-fade-in" style={{width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'}}>
        
        <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-darker)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">help</span>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold'}}>Central de Ajuda</h2>
          </div>
          <button onClick={onClose} style={{background: 'transparent', border: 'none', color: 'var(--text-gray)', cursor: 'pointer'}}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6}}>
            <section>
                <h3 style={{color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <span style={{width: 4, height: 20, background: 'var(--primary)', borderRadius: 99}}></span>
                    O que este assessment avalia
                </h3>
                <p>Este assessment integra cinco dimensões principais da liderança:</p>
                <ul style={{listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-gray)'}}>
                    <li>Pessoas</li>
                    <li>Resultados</li>
                    <li>Estratégia</li>
                    <li>Ética e coerência decisória</li>
                    <li>Inovação e adaptabilidade</li>
                </ul>
            </section>

            <div style={{height: 1, background: 'var(--border-color)'}}></div>

            <section>
                <h3 style={{color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <span style={{width: 4, height: 20, background: 'var(--primary)', borderRadius: 99}}></span>
                    Sobre o tempo das perguntas
                </h3>
                <p>Algumas perguntas possuem tempo máximo de resposta para capturar sua reação instintiva:</p>
                <ul style={{listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-gray)'}}>
                    <li><strong>Perguntas de escala:</strong> 10 segundos</li>
                    <li><strong>Perguntas de cenário/dilema:</strong> tempo maior para leitura e escolha</li>
                </ul>
                <p style={{marginTop: '0.5rem', color: 'var(--accent-yellow)', fontStyle: 'italic'}}>Se três perguntas seguidas não forem respondidas, o sistema pausa automaticamente.</p>
            </section>
        </div>

        <div style={{padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-darker)', display: 'flex', justifyContent: 'flex-end'}}>
            <button onClick={onClose} className="btn btn-outline">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;