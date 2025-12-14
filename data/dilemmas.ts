
import { Dilemma } from '../types';

export const dilemmas: Dilemma[] = [
  {
    id: 'D1',
    title: 'Performance vs Ética',
    scenario: 'Um cliente solicita uma "flexibilização" que aceleraria uma venda importante, mas essa ação fere o processo de compliance estabelecido pela empresa.',
    block: 'Etica, Integridade e Propósito',
    axis: 'Ambos',
    category: 'Tomada de Decisão Ética',
    role: 'Líder', // Principal
    secondaryRole: 'Estrategista', // Secundário
    horizon: 4, 
    options: [
      { text: 'Aceito a solicitação para garantir o batimento da meta.', value: 1 }, 
      { text: 'Consulto as áreas responsáveis e decido com cautela.', value: 3 }, 
      { text: 'Recuso a solicitação e explico ao cliente a razão ligada aos valores da empresa.', value: 5 } 
    ]
  },
  {
    id: 'D2',
    title: 'Autonomia vs Controle',
    scenario: 'Um líder júnior da sua equipe vem tomando decisões operacionais que você, pessoalmente, não tomaria daquela forma.',
    block: 'Desenvolvimento de Líderes',
    axis: 'Pessoas',
    category: 'Delegação & Empowerment',
    role: 'Gestor', // CORRIGIDO: Papel Principal conforme solicitado (Gestor)
    secondaryRole: 'Líder', // Secundário
    horizon: 1, 
    options: [
      { text: 'Reforço o controle e passo a centralizar as decisões.', value: 1 }, 
      { text: 'Alinho os limites de atuação e passo a acompanhar mais de perto.', value: 3 }, 
      { text: 'Dou autonomia estruturada, permitindo o erro controlado e focando no desenvolvimento.', value: 5 } 
    ]
  },
  {
    id: 'D3',
    title: 'Curto vs Longo Prazo',
    scenario: 'A empresa exige resultados imediatos para fechar o trimestre, mas pressionar a equipe agora traz um alto risco de desgaste (burnout) e turnover.',
    block: 'Gestão e Execução',
    axis: 'Resultados',
    category: 'Gestão de Performance',
    role: 'Estrategista', // CORRIGIDO: Papel Principal conforme solicitado (Estrategista)
    secondaryRole: 'Gestor', // Secundário
    horizon: 3, 
    options: [
      { text: 'Foco totalmente no curto prazo para garantir o número.', value: 1 }, 
      { text: 'Negocio os prazos possíveis e busco um equilíbrio paliativo.', value: 3 }, 
      { text: 'Priorizo a sustentabilidade do time e ajusto as entregas com total transparência sobre os riscos.', value: 5 } 
    ]
  },
  {
    id: 'D4',
    title: 'Verdade vs Harmonia',
    scenario: 'Uma pessoa chave da equipe, muito querida por todos, cometeu um erro importante que afetou o resultado.',
    block: 'Maturidade Interna',
    axis: 'Pessoas',
    category: 'Gestão de Conflitos & Conversas Difíceis',
    role: 'Líder', // Principal
    secondaryRole: 'Gestor', // Secundário
    horizon: 2, 
    options: [
      { text: 'Evito a conversa difícil para não tensionar o ambiente.', value: 1 }, 
      { text: 'Falo com a pessoa, mas suavizo ao máximo a mensagem para não chatear.', value: 3 }, 
      { text: 'Converso com transparência, cuidado e responsabilidade, abordando o fato claramente.', value: 5 } 
    ]
  },
  {
    id: 'D5',
    title: 'Exploração vs Exploração Segura',
    scenario: 'Surge uma oportunidade de testar uma nova solução que pode gerar vantagem competitiva, mas ainda não há garantias claras de retorno e há risco de desperdício de recursos.',
    block: 'Inovação e Adaptabilidade',
    axis: 'Ambos',
    category: 'Inovação & Melhoria Contínua',
    role: 'Intraempreendedor', // Principal
    secondaryRole: 'Estrategista', // Secundário
    horizon: 2, // H2 (Médio prazo/Inovação)
    options: [
      { text: 'Evito a iniciativa para não correr riscos e prefiro manter o modelo atual.', value: 1 }, 
      { text: 'Aguardo mais dados, aprovações ou garantias antes de avançar.', value: 3 }, 
      { text: 'Testo a iniciativa em pequena escala, com critérios claros de aprendizado e risco controlado.', value: 5 } 
    ]
  },
  {
    id: 'D6',
    title: 'Inovação vs Eficiência Atual',
    scenario: 'A equipe está sobrecarregada para cumprir metas operacionais, mas existe uma oportunidade de inovar que pode reduzir esforço e gerar ganhos futuros.',
    block: 'Inovação e Adaptabilidade',
    axis: 'Ambos',
    category: 'Adaptação & Aprendizagem Contínua',
    role: 'Intraempreendedor', // Principal
    secondaryRole: 'Gestor', // Secundário
    horizon: 1, // H1 (Eficiência Imediata vs Futura)
    options: [
      { text: 'Abandono qualquer tentativa de inovação para focar apenas na entrega imediata.', value: 1 }, 
      { text: 'Deixo a inovação para depois, quando “sobrar tempo”.', value: 3 }, 
      { text: 'Protejo tempo e recursos mínimos para experimentação, mesmo mantendo a operação funcionando.', value: 5 } 
    ]
  }
];
