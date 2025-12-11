import { Answers, Question, Dilemma, ScoreResult, LeadershipLevel, RoleResult, MatrixResult, ConsistencyResult } from '../types';

// Map for Internal Consistency Checks
const CONSISTENCY_MAP: Record<number, number[]> = {
  10: [6],      // Q10 (Evito conversas difíceis) vs Q6 (Lido com conflitos)
  22: [13, 14], // Q22 (Perco prazos/subestimo tempo) vs Q13/14 (Metas/Acompanhamento)
  49: [40, 42], // Q49 (Evito tecnologia) vs Q40/42 (Novas abordagens/Adaptação)
  62: [6],      // Q62 (L1 Evito confrontar) vs Q6 (Lido com conflitos)
  80: [67, 69], // Q80 (L1 Problemas acumulam) vs Q67/69 (Monitoro/Prazos)
  99: [92, 93], // Q99 (L1 Evito mudanças proc) vs Q92/93 (Testo mudanças/Adapto)
  110: [102],   // Q110 (L2 Evito promover) vs Q102 (Desenvolvo para superar)
  149: [139],   // Q149 (L2 Evito mudança estrutural) vs Q139 (Espaços inovação) - Loosely related
  199: [193]    // Q199 (L3 Evito mudança radical) vs Q193 (Adaptação ágil)
};

