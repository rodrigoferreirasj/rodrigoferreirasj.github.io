
import { Answers, Question, Dilemma, ScoreResult, LeadershipLevel, RoleResult, ConsistencyResult, BlockResult, OmissionAnalysis, SpeedAnalysis, GallupResult, CategoryValidation, BehavioralConsistency } from '../types';

const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

const getWeight = (userLevel: LeadershipLevel, qHorizon: number): number => {
  if (userLevel === LeadershipLevel.L1) return (qHorizon === 0 || qHorizon === 1) ? 1.5 : 1.0;
  if (userLevel === LeadershipLevel.L2) return (qHorizon === 1 || qHorizon === 2) ? 1.25 : 1.0;
  if (userLevel === LeadershipLevel.L3) return (qHorizon === 2 || qHorizon === 3) ? 1.5 : 1.0;
  return 1.0;
};

const getAvg = (stats: {sum: number, count: number}) => stats.count > 0 ? stats.sum / stats.count : 0;

export const calculateScores = (
    questions: Question[], 
    dilemmas: Dilemma[],
    answers: Answers, 
    userLevel: LeadershipLevel,
    speedAnalysis: SpeedAnalysis = { instinctive: 0, natural: 0, reflexive: 0 }
): ScoreResult => {
  
  let globalWeightedSum = 0;
  let globalMaxSum = 0;

  const axisStats: Record<string, { sum: number; count: number }> = { Pessoas: { sum: 0, count: 0 }, Resultados: { sum: 0, count: 0 } };
  const roleStats: Record<string, { sum: number; count: number; horizons: Record<number, {sum: number, count: number}> }> = {};
  const horizonStats: Record<number, { sum: number; count: number }> = {};
  const blockStats: Record<string, { sum: number; count: number; hCounts: Record<number, {sum: number, count: number}> }> = {};
  const categoryStats: Record<string, { sum: number; count: number; hCounts: Record<number, {sum: number, count: number}>, values: number[] }> = {};
  const needStats: Record<string, { sum: number; count: number; hCounts: Record<number, {sum: number, count: number}> }> = {};
  const skillStats: Record<string, { sum: number; count: number; hCounts: Record<number, {sum: number, count: number}> }> = {};

  // Auxiliares para consistência comportamental
  const scaleStats: Record<string, { sum: number; count: number }> = {};
  const scenarioStats: Record<string, { sum: number; count: number }> = {};

  ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'].forEach(r => {
    roleStats[r] = { sum: 0, count: 0, horizons: {0: {sum:0, count:0}, 1: {sum:0, count:0}, 2: {sum:0, count:0}, 3: {sum:0, count:0}, 4: {sum:0, count:0}} };
    scaleStats[r] = { sum: 0, count: 0 };
    scenarioStats[r] = { sum: 0, count: 0 };
  });

  const processStat = (val: number, weight: number, axis: string, roles: string[], horizons: number[], block: string, categories: string[], needs: string[] = [], skills: string[] = [], isScenario = false) => {
    const weightedVal = val * weight;
    const maxWeightedVal = 5 * weight;
    globalWeightedSum += weightedVal; globalMaxSum += maxWeightedVal;
    
    if (axis === 'Ambos') {
      axisStats['Pessoas'].sum += val; axisStats['Pessoas'].count++;
      axisStats['Resultados'].sum += val; axisStats['Resultados'].count++;
    } else if (axisStats[axis]) { axisStats[axis].sum += val; axisStats[axis].count++; }
    
    roles.forEach(role => {
        if (roleStats[role]) {
            roleStats[role].sum += val; roleStats[role].count++;
            horizons.forEach(h => { if (roleStats[role].horizons[h]) { roleStats[role].horizons[h].sum += val; roleStats[role].horizons[h].count++; } });
            
            // Tracking para consistência
            if (isScenario) {
              scenarioStats[role].sum += val; scenarioStats[role].count++;
            } else {
              scaleStats[role].sum += val; scaleStats[role].count++;
            }
        }
    });
    
    horizons.forEach(h => { if (!horizonStats[h]) horizonStats[h] = { sum: 0, count: 0 }; horizonStats[h].sum += val; horizonStats[h].count++; });
    
    if (!blockStats[block]) blockStats[block] = { sum: 0, count: 0, hCounts: {0:{sum:0,count:0}, 1:{sum:0,count:0}, 2:{sum:0,count:0}, 3:{sum:0,count:0}, 4:{sum:0,count:0}} };
    blockStats[block].sum += val; blockStats[block].count++;
    horizons.forEach(h => { blockStats[block].hCounts[h].sum += val; blockStats[block].hCounts[h].count++; });
    
    needs.forEach(n => {
        if (!needStats[n]) needStats[n] = { sum: 0, count: 0, hCounts: {0:{sum:0,count:0}, 1:{sum:0,count:0}, 2:{sum:0,count:0}, 3:{sum:0,count:0}, 4:{sum:0,count:0}} };
        needStats[n].sum += val; needStats[n].count++;
        horizons.forEach(h => { needStats[n].hCounts[h].sum += val; needStats[n].hCounts[h].count++; });
        if (isScenario) {
          if (!scenarioStats[n]) scenarioStats[n] = { sum: 0, count: 0 };
          scenarioStats[n].sum += val; scenarioStats[n].count++;
        } else {
          if (!scaleStats[n]) scaleStats[n] = { sum: 0, count: 0 };
          scaleStats[n].sum += val; scaleStats[n].count++;
        }
    });
    
    skills.forEach(s => {
        if (!skillStats[s]) skillStats[s] = { sum: 0, count: 0, hCounts: {0:{sum:0,count:0}, 1:{sum:0,count:0}, 2:{sum:0,count:0}, 3:{sum:0,count:0}, 4:{sum:0,count:0}} };
        skillStats[s].sum += val; skillStats[s].count++;
        horizons.forEach(h => { skillStats[s].hCounts[h].sum += val; skillStats[s].hCounts[h].count++; });
        if (isScenario) {
          if (!scenarioStats[s]) scenarioStats[s] = { sum: 0, count: 0 };
          scenarioStats[s].sum += val; scenarioStats[s].count++;
        } else {
          if (!scaleStats[s]) scaleStats[s] = { sum: 0, count: 0 };
          scaleStats[s].sum += val; scaleStats[s].count++;
        }
    });
    
    categories.forEach(c => { 
        if (!categoryStats[c]) categoryStats[c] = { sum: 0, count: 0, hCounts: {0:{sum:0,count:0}, 1:{sum:0,count:0}, 2:{sum:0,count:0}, 3:{sum:0,count:0}, 4:{sum:0,count:0}}, values: [] }; 
        categoryStats[c].sum += val; categoryStats[c].count++;
        categoryStats[c].values.push(val);
        horizons.forEach(h => { categoryStats[c].hCounts[h].sum += val; categoryStats[c].hCounts[h].count++; });
        if (isScenario) {
          if (!scenarioStats[c]) scenarioStats[c] = { sum: 0, count: 0 };
          scenarioStats[c].sum += val; scenarioStats[c].count++;
        } else {
          if (!scaleStats[c]) scaleStats[c] = { sum: 0, count: 0 };
          scaleStats[c].sum += val; scaleStats[c].count++;
        }
    });
  };

  const normalizedAnswers: Record<number, number> = {};
  questions.forEach(q => {
    if (answers[q.id] !== undefined && answers[q.id] !== null) {
      normalizedAnswers[q.id] = q.inverted ? 6 - (answers[q.id] as number) : (answers[q.id] as number);
    }
  });

  const impactedCategories: Record<string, number> = {};
  let omissionCount = 0;
  
  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      const rawVal = answers[q.id];
      if (rawVal === null) { omissionCount++; impactedCategories[q.category] = (impactedCategories[q.category] || 0) + 1; return; }
      const val = normalizedAnswers[q.id];
      const weight = getWeight(userLevel, q.horizon);
      processStat(val, weight, q.axis, [q.role], [q.horizon], q.block, [q.category], q.needs, q.skills, false);
    }
  });

  dilemmas.forEach((d) => {
    if (answers[d.id] !== undefined) {
      const val = answers[d.id];
      if (val === null) { omissionCount++; return; }
      const roles = [d.role]; if (d.secondaryRole) roles.push(d.secondaryRole);
      let n: string[] = []; let s: string[] = [];
      if (d.id === 'D1') { n = ['Confiança', 'Estabilidade']; s = ['Criar accountability', 'Pensar criticamente', 'Inspirar']; }
      if (d.id === 'D2') { n = ['Confiança', 'Estabilidade']; s = ['Desenvolver pessoas', 'Criar accountability', 'Construir relacionamentos']; }
      if (d.id === 'D3') { n = ['Esperança', 'Estabilidade']; s = ['Liderar mudanças', 'Pensar criticamente', 'Inspirar']; }
      if (d.id === 'D4') { n = ['Confiança', 'Compaixão']; s = ['Comunicar com clareza', 'Construir relacionamentos', 'Criar accountability']; }
      processStat(val || 0, 1.0, d.axis, roles, [d.horizon], d.block, [d.category], n, s, true);
    }
  });

  // Cálculo da Consistência Comportamental
  const consistencyDetails: BehavioralConsistency['details'] = [];
  let totalDiff = 0;
  Object.keys(scenarioStats).forEach(key => {
    if (scenarioStats[key].count > 0 && scaleStats[key]?.count > 0) {
      const scenarioAvg = getAvg(scenarioStats[key]);
      const scaleAvg = getAvg(scaleStats[key]);
      const diff = Math.abs(scenarioAvg - scaleAvg);
      totalDiff += diff;
      consistencyDetails.push({
        item: key,
        scaleScore: Number(scaleAvg.toFixed(2)),
        scenarioScore: Number(scenarioAvg.toFixed(2)),
        diff: Number(diff.toFixed(2))
      });
    }
  });

  const avgDiff = consistencyDetails.length > 0 ? totalDiff / consistencyDetails.length : 0;
  const consistencyScore = Math.max(0, 100 - (avgDiff * 25));
  let behavioralStatus: BehavioralConsistency['status'] = 'Alta';
  let behavioralMessage = "Suas respostas nos dilemas práticos são altamente coerentes com sua autoimagem nas perguntas de escala. Isso indica uma liderança consciente e íntegra.";
  
  if (avgDiff > 1.25) {
    behavioralStatus = 'Baixa';
    behavioralMessage = "Existe uma discrepância significativa entre como você se vê (escala) e como decide em situações práticas (dilemas). Isso pode indicar 'pontos cegos' onde sua prática diverge do seu discurso ou intenção.";
  } else if (avgDiff > 0.65) {
    behavioralStatus = 'Moderada';
    behavioralMessage = "Você apresenta uma boa base de consistência, mas há situações específicas onde suas decisões práticas divergem da sua autoimagem. Vale observar os detalhes abaixo.";
  }

  const findDominantHorizon = (hCounts: Record<number, {sum:number, count:number}>) => {
    let maxAvg = -1; let domH = 0;
    Object.entries(hCounts).forEach(([h, stat]) => {
        const avg = getAvg(stat);
        if (avg >= maxAvg && stat.count > 0) { maxAvg = avg; domH = Number(h); }
    });
    return domH;
  };

  const roleAverages = ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'].map(r => getAvg(roleStats[r]));
  const roleStdDev = calculateStdDev(roleAverages);

  const categoryDetails: Record<string, CategoryValidation> = {};
  Object.keys(categoryStats).forEach(c => {
    const stdDev = calculateStdDev(categoryStats[c].values);
    categoryDetails[c] = {
      stdDev: Number(stdDev.toFixed(2)),
      status: stdDev < 0.75 ? 'Consistent' : 'Inconsistent'
    };
  });

  let consistencyStatus: ConsistencyResult['status'] = 'Balanceado';
  if (roleStdDev < 0.6) consistencyStatus = 'Consistente';
  else if (roleStdDev > 1.2) consistencyStatus = 'Desbalanceado';
  
  let message = "Você apresenta tendências naturais em alguns papéis, mas mantém boa coerência geral.";
  if (consistencyStatus === 'Consistente') message = "Seu perfil é altamente integrado, apresentando equilíbrio entre as frentes de gestão e liderança.";
  if (consistencyStatus === 'Desbalanceado') message = "Existe uma disparidade acentuada entre seus papéis. Sugerimos focar no desenvolvimento das áreas com menor pontuação.";
  
  const peopleScore = getAvg(axisStats['Pessoas']);
  const resultsScore = getAvg(axisStats['Resultados']);
  const horizonsFinal: Record<number, number> = {};
  for(let i=0; i<=4; i++) horizonsFinal[i] = Number(getAvg(horizonStats[i] || {sum:0,count:0}).toFixed(1));

  const needsFinal: Record<string, GallupResult> = {};
  Object.keys(needStats).forEach(k => { needsFinal[k] = { score: Number(getAvg(needStats[k]).toFixed(2)), horizon: findDominantHorizon(needStats[k].hCounts) }; });
  
  const skillsFinal: Record<string, GallupResult> = {};
  Object.keys(skillStats).forEach(k => { skillsFinal[k] = { score: Number(getAvg(skillStats[k]).toFixed(2)), horizon: findDominantHorizon(skillStats[k].hCounts) }; });

  const blocksFinal: Record<string, BlockResult> = {};
  Object.keys(blockStats).forEach(k => {
    blocksFinal[k] = { score: Number(getAvg(blockStats[k]).toFixed(2)), horizon: findDominantHorizon(blockStats[k].hCounts) };
  });

  const categoriesFinal: Record<string, GallupResult> = {};
  Object.keys(categoryStats).forEach(k => {
    categoriesFinal[k] = { score: Number(getAvg(categoryStats[k]).toFixed(2)), horizon: findDominantHorizon(categoryStats[k].hCounts) };
  });

  const rolesFinal: Record<string, RoleResult> = {};
  ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'].forEach(r => {
    const hRes: Record<number, number> = {};
    for(let i=0; i<=4; i++) hRes[i] = Number(getAvg(roleStats[r].horizons[i]).toFixed(1));
    rolesFinal[r] = { score: Number(getAvg(roleStats[r]).toFixed(2)), horizons: hRes };
  });

  return {
    total: globalMaxSum > 0 ? Math.round((globalWeightedSum / globalMaxSum) * 100) : 0,
    matrix: { x: peopleScore, y: resultsScore, quadrant: 5, quadrantName: 'Equilibrado' },
    roles: rolesFinal, horizons: horizonsFinal,
    consistency: { stdDev: Number(roleStdDev.toFixed(2)), status: consistencyStatus, message, internalInconsistencies: [], categoryDetails },
    behavioralConsistency: { score: Math.round(consistencyScore), status: behavioralStatus, message: behavioralMessage, details: consistencyDetails },
    roleValidation: { alerts: [] },
    predominantHorizon: findDominantHorizon(horizonStats),
    blocks: blocksFinal, 
    categories: categoriesFinal,
    omissionAnalysis: { count: omissionCount, percentage: 0, readinessIndex: Math.max(0, 100 - (omissionCount * 2)), mainImpactedCategories: [], interpretation: "" },
    speedAnalysis, needs: needsFinal, skills: skillsFinal
  };
};
