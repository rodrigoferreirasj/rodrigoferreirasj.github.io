import { Answers, Question, ScoreResult, LeadershipLevel, RoleResult, MatrixResult, ConsistencyResult } from '../types';

// Map for Internal Consistency Checks
const CONSISTENCY_MAP: Record<number, number[]> = {
  10: [6, 9, 24],
  22: [14, 20, 21, 24],
  49: [39, 40, 41, 42],
  62: [51, 53], // Adjusted for sample subset
  110: [103, 101] // Adjusted for sample subset
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
  // L2: Moderate weight H1, H2 (interpreted as slightly higher than others)
  if (userLevel === LeadershipLevel.L2) {
    if (qHorizon === 1 || qHorizon === 2) return 1.25;
    return 1.0;
  }
  // L3: High weight H2, H3
  if (userLevel === LeadershipLevel.L3) {
    if (qHorizon === 2 || qHorizon === 3) return 1.5;
    return 1.0;
  }
  // L4 or Comum default
  return 1.0;
};

export const calculateScores = (questions: Question[], answers: Answers, userLevel: LeadershipLevel): ScoreResult => {
  
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

  // 1. Process Answers
  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      const rawVal = answers[q.id];
      const val = q.inverted ? (6 - rawVal) : rawVal; // 1-5 Scale
      const weight = getWeight(userLevel, q.horizon);
      const weightedVal = val * weight;
      const maxWeightedVal = 5 * weight;

      // Global
      globalWeightedSum += weightedVal;
      globalMaxSum += maxWeightedVal;

      // Axis (Handle "Ambos")
      if (q.axis === 'Ambos') {
        axisStats['Pessoas'].sum += val;
        axisStats['Pessoas'].count++;
        axisStats['Resultados'].sum += val;
        axisStats['Resultados'].count++;
      } else if (axisStats[q.axis]) {
        axisStats[q.axis].sum += val;
        axisStats[q.axis].count++;
      }

      // Role
      if (roleStats[q.role]) {
        roleStats[q.role].sum += val;
        roleStats[q.role].count++;
        // Role Horizons
        roleStats[q.role].horizons[q.horizon].sum += val;
        roleStats[q.role].horizons[q.horizon].count++;
      }

      // Horizon Global
      if (!horizonStats[q.horizon]) horizonStats[q.horizon] = { sum: 0, count: 0 };
      horizonStats[q.horizon].sum += val;
      horizonStats[q.horizon].count++;

      // Blocks & Categories
      if (!blockStats[q.block]) blockStats[q.block] = { sum: 0, count: 0 };
      blockStats[q.block].sum += val;
      blockStats[q.block].count++;

      if (!categoryStats[q.category]) categoryStats[q.category] = { sum: 0, count: 0 };
      categoryStats[q.category].sum += val;
      categoryStats[q.category].count++;
    }
  });

  // 2. Calculate Final Scores (0-10 Scale or 0-100 where needed)
  
  // Total Score (Weighted Percentage)
  const total = globalMaxSum > 0 ? Math.round((globalWeightedSum / globalMaxSum) * 100) : 0;

  // Axis Scores (0-5 Scale for Matrix)
  const getAvg = (stats: {sum: number, count: number}) => stats.count > 0 ? stats.sum / stats.count : 0;
  
  const peopleScore = getAvg(axisStats['Pessoas']);
  const resultsScore = getAvg(axisStats['Resultados']);

  // 3. Matrix 9-Quadrant Logic
  // Ranges: Low (0-2.5), Med (2.5-4.0), High (4.0-5.0)
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

  // 4. Role Consistency
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

  // Transformator logic check (Assuming Intraempreendedor maps loosely to Transformator here for demo, or based on H4)
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

  // 5. Internal Consistency Check
  const internalInconsistencies: string[] = [];
  Object.keys(CONSISTENCY_MAP).forEach((key) => {
    const mainId = parseInt(key);
    const relatedIds = CONSISTENCY_MAP[mainId];
    
    if (answers[mainId] !== undefined) {
      // Find valid related answers
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
        
        if (Math.abs(mainVal - relatedAvg) > 1.5) {
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

  // 6. Horizons Global
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

  // 7. Blocks & Categories (Normalized 0-10)
  const blocksFinal: Record<string, number> = {};
  Object.keys(blockStats).forEach(k => blocksFinal[k] = Number((getAvg(blockStats[k]) * 2).toFixed(1))); // 1-5 to 0-10 mapping approx

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