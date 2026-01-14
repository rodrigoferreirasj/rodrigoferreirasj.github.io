
import { LeadershipLevel, Question, HorizonLevel } from '../types';

// Helper for 360 questions (Level is always Comum/All for 360)
const create360 = (
  id: number,
  text: string,
  block: string,
  axis: string,
  categories: string[],
  roles: string[],
  horizonsString: string[]
): Question => {
  // Map string horizons "H0" to numbers
  const horizonsMap: Record<string, number> = { "H0": 0, "H1": 1, "H2": 2, "H3": 3, "H4": 4 };
  const horizons = horizonsString.map(h => horizonsMap[h] ?? 0) as HorizonLevel[];
  
  return {
    id,
    text,
    block,
    level: LeadershipLevel.Comum,
    axis,
    inverted: false,
    // Primaries (take first one as default for legacy logic if needed, though scoring service handles arrays now)
    category: categories[0],
    role: roles[0],
    horizon: horizons[0],
    // Multi-tagging
    categories,
    roles,
    horizons,
    // Fix: Add missing properties to satisfy Question interface
    needs: [],
    skills: []
  };
};

export const questions360: Question[] = [
  create360(1, "Cria um ambiente onde as pessoas se sentem seguras para falar, discordar e contribuir, mesmo sob pressão.", "Pessoas", "Pessoas", ["Segurança Psicológica", "Comunicação"], ["Líder"], ["H0", "H1"]),
  create360(2, "Dá feedback claro e específico, conectando comportamento, impacto e expectativas futuras.", "Pessoas", "Pessoas", ["Feedback", "Desenvolvimento"], ["Líder"], ["H1"]),
  create360(3, "Reconhece contribuições de forma justa e personalizada, mesmo quando os resultados ainda não apareceram.", "Pessoas", "Pessoas", ["Reconhecimento", "Motivação"], ["Líder"], ["H1"]),
  create360(4, "Ajusta sua comunicação conforme o perfil das pessoas e o contexto da decisão.", "Pessoas", "Pessoas", ["Comunicação", "Individualização"], ["Líder"], ["H0", "H1"]),
  create360(5, "Enfrenta conversas difíceis com clareza, respeito e foco em solução.", "Pessoas", "Pessoas", ["Conflitos", "Comunicação"], ["Líder"], ["H0"]),
  create360(6, "Demonstra interesse genuíno no desenvolvimento das pessoas, conectando feedback a crescimento real.", "Pessoas", "Pessoas", ["Desenvolvimento", "Engajamento"], ["Líder"], ["H1"]),
  create360(7, "Mantém presença e escuta ativa mesmo em momentos de alta pressão ou conflito.", "Pessoas", "Pessoas", ["Empatia", "Autogestão Emocional"], ["Líder"], ["H0"]),
  create360(8, "Delega responsabilidades com clareza, oferecendo autonomia compatível com maturidade e contexto.", "Pessoas", "Pessoas", ["Delegação", "Empowerment"], ["Líder", "Gestor"], ["H1"]),
  create360(9, "Constrói confiança por meio de coerência entre discurso, decisões e ações.", "Pessoas", "Pessoas", ["Confiança", "Valores"], ["Líder"], ["H1"]),
  create360(10, "Explica o “porquê” das decisões, conectando tarefas a propósito e impacto.", "Pessoas", "Pessoas", ["Sentido", "Alinhamento"], ["Líder", "Estrategista"], ["H1"]),
  create360(11, "Define prioridades com base em impacto e não apenas urgência.", "Execução", "Resultados", ["Priorização", "Planejamento"], ["Gestor"], ["H0", "H1"]),
  create360(12, "Acompanha entregas com disciplina, sem recorrer a microgerenciamento.", "Execução", "Resultados", ["Execução", "Autonomia"], ["Gestor"], ["H0"]),
  create360(13, "Mantém qualidade e previsibilidade mesmo sob pressão por resultados.", "Execução", "Resultados", ["Performance", "Autogestão"], ["Gestor"], ["H0"]),
  create360(14, "Usa dados para decidir e ajustar rotas, evitando decisões baseadas apenas em achismos.", "Execução", "Resultados", ["Decisão", "Análise"], ["Gestor"], ["H1"]),
  create360(15, "Antecipa riscos e prepara alternativas antes que problemas se tornem críticos.", "Execução", "Resultados", ["Gestão de Riscos", "Decisão"], ["Gestor"], ["H1"]),
  create360(16, "Garante aderência a processos sem engessar a operação.", "Execução", "Resultados", ["Qualidade", "Eficiência"], ["Gestor"], ["H0"]),
  create360(17, "Conduz reuniões objetivas, com decisões claras e responsáveis definidos.", "Execução", "Resultados", ["Alinhamento", "Execução"], ["Gestor"], ["H0"]),
  create360(18, "Aprende com erros operacionais e ajusta processos para evitar recorrência.", "Execução", "Resultados", ["Aprendizagem", "Melhoria"], ["Gestor"], ["H1"]),
  create360(19, "Equilibra eficiência de curto prazo com sustentabilidade da equipe.", "Execução", "Ambos", ["Performance", "Pessoas"], ["Gestor", "Líder"], ["H1"]),
  create360(20, "Mantém disciplina operacional sem perder flexibilidade quando o contexto muda.", "Execução", "Resultados", ["Adaptação", "Planejamento"], ["Gestor"], ["H1"]),
  create360(21, "Conecta decisões do dia a dia aos objetivos estratégicos maiores.", "Estratégia", "Resultados", ["Alinhamento", "Visão"], ["Estrategista"], ["H2"]),
  create360(22, "Traduz estratégia em direcionamentos claros e acionáveis para o time.", "Estratégia", "Resultados", ["Comunicação", "Execução"], ["Estrategista"], ["H1", "H2"]),
  create360(23, "Analisa impactos de médio e longo prazo antes de decidir.", "Estratégia", "Resultados", ["Decisão Complexa"], ["Estrategista"], ["H2"]),
  create360(24, "Enxerga conexões entre áreas e promove sinergias reais.", "Estratégia", "Resultados", ["Pensamento Sistêmico"], ["Estrategista"], ["H2"]),
  create360(25, "Ajusta planos estratégicos quando o contexto externo muda.", "Estratégia", "Resultados", ["Adaptação", "Visão"], ["Estrategista"], ["H2"]),
  create360(26, "Considera expectativas de clientes e stakeholders ao tomar decisões relevantes.", "Estratégia", "Resultados", ["Relacionamento", "Valor"], ["Estrategista"], ["H2"]),
  create360(27, "Comunica visão de futuro de forma clara e inspiradora.", "Estratégia", "Resultados", ["Visão", "Influência"], ["Estrategista", "Líder"], ["H2", "H3"]),
  create360(28, "Contribui com insights estratégicos além de sua área direta.", "Estratégia", "Resultados", ["Pensamento Sistêmico"], ["Estrategista"], ["H2"]),
  create360(29, "Sustenta decisões estratégicas mesmo quando são impopulares no curto prazo.", "Estratégia", "Resultados", ["Coragem", "Coerência"], ["Estrategista"], ["H2", "H3"]),
  create360(30, "Usa aprendizados do passado para orientar decisões futuras.", "Estratégia", "Resultados", ["Aprendizagem"], ["Estrategista"], ["H2"]),
  create360(31, "Incentiva ideias que desafiam o status quo de forma responsável.", "Inovação", "Ambos", ["Inovação", "Cultura"], ["Intraempreendedor"], ["H1", "H2"]),
  create360(32, "Cria espaço seguro para experimentação e aprendizado.", "Inovação", "Ambos", ["Inovação", "Pessoas"], ["Intraempreendedor", "Líder"], ["H1"]),
  create360(33, "Testa melhorias em pequena escala antes de expandir.", "Inovação", "Ambos", ["Experimentação"], ["Intraempreendedor"], ["H1"]),
  create360(34, "Aprende com falhas sem buscar culpados.", "Inovação", "Ambos", ["Aprendizagem", "Cultura"], ["Intraempreendedor"], ["H0", "H1"]),
  create360(35, "Busca referências externas para aprimorar práticas internas.", "Inovação", "Ambos", ["Benchmark", "Aprendizagem"], ["Intraempreendedor"], ["H2"]),
  create360(36, "Conecta inovação a resultados concretos.", "Inovação", "Ambos", ["Valor", "Execução"], ["Intraempreendedor"], ["H1", "H2"]),
  create360(37, "Protege iniciativas inovadoras da pressão excessiva por curto prazo.", "Inovação", "Ambos", ["Sustentabilidade"], ["Intraempreendedor"], ["H2"]),
  create360(38, "Colabora com diferentes áreas para gerar soluções novas.", "Inovação", "Ambos", ["Colaboração"], ["Intraempreendedor"], ["H1"]),
  create360(39, "Mantém abertura a novas ideias mesmo sob pressão.", "Inovação", "Ambos", ["Autogestão", "Inovação"], ["Intraempreendedor"], ["H0"]),
  create360(40, "Ajusta rapidamente métodos de trabalho diante de novas tecnologias.", "Inovação", "Ambos", ["Adaptação"], ["Intraempreendedor"], ["H1"]),
  create360(41, "Demonstra coerência entre valores declarados e decisões práticas.", "Ética/Consciência", "Ambos", ["Valores", "Coerência"], ["Líder"], ["H3", "H4"]),
  create360(42, "Toma decisões éticas mesmo quando há custo de curto prazo.", "Ética/Consciência", "Resultados", ["Ética", "Coragem"], ["Líder", "Estrategista"], ["H3"]),
  create360(43, "Age com responsabilidade considerando impactos sociais e culturais.", "Ética/Consciência", "Ambos", ["Stakeholders"], ["Estrategista"], ["H3"]),
  create360(44, "Sustenta decisões impopulares quando alinhadas a valores.", "Ética/Consciência", "Ambos", ["Coerência"], ["Líder"], ["H3"]),
  create360(45, "Evita atalhos que comprometam cultura e confiança.", "Ética/Consciência", "Ambos", ["Cultura", "Ética"], ["Líder"], ["H2", "H3"]),
  create360(46, "Demonstra clareza sobre o legado que deseja construir.", "Ética/Consciência", "Ambos", ["Propósito"], ["Estrategista"], ["H4"]),
  create360(47, "Conecta propósito a decisões estratégicas.", "Ética/Consciência", "Ambos", ["Propósito", "Estratégia"], ["Estrategista"], ["H4"]),
  create360(48, "Influencia positivamente outros líderes pelo exemplo.", "Ética/Consciência", "Ambos", ["Exemplo", "Cultura"], ["Líder"], ["H3"]),
  create360(49, "Mantém integridade mesmo quando ninguém está observando.", "Ética/Consciência", "Ambos", ["Ética"], ["Líder"], ["H3", "H4"]),
  create360(50, "Inspira confiança por sua maturidade, coerência e visão de futuro.", "Síntese", "Ambos", ["Maturidade Integrada"], ["Líder", "Gestor", "Estrategista", "Intraempreendedor"], ["H2", "H3", "H4"]),
];
