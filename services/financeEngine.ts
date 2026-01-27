import { SimulationParams, ScenarioType, MonthlyResult, YearAudit } from '../types';
import { MONTH_NAMES } from '../constants';

/**
 * ENGINE FINANCEIRA UNIFICADA - TKX FRANCA
 * Regras Aplicadas: Teto 500 motoristas, SOM 15.00%, Sazonalidade Granular e Churn Dinâmico.
 */

export const calculateProjections = (
  params: SimulationParams,
  scenario: ScenarioType,
  modo: 'Simulação' | 'Real' = 'Simulação'
): MonthlyResult[] => {
  const results: MonthlyResult[] = [];
  
  // --- TRAVAS ESTRATÉGICAS ---
  const TETO_MOTORISTAS_FINAL = 500;
  const marketPopulation = typeof params.marketPopulation === 'number' ? params.marketPopulation : 350000;
  const marketSamPercent = typeof params.marketSamPercent === 'number' ? params.marketSamPercent : 50;
  const marketSam = marketPopulation * (marketSamPercent / 100);
  const marketSomPercent = typeof params.marketSomPercent === 'number' ? params.marketSomPercent : 15;
  const MAX_USERS_POSSIVEIS = marketSam * (marketSomPercent / 100);
  const TAKE_RATE_PADRAO = 0.15; // 15.00%
  const TECH_FEE_FIXED = 0.70; // Taxa de Tecnologia fixa por corrida

  // Sazonalidade Mensal (Pesos de Mercado de Franca)
  const SAZONALIDADE: Record<number, number> = {
    0: 0.85, 1: 0.90, 2: 1.05, 3: 1.00, 4: 1.15, 5: 0.95,
    6: 0.90, 7: 1.05, 8: 1.00, 9: 1.10, 10: 1.20, 11: 1.40
  };

  const multiplicadores = {
    [ScenarioType.PESSIMISTA]: 0.75,
    [ScenarioType.REALISTA]: 1.00,
    [ScenarioType.OTIMISTA]: 1.35
  };
  
  const mult = multiplicadores[scenario] || 1.00;

  // Estado Inicial
  let currentUsers = modo === 'Simulação' ? 500 * mult : (params.currentUsersReal || 0);
  let accumulatedProfit = -(params.initialInvestment || 0);

  for (let m = 0; m < 36; m++) {
    const year = 2026 + Math.floor(m / 12);
    const monthIndex = m % 12;
    const fatorSazo = SAZONALIDADE[monthIndex];

    // 1. CRESCIMENTO DE MOTORISTAS (Curva S - Teto 500)
    const k = 0.18 * mult;
    const t0 = 18;
    const motoristasTarget = TETO_MOTORISTAS_FINAL / (1 + Math.exp(-k * (m - t0)));
    const currentDrivers = Math.max(params.activeDrivers || 1, Math.round(motoristasTarget));

    // 2. CRESCIMENTO DE USUÁRIOS (Limitado pelo SOM 15%)
    const growthBase = m <= 12 ? 0.15 : 0.05;
    const saturation = Math.max(0, 1 - (currentUsers / MAX_USERS_POSSIVEIS));
    currentUsers = currentUsers + (currentUsers * growthBase * saturation * mult * fatorSazo);

    // 3. OPERAÇÃO
    const ridesPerUser = (params.ridesPerUserMonth || 4.20) * fatorSazo;
    const totalDemandedRides = currentUsers * ridesPerUser;
    
    // Capacidade: 12 corridas/dia útil e 18/dia em FDS
    const supplyCapacity = currentDrivers * ((22 * 12) + (8.5 * 18)) * mult;
    const actualRides = Math.min(totalDemandedRides, supplyCapacity);
    
    // 4. FINANCEIRO
    const avgFareAjustada = (params.avgFare || 0) * (1 + (fatorSazo * 0.05));
    const grossRevenue = actualRides * avgFareAjustada;
    // Regra: comissão 15% somente sobre a tarifa (sem Tech Fee)
    // Consideramos avgFareAjustada como preço pago pelo passageiro (inclui Tech Fee quando aplicável)
    const tariffUnit = Math.max(0, avgFareAjustada - TECH_FEE_FIXED);
    const commissionUnit = tariffUnit * TAKE_RATE_PADRAO;
    const techFeeRevenue = actualRides * TECH_FEE_FIXED;
    const takeRateGross = actualRides * commissionUnit;
    const takeRateRevenue = takeRateGross + techFeeRevenue;
    const taxes = takeRateRevenue * 0.112; 
    const variableCosts = actualRides * 0.40; 
    const techCost = actualRides * 0.15; // Custo de processamento de tecnologia
    const marketing = params.marketingMonthly || 9000;
    const fixedCosts = params.fixedCosts || 4000;

    // Lucro Líquido deduzindo todos os custos, incluindo tecnologia
    const netProfit = takeRateRevenue - taxes - variableCosts - marketing - fixedCosts - techCost;
    accumulatedProfit += netProfit;

    // Receita líquida do motorista = GMV - comissão (a tech fee não compõe repasse)
    const netPerDriver = currentDrivers > 0 ? (grossRevenue - takeRateGross - techFeeRevenue) / currentDrivers : 0;

    results.push({
      month: m + 1,
      year,
      monthName: MONTH_NAMES[monthIndex],
      drivers: currentDrivers,
      users: Math.round(currentUsers),
      rides: Math.round(actualRides),
      grossRevenue,
      takeRateGross,
      cashback: 0,
      takeRateRevenue,
      taxes,
      variableCosts,
      fixedCosts,
      marketing,
      tech: techCost,
      campaignCosts: 0,
      eliteDriversCost: 0,
      fidelidadePassageirosCost: 0,
      reservaOperacionalCost: 0,
      ebitda: netProfit,
      netProfit,
      accumulatedProfit,
      margin: takeRateRevenue > 0 ? (netProfit / takeRateRevenue) * 100 : 0,
      contributionMargin: takeRateRevenue > 0 ? ((takeRateRevenue - taxes - variableCosts) / takeRateRevenue) * 100 : 0,
      cac: marketing / (Math.max(1, currentUsers * 0.1)),
      ltv: 0,
      grossPerDriver: currentDrivers > 0 ? grossRevenue / currentDrivers : 0,
      netPerDriver,
      ridesPerDriver: currentDrivers > 0 ? actualRides / currentDrivers : 0,
      ridesPerDriverDay: currentDrivers > 0 ? (actualRides / currentDrivers) / 30 : 0,
      supplyCapacity,
      demandedRides: totalDemandedRides,
      isSupplyBottleneck: totalDemandedRides > supplyCapacity,
      demandGap: Math.max(0, totalDemandedRides - supplyCapacity),
      newUsersAdded: 0
    });
  }
  return results;
};

