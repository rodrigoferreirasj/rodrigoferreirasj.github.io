import { LeadershipLevel, Question } from '../types';

export const questions: Question[] = [
  // --- COMUM (Applied to everyone) ---
  { id: 1, text: "Crio um ambiente seguro para que as pessoas expressem opiniões sem medo de julgamento.", block: "Liderança de Pessoas", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Segurança Psicológica", role: "Líder", inverted: false, horizon: 1 },
  { id: 2, text: "Forneço feedback específico e orientado para comportamento.", block: "Liderança de Pessoas", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Feedback & Desenvolvimento", role: "Líder", inverted: false, horizon: 0 },
  { id: 6, text: "Lido com conflitos assim que surgem, evitando acúmulo de tensões.", block: "Liderança de Pessoas", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Gestão de Conflitos", role: "Líder", inverted: false, horizon: 0 },
  { id: 10, text: "Evito conversas difíceis sempre que posso.", block: "Liderança de Pessoas", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Gestão de Conflitos", role: "Líder", inverted: true, horizon: 0 },
  { id: 13, text: "Estabeleço metas claras, mensuráveis e alcançáveis.", block: "Gestão e Execução", level: LeadershipLevel.Comum, axis: "Resultados", category: "Planejamento & Organização", role: "Gestor", inverted: false, horizon: 1 },
  { id: 16, text: "Tomo decisões mesmo com dados incompletos, quando necessário.", block: "Gestão e Execução", level: LeadershipLevel.Comum, axis: "Resultados", category: "Tomada de Decisão", role: "Gestor", inverted: false, horizon: 2 },
  { id: 22, text: "Costumo perder prazos porque subestimo o tempo necessário.", block: "Gestão e Execução", level: LeadershipLevel.Comum, axis: "Resultados", category: "Planejamento & Organização", role: "Gestor", inverted: true, horizon: 0 },
  { id: 26, text: "Compreendo como meu trabalho contribui para os objetivos estratégicos.", block: "Pensamento Estratégico", level: LeadershipLevel.Comum, axis: "Resultados", category: "Alinhamento & Direção", role: "Estrategista", inverted: false, horizon: 2 },
  { id: 39, text: "Incentivo ideias que desafiam o status quo.", block: "Inovação e Adaptabilidade", level: LeadershipLevel.Comum, axis: "Ambos", category: "Inovação & Melhoria", role: "Intraempreendedor", inverted: false, horizon: 3 },
  { id: 49, text: "Evito mudanças tecnológicas porque geralmente complicam o trabalho.", block: "Inovação e Adaptabilidade", level: LeadershipLevel.Comum, axis: "Ambos", category: "Adaptação & Aprendizagem", role: "Intraempreendedor", inverted: true, horizon: 1 },
  
  // --- L1 SPECIFIC (Líder de Si / Individual Contributor) ---
  { id: 51, text: "Conduzo conversas individuais semanais para acompanhar desenvolvimento e bem-estar.", block: "Liderança de Pessoas", level: LeadershipLevel.L1, axis: "Pessoas", category: "Feedback & Desenvolvimento", role: "Líder", inverted: false, horizon: 1 },
  { id: 53, text: "Uso os talentos (Pontos Fortes) da minha equipe como base para delegar e desenvolver.", block: "Liderança de Pessoas", level: LeadershipLevel.L1, axis: "Pessoas", category: "Delegação & Empowerment", role: "Líder", inverted: false, horizon: 1 },
  { id: 62, text: "Evito confrontar comportamentos inadequados para não gerar atrito.", block: "Liderança de Pessoas", level: LeadershipLevel.L1, axis: "Pessoas", category: "Gestão de Conflitos", role: "Líder", inverted: true, horizon: 0 },
  { id: 66, text: "Planejo a capacidade da equipe considerando ausências e prioridades.", block: "Gestão e Execução", level: LeadershipLevel.L1, axis: "Resultados", category: "Planejamento & Organização", role: "Gestor", inverted: false, horizon: 1 },
  { id: 81, text: "Explico o “porquê” por trás das tarefas para gerar significado.", block: "Contribuição Estratégica", level: LeadershipLevel.L1, axis: "Resultados", category: "Alinhamento & Direção", role: "Estrategista", inverted: false, horizon: 2 },
  
  // --- L2 SPECIFIC (Líder de Outros / Manager) ---
  { id: 101, text: "Conduzo sessões regulares de mentoria com líderes sob minha gestão.", block: "Desenvolvimento de Líderes", level: LeadershipLevel.L2, axis: "Pessoas", category: "Feedback & Desenvolvimento", role: "Líder", inverted: false, horizon: 2 },
  { id: 103, text: "Delego não apenas tarefas, mas autoridade real para tomada de decisão.", block: "Desenvolvimento de Líderes", level: LeadershipLevel.L2, axis: "Pessoas", category: "Delegação & Empowerment", role: "Líder", inverted: false, horizon: 2 },
  { id: 110, text: "Evito promover talentos porque isso causa escassez na minha área.", block: "Desenvolvimento de Líderes", level: LeadershipLevel.L2, axis: "Pessoas", category: "Delegação & Empowerment", role: "Líder", inverted: true, horizon: 2 },
  { id: 126, text: "Traduzo estratégia corporativa em planos táticos compreensíveis.", block: "Tradução Estratégica", level: LeadershipLevel.L2, axis: "Resultados", category: "Alinhamento & Direção", role: "Estrategista", inverted: false, horizon: 3 },
  { id: 139, text: "Crio espaços formais e informais para inovação dentro da área.", block: "Inovação e Adaptabilidade", level: LeadershipLevel.L2, axis: "Ambos", category: "Inovação & Melhoria", role: "Intraempreendedor", inverted: false, horizon: 3 },

  // --- L3 SPECIFIC (Líder de Líderes / Director) ---
  { id: 151, text: "Dedico tempo a desenvolver líderes seniores de forma estruturada.", block: "Liderança de Pessoas", level: LeadershipLevel.L3, axis: "Pessoas", category: "Feedback & Desenvolvimento", role: "Líder", inverted: false, horizon: 3 },
  { id: 155, text: "Desenvolvo múltiplos sucessores qualificados para minha própria posição.", block: "Liderança de Pessoas", level: LeadershipLevel.L3, axis: "Pessoas", category: "Planejamento & Organização", role: "Líder", inverted: false, horizon: 3 },
  { id: 163, text: "Estruturo organização para combinar agilidade com estabilidade.", block: "Arquitetura Organizacional", level: LeadershipLevel.L3, axis: "Resultados", category: "Planejamento & Organização", role: "Gestor", inverted: false, horizon: 3 },
  { id: 176, text: "Defino visão clara e inspiradora para orientar decisões corporativas.", block: "Estratégia Corporativa", level: LeadershipLevel.L3, axis: "Resultados", category: "Alinhamento & Direção", role: "Estrategista", inverted: false, horizon: 4 },
  
  // --- MATURIDADE INTERNA ---
  { id: 201, text: "Reconheço rapidamente quando minhas emoções estão influenciando minhas decisões.", block: "Maturidade Interna", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Autoconsciência", role: "Líder", inverted: false, horizon: 4 },
  { id: 206, text: "Busco feedback com genuíno desejo de evolução, não de validação.", block: "Maturidade Interna", level: LeadershipLevel.Comum, axis: "Pessoas", category: "Feedback & Desenvolvimento", role: "Líder", inverted: false, horizon: 4 },
];