import { Dilemma } from '../types';

export const dilemmas: Dilemma[] = [
  {
    id: 'D1',
    title: 'Performance vs Ética',
    scenario: 'Um cliente solicita uma "flexibilização" que aceleraria uma venda importante, mas essa ação fere o processo de compliance estabelecido pela empresa.',
    block: 'Etica, Integridade e Propósito',
    axis: 'Ambos',
    category: 'Tomada de Decisão Ética',
    role: 'Líder',
    options: [
      { text: 'Aceito a solicitação para garantir o batimento da meta.', value: 1 }, // Baixa
      { text: 'Consulto as áreas responsáveis e decido com cautela.', value: 3 }, // Média
      { text: 'Recuso a solicitação e explico ao cliente a razão ligada aos valores da empresa.', value: 5 } // Alta
    ]
  },
  {
    id: 'D2',
    title: 'Autonomia vs Controle',
    scenario: 'Um líder júnior da sua equipe vem tomando decisões operacionais que você, pessoalmente, não tomaria daquela forma.',
    block: 'Desenvolvimento de Líderes',
    axis: 'Pessoas',
    category: 'Delegação & Empowerment',
    role: 'Líder',
    options: [
      { text: 'Reforço o controle e passo a centralizar as decisões.', value: 1 }, // Baixa
      { text: 'Alinho os limites de atuação e passo a acompanhar mais de perto.', value: 3 }, // Média
      { text: 'Dou autonomia estruturada, permitindo o erro controlado e focando no desenvolvimento.', value: 5 } // Alta
    ]
  },
  {
    id: 'D3',
    title: 'Curto vs Longo Prazo',
    scenario: 'A empresa exige resultados imediatos para fechar o trimestre, mas pressionar a equipe agora traz um alto risco de desgaste (burnout) e turnover.',
    block: 'Gestão e Execução',
    axis: 'Resultados',
    category: 'Gestão de Performance',
    role: 'Gestor',
    options: [
      { text: 'Foco totalmente no curto prazo para garantir o número.', value: 1 }, // Baixa
      { text: 'Negocio os prazos possíveis e busco um equilíbrio paliativo.', value: 3 }, // Média
      { text: 'Priorizo a sustentabilidade do time e ajusto as entregas com total transparência sobre os riscos.', value: 5 } // Alta
    ]
  },
  {
    id: 'D4',
    title: 'Verdade vs Harmonia',
    scenario: 'Uma pessoa chave da equipe, muito querida por todos, cometeu um erro importante que afetou o resultado.',
    block: 'Maturidade Interna',
    axis: 'Pessoas',
    category: 'Gestão de Conflitos & Conversas Difíceis',
    role: 'Líder',
    options: [
      { text: 'Evito a conversa difícil para não tensionar o ambiente.', value: 1 }, // Baixa
      { text: 'Falo com a pessoa, mas suavizo ao máximo a mensagem para não chatear.', value: 3 }, // Média
      { text: 'Converso com transparência, cuidado e responsabilidade, abordando o fato claramente.', value: 5 } // Alta
    ]
  }
];