// Helper: Calculate Standard Deviation
const calculateStdDev = (values: number[]): number => {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

// Helper: Get Weight based on Leadership Level and Question Horizon
const getWeight = (userLevel: LeadershipLevel, qHorizon: number): number => {
  // L1: High weight H0, H1
  if (userLevel === LeadershipLevel.L1) {
    if (qHorizon === 0 || qHorizon === 1) return 1.5;
    return 1.0;
  }
  // L2: Moderate weight H1, H2
  if (userLevel === LeadershipLevel.L2) {
    if (qHorizon === 1 || qHorizon === 2) return 1.25;
    return 1.0;
  }
  // L3: High weight H2, H3
  if (userLevel === LeadershipLevel.L3) {
    if (qHorizon === 2 || qHorizon === 3) return 1.5;
    return 1.0;
  }
  return 1.0;
};

export const calculateScores = (
    questions: Question[], 
    dilemmas: Dilemma[],
    answers: Answers, 
    userLevel: LeadershipLevel
): ScoreResult => {
  
  // Data Aggregation Structures
  let globalWeightedSum = 0;
  let globalMaxSum = 0;

  const axisStats: Record<string, { sum: number; count: number }> = {
    Pessoas: { sum: 0, count: 0 },
    Resultados: { sum: 0, count: 0 }
  };

  const roleStats: Record<string, { sum: number; count: number; horizons: Record<number, {sum: number, count: number}> }> = {};
  const horizonStats: Record<number, { sum: number; count: number }> = {};
  const blockStats: Record<string, { sum: number; count: number }> = {};
  const categoryStats: Record<string, { sum: number; count: number }> = {};

  // Initialize standard roles
  ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'].forEach(r => {
    roleStats[r] = { sum: 0, count: 0, horizons: {0: {sum:0, count:0}, 1: {sum:0, count:0}, 2: {sum:0, count:0}, 3: {sum:0, count:0}, 4: {sum:0, count:0}} };
  });

  // Helper to process a value into stats
  const processStat = (val: number, weight: number, axis: string, role: string, horizon: number, block: string, category: string) => {
    const weightedVal = val * weight;
    const maxWeightedVal = 5 * weight;

    // Global
    globalWeightedSum += weightedVal;
    globalMaxSum += maxWeightedVal;

    // Axis (Handle "Ambos")
    if (axis === 'Ambos') {
      axisStats['Pessoas'].sum += val;
      axisStats['Pessoas'].count++;
      axisStats['Resultados'].sum += val;
      axisStats['Resultados'].count++;
    } else if (axisStats[axis]) {
      axisStats[axis].sum += val;
      axisStats[axis].count++;
    }

    // Role
    if (roleStats[role]) {
      roleStats[role].sum += val;
      roleStats[role].count++;
      // Role Horizons (Default 0 if undefined for dilemmas)
      const h = horizon ?? 0;
      if (roleStats[role].horizons[h]) {
        roleStats[role].horizons[h].sum += val;
        roleStats[role].horizons[h].count++;
      }
    }

    // Horizon Global
    if (horizon !== undefined) {
       if (!horizonStats[horizon]) horizonStats[horizon] = { sum: 0, count: 0 };
       horizonStats[horizon].sum += val;
       horizonStats[horizon].count++;
    }

    // Blocks & Categories
    if (!blockStats[block]) blockStats[block] = { sum: 0, count: 0 };
    blockStats[block].sum += val;
    blockStats[block].count++;

    if (!categoryStats[category]) categoryStats[category] = { sum: 0, count: 0 };
    categoryStats[category].sum += val;
    categoryStats[category].count++;
  };

  // 1. Process Standard Questions
  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      const rawVal = answers[q.id];
      const val = q.inverted ? (6 - rawVal) : rawVal; // 1-5 Scale
      const weight = getWeight(userLevel, q.horizon);
      
      processStat(val, weight, q.axis, q.role, q.horizon, q.block, q.category);
    }
  });

  // 2. Process Dilemmas (Treat as high-weight H3/H4 equivalent impact or standard weight)
  // Dilemmas use IDs like 'D1', 'D2'. They are already scored 1, 3, 5.
  dilemmas.forEach((d) => {
    if (answers[d.id] !== undefined) {
      const val = answers[d.id];
      // We assume standard weight (1.0) for simplicity, or we could boost them. 
      // Since they are situational, we can treat them as Horizon 2 (Medium) for generic classification if undefined
      const impliedHorizon = 2; 
      const weight = 1.0; 

      processStat(val, weight, d.axis, d.role, impliedHorizon, d.block, d.category);
    }
  });

  // 3. Calculate Final Scores (0-10 Scale or 0-100 where needed)
  
  // Total Score (Weighted Percentage)
  const total = globalMaxSum > 0 ? Math.round((globalWeightedSum / globalMaxSum) * 100) : 0;

  // Axis Scores (0-5 Scale for Matrix)
  const getAvg = (stats: {sum: number, count: number}) => stats.count > 0 ? stats.sum / stats.count : 0;
  
  const peopleScore = getAvg(axisStats['Pessoas']);
  const resultsScore = getAvg(axisStats['Resultados']);

  // 4. Matrix 9-Quadrant Logic
  const getRange = (val: number): 'Low' | 'Med' | 'High' => {
    if (val < 2.5) return 'Low';
    if (val < 4.0) return 'Med';
    return 'High';
  };

  const pRange = getRange(peopleScore);
  const rRange = getRange(resultsScore);

  let quadrant = 5;
  let quadrantName = 'Equilibrado';

  if (pRange === 'Low' && rRange === 'Low') { quadrant = 1; quadrantName = 'Técnico'; }
  else if (pRange === 'Med' && rRange === 'Low') { quadrant = 2; quadrantName = 'Executor'; }
  else if (pRange === 'High' && rRange === 'Low') { quadrant = 3; quadrantName = 'Demandante'; }
  else if (pRange === 'Low' && rRange === 'Med') { quadrant = 4; quadrantName = 'Relacional'; }
  else if (pRange === 'Med' && rRange === 'Med') { quadrant = 5; quadrantName = 'Equilibrado'; }
  else if (pRange === 'High' && rRange === 'Med') { quadrant = 6; quadrantName = 'Estratégico'; }
  else if (pRange === 'Low' && rRange === 'High') { quadrant = 7; quadrantName = 'Inspirador'; }
  else if (pRange === 'Med' && rRange === 'High') { quadrant = 8; quadrantName = 'Construtor'; }
  else if (pRange === 'High' && rRange === 'High') { quadrant = 9; quadrantName = 'Completo'; }

  const matrixResult: MatrixResult = {
    x: Number(peopleScore.toFixed(2)),
    y: Number(resultsScore.toFixed(2)),
    quadrant,
    quadrantName
  };

  // 5. Role Consistency
  const rolesFinal: Record<string, RoleResult> = {};
  const roleAverages: number[] = [];

  Object.keys(roleStats).forEach(r => {
    const avg = getAvg(roleStats[r]);
    roleAverages.push(avg);
    
    // Process horizons within role
    const hResult: Record<number, number> = {};
    for(let i=0; i<=4; i++) {
        hResult[i] = Number(getAvg(roleStats[r].horizons[i]).toFixed(1));
    }

    rolesFinal[r] = {
      score: Number(avg.toFixed(2)),
      horizons: hResult
    };
  });

  const stdDev = calculateStdDev(roleAverages);
  let consistencyStatus: ConsistencyResult['status'] = 'Balanceado';
  let consistencyMsg = '';

  const transformatorScore = rolesFinal['Intraempreendedor']?.score || 0;
  const leaderScore = rolesFinal['Líder']?.score || 0;
  const managerScore = rolesFinal['Gestor']?.score || 0;

  if (transformatorScore >= 4.5 && (leaderScore <= 2.5 || managerScore <= 2.5)) {
    consistencyStatus = 'Contraditório';
    consistencyMsg = "Há um desalinhamento entre sua visão aspiracional e sua prática diária.";
  } else if (stdDev > 0.90) {
    consistencyStatus = 'Fragmentado';
    consistencyMsg = "Seu perfil revela inconsistências importantes entre papéis fundamentais.";
  } else if (stdDev >= 0.56) {
    consistencyStatus = 'Desbalanceado';
    consistencyMsg = "Você possui forças claras, mas fragilidades marcantes em outros papéis.";
  } else if (stdDev >= 0.31) {
    consistencyStatus = 'Balanceado';
    consistencyMsg = "Você apresenta tendências naturais em alguns papéis, mas mantém boa coerência geral.";
  } else {
    consistencyStatus = 'Consistente';
    consistencyMsg = "Você demonstra práticas equilibradas e maturidade entre intenção e comportamento.";
  }

  // 6. Internal Consistency Check (Questions Only for now)
  const internalInconsistencies: string[] = [];
  Object.keys(CONSISTENCY_MAP).forEach((key) => {
    const mainId = parseInt(key);
    const relatedIds = CONSISTENCY_MAP[mainId];
    
    if (answers[mainId] !== undefined) {
      const validRelatedValues = relatedIds
        .map(id => {
            const q = questions.find(qu => qu.id === id);
            if(q && answers[id] !== undefined) {
                return q.inverted ? (6 - answers[id]) : answers[id];
            }
            return null;
        })
        .filter(v => v !== null) as number[];

      if (validRelatedValues.length > 0) {
        const relatedAvg = validRelatedValues.reduce((a,b) => a+b, 0) / validRelatedValues.length;
        const mainQ = questions.find(q => q.id === mainId);
        const mainVal = mainQ?.inverted ? (6 - answers[mainId]) : answers[mainId];
        
        if (Math.abs(mainVal - relatedAvg) > 2.0) {
           internalInconsistencies.push(`Inconsistência detectada no tema de ${mainQ?.category || 'Comportamento'} (Q${mainId}).`);
        }
      }
    }
  });

  const consistencyResult: ConsistencyResult = {
    stdDev: Number(stdDev.toFixed(2)),
    status: consistencyStatus,
    message: consistencyMsg,
    internalInconsistencies
  };

  // 7. Horizons Global
  const horizonsFinal: Record<number, number> = {};
  let maxHScore = -1;
  let predominantHorizon = 0;

  for(let i=0; i<=4; i++) {
    const avg = horizonStats[i] ? getAvg(horizonStats[i]) : 0;
    horizonsFinal[i] = Number(avg.toFixed(1));
    if (avg > maxHScore) {
        maxHScore = avg;
        predominantHorizon = i;
    }
  }

  // 8. Blocks & Categories (Normalized 0-10)
  const blocksFinal: Record<string, number> = {};
  Object.keys(blockStats).forEach(k => blocksFinal[k] = Number((getAvg(blockStats[k]) * 2).toFixed(1)));

  const categoriesFinal: Record<string, number> = {};
  Object.keys(categoryStats).forEach(k => categoriesFinal[k] = Number((getAvg(categoryStats[k]) * 2).toFixed(1)));

  return {
    total,
    matrix: matrixResult,
    roles: rolesFinal,
    horizons: horizonsFinal,
    consistency: consistencyResult,
    predominantHorizon,
    blocks: blocksFinal,
    categories: categoriesFinal
  };
};