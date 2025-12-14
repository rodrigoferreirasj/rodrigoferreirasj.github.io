import { Answers, Question, Dilemma, ScoreResult, LeadershipLevel, RoleResult, MatrixResult, ConsistencyResult, BlockResult, RoleValidation, CategoryValidation, OmissionAnalysis } from '../types';

// Map for Internal Consistency Checks (Specific Pairs Logic)
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

// Helper: Get Average
const getAvg = (stats: {sum: number, count: number}) => stats.count > 0 ? stats.sum / stats.count : 0;

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
  
  // Update Block Stats to track horizon frequency
  const blockStats: Record<string, { sum: number; count: number; horizonCounts: Record<number, number> }> = {};
  const categoryStats: Record<string, { sum: number; count: number }> = {};
  
  // Validation Stats (Specific for Dilemmas vs Roles)
  const roleValidationStats: Record<string, { sum: number; count: number }> = {};
  
  // Cluster Validation Stats (For Internal Consistency by Category)
  const categoryValidationStats: Record<string, number[]> = {};

  // Omission Tracking
  const totalQuestionsPresented = questions.length + dilemmas.length;
  let omissionCount = 0;
  const omissionMap: Record<string, number> = {}; // Category -> Count

  // Initialize standard roles
  ['Líder', 'Gestor', 'Estrategista', 'Intraempreendedor'].forEach(r => {
    roleStats[r] = { sum: 0, count: 0, horizons: {0: {sum:0, count:0}, 1: {sum:0, count:0}, 2: {sum:0, count:0}, 3: {sum:0, count:0}, 4: {sum:0, count:0}} };
    roleValidationStats[r] = { sum: 0, count: 0 };
  });

  const processStat = (val: number, weight: number, axis: string, roles: string[], horizons: number[], block: string, categories: string[]) => {
    const weightedVal = val * weight;
    const maxWeightedVal = 5 * weight;

    // Global (Count Once per question)
    globalWeightedSum += weightedVal;
    globalMaxSum += maxWeightedVal;

    // Axis (Handle "Ambos") (Count Once per question)
    if (axis === 'Ambos') {
      axisStats['Pessoas'].sum += val;
      axisStats['Pessoas'].count++;
      axisStats['Resultados'].sum += val;
      axisStats['Resultados'].count++;
    } else if (axisStats[axis]) {
      axisStats[axis].sum += val;
      axisStats[axis].count++;
    }

    // Role (Iterate all applied roles)
    roles.forEach(role => {
        if (roleStats[role]) {
            roleStats[role].sum += val;
            roleStats[role].count++;
            // Role Horizons (Iterate all horizons)
            horizons.forEach(h => {
                if (roleStats[role].horizons[h]) {
                    roleStats[role].horizons[h].sum += val;
                    roleStats[role].horizons[h].count++;
                }
            });
        }
    });

    // Horizon Global (Iterate all horizons)
    horizons.forEach(horizon => {
       if (!horizonStats[horizon]) horizonStats[horizon] = { sum: 0, count: 0 };
       horizonStats[horizon].sum += val;
       horizonStats[horizon].count++;
    });

    // Blocks (Count Once per question typically, but accumulate horizons)
    if (!blockStats[block]) {
      blockStats[block] = { sum: 0, count: 0, horizonCounts: {0:0, 1:0, 2:0, 3:0, 4:0} };
    }
    blockStats[block].sum += val;
    blockStats[block].count++;
    
    horizons.forEach(horizon => {
        blockStats[block].horizonCounts[horizon] = (blockStats[block].horizonCounts[horizon] || 0) + 1;
    });

    // Categories (Iterate all categories)
    categories.forEach(category => {
        if (!categoryStats[category]) categoryStats[category] = { sum: 0, count: 0 };
        categoryStats[category].sum += val;
        categoryStats[category].count++;
    });
  };

  const trackOmission = (categories: string[]) => {
      omissionCount++;
      categories.forEach(cat => {
          omissionMap[cat] = (omissionMap[cat] || 0) + 1;
      });
  };

  // 1. Process Standard Questions
  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      const rawVal = answers[q.id];

      // Handle Omission
      if (rawVal === null) {
          trackOmission(q.categories && q.categories.length > 0 ? q.categories : [q.category]);
          return; // Skip processing for scoring
      }

      // Inversion Logic: 1->5, 5->1. Scale is 1-5.
      // If user selected 5 on an inverted question, it becomes 1.
      const val = q.inverted ? (6 - rawVal) : rawVal; 
      
      const weight = getWeight(userLevel, q.horizon);
      
      // Determine arrays (fallback for single-tag questions)
      const qRoles = q.roles && q.roles.length > 0 ? q.roles : [q.role];
      const qCats = q.categories && q.categories.length > 0 ? q.categories : [q.category];
      const qHorizons = q.horizons && q.horizons.length > 0 ? q.horizons : [q.horizon];

      processStat(val, weight, q.axis, qRoles, qHorizons, q.block, qCats);

      // Collect for Dynamic Cluster Consistency Check
      qCats.forEach(cat => {
          if (!categoryValidationStats[cat]) {
              categoryValidationStats[cat] = [];
          }
          categoryValidationStats[cat].push(val);
      });
    }
  });

  // 2. Process Dilemmas (Treat as high-weight H3/H4 equivalent impact or standard weight)
  dilemmas.forEach((d) => {
    if (answers[d.id] !== undefined) {
      const val = answers[d.id];
      
      // Handle Omission
      if (val === null) {
          trackOmission([d.category]);
          return;
      }

      const weight = 1.0; 

      // Standard processing for Global/Axis/Horizon scores
      processStat(val, weight, d.axis, [d.role], [d.horizon], d.block, [d.category]);

      // --- VALIDATION LOGIC START ---
      // Accumulate for Validation (Primary Role)
      if (roleValidationStats[d.role]) {
          roleValidationStats[d.role].sum += val;
          roleValidationStats[d.role].count++;
      }
      // Accumulate for Validation (Secondary Role)
      if (d.secondaryRole && roleValidationStats[d.secondaryRole]) {
          roleValidationStats[d.secondaryRole].sum += val;
          roleValidationStats[d.secondaryRole].count++;
      }
      // --- VALIDATION LOGIC END ---
      
      // Also Add Dilemmas to Category Cluster Check
      if (!categoryValidationStats[d.category]) {
          categoryValidationStats[d.category] = [];
      }
      categoryValidationStats[d.category].push(val);
    }
  });

  // --- OMISSION ANALYSIS ---
  const readinessIndex = Math.round(100 - ((omissionCount / totalQuestionsPresented) * 100));
  
  // Identify most omitted categories
  const sortedOmissions = Object.entries(omissionMap).sort((a, b) => b[1] - a[1]);
  const mainImpactedCategories = sortedOmissions.slice(0, 3).map(([cat]) => cat);
  
  let omissionInterpretation = '';
  if (mainImpactedCategories.length > 0) {
      omissionInterpretation = `Você omitiu respostas principalmente em temas de ${mainImpactedCategories.join(', ')}. Isso pode indicar desconforto decisório ou necessidade de reflexão maior nessas áreas sob pressão.`;
  } else if (omissionCount === 0) {
      omissionInterpretation = "Você demonstrou alta prontidão decisória, respondendo a todos os itens dentro do tempo.";
  } else {
      omissionInterpretation = "Suas omissões foram dispersas, não indicando um padrão temático específico, mas sugerindo momentos pontuais de hesitação.";
  }

  const omissionAnalysis: OmissionAnalysis = {
      count: omissionCount,
      percentage: Math.round((omissionCount / totalQuestionsPresented) * 100),
      readinessIndex: Math.max(0, readinessIndex),
      mainImpactedCategories,
      interpretation: omissionInterpretation
  };


  // 3. Calculate Final Scores (0-10 Scale or 0-100 where needed)
  
  // Total Score (Weighted Percentage)
  const total = globalMaxSum > 0 ? Math.round((globalWeightedSum / globalMaxSum) * 100) : 0;

  // Axis Scores (0-5 Scale for Matrix)
  const peopleScore = getAvg(axisStats['Pessoas']);
  const resultsScore = getAvg(axisStats['Resultados']);

  // 4. Matrix 9-Box Logic
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

  // --- ROLE VALIDATION (Dilemmas vs Questions) ---
  const roleAlerts: string[] = [];
  Object.keys(rolesFinal).forEach(role => {
      const questionScore = rolesFinal[role].score; // Score from all inputs (dominated by questions)
      const dilemmaStats = roleValidationStats[role];
      const dilemmaScore = getAvg(dilemmaStats);

      // Only compare if we have dilemma data for this role
      if (dilemmaStats.count > 0) {
          const discrepancy = Math.abs(questionScore - dilemmaScore);
          
          // Threshold: 1.25 points difference on a 5-point scale is significant (approx 1 standard deviation gap)
          if (discrepancy > 1.25) {
              const type = questionScore > dilemmaScore ? 'superestimada' : 'subestimada';
              roleAlerts.push(
                  `Discrepância no papel de ${role}: Sua autoavaliação teórica (Nota: ${questionScore.toFixed(1)}) está ${type} em relação à sua tomada de decisão prática nos dilemas (Nota: ${dilemmaScore.toFixed(1)}).`
              );
          }
      }
  });

  const stdDev = calculateStdDev(roleAverages);
  
  // Revised Logic: Specific Thresholds based on Deviation and Role Scores
  let consistencyStatus: ConsistencyResult['status'] = 'Balanceado';
  let consistencyMsg = '';

  const transfScore = rolesFinal['Intraempreendedor']?.score || 0; // Assuming Intraempreendedor = Transformador role mapping
  const liderScore = rolesFinal['Líder']?.score || 0;
  const gestorScore = rolesFinal['Gestor']?.score || 0;
  
  // Determine if specific roles are low/high
  const rolesBelow3 = roleAverages.filter(s => s < 3.0).length;
  const rolesBelow2_8 = roleAverages.filter(s => s < 2.8).length;
  const rolesAbove4 = roleAverages.filter(s => s > 4.0).length;
  const rolesAbove4_5 = roleAverages.filter(s => s >= 4.5).length;
  const minRole = Math.min(...roleAverages);
  const maxRole = Math.max(...roleAverages);

  // 1. Contraditório check first (Rare pattern)
  if (transfScore >= 4.5 && (liderScore <= 2.5 || gestorScore <= 2.5)) {
    consistencyStatus = 'Contraditório';
    consistencyMsg = "Há um desalinhamento entre sua visão aspiracional e sua prática diária. Você pensa como líder sênior, mas opera como líder júnior. Isso reduz credibilidade e impacta o exemplo.";
  }
  // 2. Fragmentado
  else if (stdDev > 0.90 || rolesBelow2_8 >= 2 || (transfScore > 4.0 && minRole < 2.5)) {
    consistencyStatus = 'Fragmentado';
    consistencyMsg = "Seu perfil revela inconsistências importantes entre papéis fundamentais. Isso indica risco de decisões descoordenadas, impacto baixo na equipe e necessidade de desenvolvimento imediato.";
  }
  // 3. Desbalanceado
  else if ((stdDev >= 0.56 && stdDev <= 0.90) || (maxRole >= 4.5 && minRole <= 3.0)) {
    consistencyStatus = 'Desbalanceado';
    consistencyMsg = "Você possui forças claras, mas também fragilidades marcantes. Esse tipo de assimetria reduz eficiência operacional e estratégica.";
  }
  // 4. Consistente
  else if (stdDev <= 0.30 && minRole >= 3.0 && rolesAbove4 >= 2) {
    consistencyStatus = 'Consistente';
    consistencyMsg = "Você demonstra práticas equilibradas entre Liderança, Gestão, Estratégia, Intraempreendedorismo e Transformação. Seu perfil indica maturidade e coerência entre intenção e comportamento.";
  }
  // 5. Balanceado (Default fallthrough for 0.31 <= stdDev <= 0.55 or conditions not meeting Consistent)
  else {
    consistencyStatus = 'Balanceado';
    consistencyMsg = "Você apresenta tendências naturais em alguns papéis, mas mantém boa coerência geral. Há espaço para sofisticação em alguns papéis.";
  }

  // 6. Internal Consistency Check
  const internalInconsistencies: string[] = [];
  const categoryDetails: Record<string, CategoryValidation> = {};

  // A. Static Pairs Check (Existing)
  Object.keys(CONSISTENCY_MAP).forEach((key) => {
    const mainId = parseInt(key);
    const relatedIds = CONSISTENCY_MAP[mainId];
    
    // Check mainId for null
    if (answers[mainId] !== undefined && answers[mainId] !== null) {
      const validRelatedValues = relatedIds
        .map(id => {
            const q = questions.find(qu => qu.id === id);
            // Check related for null
            if(q && answers[id] !== undefined && answers[id] !== null) {
                return q.inverted ? (6 - (answers[id] as number)) : (answers[id] as number);
            }
            return null;
        })
        .filter(v => v !== null) as number[];

      if (validRelatedValues.length > 0) {
        const relatedAvg = validRelatedValues.reduce((a,b) => a+b, 0) / validRelatedValues.length;
        const mainQ = questions.find(q => q.id === mainId);
        const mainVal = mainQ?.inverted ? (6 - (answers[mainId] as number)) : (answers[mainId] as number);
        
        if (Math.abs(mainVal - relatedAvg) > 2.0) {
           internalInconsistencies.push(`Inconsistência detectada no tema de ${mainQ?.category || 'Comportamento'} (Q${mainId}).`);
        }
      }
    }
  });

  // B. Dynamic Cluster Check (Populate categoryDetails using SD)
  Object.entries(categoryValidationStats).forEach(([category, values]) => {
      let stdDev = 0;
      let status: 'Consistent' | 'Inconsistent' = 'Consistent';
      
      if (values.length > 1) {
          stdDev = calculateStdDev(values);
          // Threshold: SD >= 1.2 indicates significant variance (e.g. 1s and 5s mixed)
          if (stdDev >= 1.2) {
              status = 'Inconsistent';
              internalInconsistencies.push(`Inconsistência no cluster "${category}": alto desvio padrão (${stdDev.toFixed(2)}).`);
          }
      }

      categoryDetails[category] = { status, stdDev: Number(stdDev.toFixed(2)) };
  });

  const consistencyResult: ConsistencyResult = {
    stdDev: Number(stdDev.toFixed(2)),
    status: consistencyStatus,
    message: consistencyMsg,
    internalInconsistencies: Array.from(new Set(internalInconsistencies)),
    categoryDetails: categoryDetails // New Field
  };

  const roleValidationResult: RoleValidation = {
      alerts: roleAlerts
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

  // 8. Blocks & Categories (Normalized 0-5 scale)
  const blocksFinal: Record<string, BlockResult> = {};
  Object.keys(blockStats).forEach(k => {
    // Calculate dominant horizon for the block based on frequency
    let maxFreq = -1;
    let domHorizon = 0;
    Object.entries(blockStats[k].horizonCounts).forEach(([h, count]) => {
        if (count > maxFreq) {
            maxFreq = count;
            domHorizon = Number(h);
        }
    });

    blocksFinal[k] = {
        score: Number(getAvg(blockStats[k]).toFixed(2)),
        horizon: domHorizon
    };
  });

  const categoriesFinal: Record<string, number> = {};
  Object.keys(categoryStats).forEach(k => categoriesFinal[k] = Number(getAvg(categoryStats[k]).toFixed(2)));

  return {
    total,
    matrix: matrixResult,
    roles: rolesFinal,
    horizons: horizonsFinal,
    consistency: consistencyResult,
    roleValidation: roleValidationResult,
    predominantHorizon,
    blocks: blocksFinal,
    categories: categoriesFinal,
    omissionAnalysis
  };
};