// FUNÇÃO DE AUDITORIA ANUAL (Annual Audit Function)
export const auditYears = (results: MonthlyResult[]): YearAudit[] => {
  const audits: YearAudit[] = [];
  const years = [...new Set(results.map(r => r.year))];
  
  years.forEach((y, i) => {
    const data = results.filter(r => r.year === y);
    if (data.length === 0) return;
    
    const totalGMV = data.reduce((a, b) => a + (b.grossRevenue || 0), 0);
    const totalRev = data.reduce((a, b) => a + (b.takeRateRevenue || 0), 0);
    const totalProfit = data.reduce((a, b) => a + (b.netProfit || 0), 0);
    const totalRides = data.reduce((a, b) => a + (b.rides || 0), 0);
    
    audits.push({
      year: y,
      totalGMV,
      totalRevenue: totalRev,
      totalCashback: 0,
      totalNetProfit: totalProfit,
      totalEbitda: totalProfit,
      totalRides,
      avgMonthlyProfit: totalProfit / data.length,
      avgRidesPerDriverDay: data.reduce((a, b) => a + (b.ridesPerDriverDay || 0), 0) / data.length,
      growthFromPrev: (i === 0 || audits[i-1].totalRevenue === 0) ? 0 : ((totalRev - audits[i-1].totalRevenue) / audits[i-1].totalRevenue) * 100,
      bestMonth: [...data].sort((a,b) => b.netProfit - a.netProfit)[0]?.monthName || '-',
      worstMonth: [...data].sort((a,b) => a.netProfit - b.netProfit)[0]?.monthName || '-',
      endUsers: data[data.length - 1].users,
      endDrivers: data[data.length - 1].drivers,
      avgMonthlyRides: totalRides / data.length,
      totalOpCosts: data.reduce((a, b) => a + (b.marketing || 0) + (b.tech || 0) + (b.variableCosts || 0), 0)
    });
  });
  return audits;
};