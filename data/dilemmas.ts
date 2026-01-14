
import { Dilemma } from '../types';

export const dilemmas: Dilemma[] = [
  {
    id: 'D1',
    title: 'Performance vs Ética',
    scenario: 'Um cliente solicita uma “flexibilização” que aceleraria uma venda, mas fere o processo.',
    block: 'Etica, Integridade e Propósito',
    axis: 'Ambos',
    category: 'Tomada de Decisão Ética',
    role: 'Gestor', 
    secondaryRole: 'Estrategista',
    horizon: 4, 
    options: [
      { text: 'Aceito para bater a meta.', value: 1 }, 
      { text: 'Consulto áreas e decido com cautela.', value: 3 }, 
      { text: 'Recuso e explico a razão ligada a valores.', value: 5 } 
    ]
  },
  {
    id: 'D2',
    title: 'Autonomia vs Controle',
    scenario: 'Um líder júnior vem tomando decisões que você não tomaria.',
    block: 'Desenvolvimento de Líderes',
    axis: 'Pessoas',
    category: 'Delegação & Empowerment',
    role: 'Líder', 
    secondaryRole: 'Intraempreendedor',
    horizon: 1, 
    options: [
      { text: 'Reforço controle e centralizo.', value: 1 }, 
      { text: 'Alinho limites e acompanho de perto.', value: 3 }, 
      { text: 'Dou autonomia estruturada e foco no desenvolvimento.', value: 5 } 
    ]
  },
  {
    id: 'D3',
    title: 'Curto vs Longo Prazos',
    scenario: 'A empresa quer resultados rápidos, mas há risco de desgaste da equipe.',
    block: 'Gestão e Execução',
    axis: 'Resultados',
    category: 'Gestão de Performance',
    role: 'Estrategista', 
    secondaryRole: 'Gestor',
    horizon: 3, 
    options: [
      { text: 'Foco totalmente no curto prazo.', value: 1 }, 
      { text: 'Negocio prazos e busco equilíbrio.', value: 3 }, 
      { text: 'Prioriza sustentabilidade e ajusta entregas com transparência.', value: 5 } 
    ]
  },
  {
    id: 'D4',
    title: 'Verdade vs Harmonia',
    scenario: 'Uma pessoa chave cometeu um erro importante.',
    block: 'Maturidade Interna',
    axis: 'Pessoas',
    category: 'Gestão de Conflitos & Conversas Difíceis',
    role: 'Líder', 
    secondaryRole: 'Gestor',
    horizon: 2, 
    options: [
      { text: 'Evito a conversa para não tensionar.', value: 1 }, 
      { text: 'Falo, mas suavizo ao máximo.', value: 3 }, 
      { text: 'Falo com transparência, cuidado e responsabilidade.', value: 5 } 
    ]
  }
];
