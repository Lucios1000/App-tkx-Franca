
import { SimulationParams, ScenarioType, MonthlyResult, YearAudit } from '../types';
import { MONTH_NAMES, FRANCA_STATS } from '../constants';

export const calculateProjections = (
  params: SimulationParams,
  scenario: ScenarioType
): MonthlyResult[] => {
  const results: MonthlyResult[] = [];
  
  const MAX_USERS_SCENARIO = FRANCA_STATS.somTarget; 
  
  let driverCap = 2000; 
  if (scenario === ScenarioType.PESSIMISTA) driverCap = 800;
  if (scenario === ScenarioType.OTIMISTA) driverCap = 3000;

  let currentDrivers = params.activeDrivers;
  let currentUsers = params.activeDrivers > 0 ? params.activeDrivers * 50 : 100; 
  let accumulatedProfit = -params.initialInvestment;

  const baseGrowthRate = params.userGrowth / 100;

  for (let m = 0; m < 36; m++) {
    const year = 2026 + Math.floor(m / 12);
    const monthIndex = m % 12;

    // Se a manutenção estiver desligada, zerar tudo conforme solicitado
    if (!params.isMaintenanceActive) {
      results.push({
        month: m + 1,
        year,
        monthName: MONTH_NAMES[monthIndex],
        drivers: 0,
        users: 0,
        rides: 0,
        grossRevenue: 0,
        takeRateGross: 0,
        cashback: 0,
        takeRateRevenue: 0,
        taxes: 0,
        variableCosts: 0, 
        fixedCosts: 0,
        marketing: 0,
        tech: 0, 
        campaignCosts: 0,
        ebitda: 0,
        netProfit: 0,
        accumulatedProfit: -params.initialInvestment, // O investimento inicial permanece gasto
        margin: 0,
        contributionMargin: 0,
        cac: 0,
        ltv: 0,
        grossPerDriver: 0,
        netPerDriver: 0,
        ridesPerDriver: 0,
        ridesPerDriverDay: 0
      });
      continue;
    }

    const previousUsers = currentUsers;
    const saturationFactor = 1 - (currentUsers / MAX_USERS_SCENARIO);
    let effectiveGrowthRate = Math.max(0, baseGrowthRate * saturationFactor);
    
    currentUsers = currentUsers * (1 + effectiveGrowthRate);
    if (currentUsers > MAX_USERS_SCENARIO) currentUsers = MAX_USERS_SCENARIO;
    
    const newUsersNet = currentUsers - previousUsers;
    const userChurnRate = (params.churnRate || 2) / 100;
    const grossNewUsers = newUsersNet + (previousUsers * userChurnRate);

    // Crescimento da Frota
    currentDrivers += (params.driverAdditionMonthly || 0);
    const driverChurnRate = 0.02; 
    currentDrivers = currentDrivers * (1 - driverChurnRate);
    currentDrivers = Math.min(driverCap, currentDrivers);

    // Demanda de Usuários
    const demandedRides = currentUsers * (params.ridesPerUserMonth || 4.2); 
    
    const availabilityFactor = 0.40;
    const workingDays = 30;
    const maxTripsPerOnlineDriverDay = 35; 
    const supplyCapacity = currentDrivers * availabilityFactor * workingDays * maxTripsPerOnlineDriverDay; 
    
    const actualRides = Math.min(demandedRides, supplyCapacity);
    const ridesPM = currentDrivers > 0 ? actualRides / currentDrivers : 0;

    // Regra de Meritocracia
    let effectiveTakeRate = 12; 
    if (ridesPM >= 600) effectiveTakeRate = 10;
    else if (ridesPM >= 500) effectiveTakeRate = 11;
    else if (ridesPM >= 400) effectiveTakeRate = 12;
    else if (ridesPM >= 300) effectiveTakeRate = 13;
    else effectiveTakeRate = 15;

    const grossRevenue = actualRides * params.avgFare;
    const takeRateGross = grossRevenue * 0.15; 
    const takeRateRevenue = grossRevenue * (effectiveTakeRate / 100); 
    const cashback = takeRateGross - takeRateRevenue; 

    // CONDIÇÃO: Se Volume de Corridas for 0, zerar impostos, taxas e marketing
    let taxes = 0;
    let variableCosts = 0;
    let totalMarketing = 0;
    let campaignCosts = 0;
    let apiCosts = 0;
    let totalTech = 0;

    if (actualRides > 0) {
      taxes = takeRateRevenue * 0.112; 
      const chargebackReserve = grossRevenue * (params.chargebackReserveRate / 100);
      campaignCosts = params.adesaoTurbo + params.trafegoPago + params.parceriasBares + params.indiqueGanhe;
      totalMarketing = params.marketingMonthly + (m < 12 ? campaignCosts : campaignCosts * 0.3);
      apiCosts = actualRides * (params.apiMaintenanceRate || 0.3);
      const bankFees = takeRateRevenue * ((params.bankFeeRate || 3.0) / 100);
      variableCosts = bankFees + chargebackReserve; 
      totalTech = params.techMonthly + apiCosts;
    } else {
      // Se volume é 0, tecnologia base (techMonthly) ainda pode existir? 
      // O prompt diz: "se o Volume for 0... marketing devem ser zerados".
      // E vincula Custos Fixos e Tecnologia ao interruptor.
      // Se Volume é 0, mas interruptor está ON, mantemos os fixos? 
      // Interpretando que volume 0 zera apenas os proporcionais e o marketing.
      totalTech = params.techMonthly; // Custo fixo de tecnologia permanece se manutenção estiver ativa
    }
    
    const currentFixedCosts = params.fixedCosts;
    
    const ebitda = takeRateRevenue - taxes - variableCosts - currentFixedCosts - totalTech - totalMarketing;
    const netProfit = ebitda; 
    
    accumulatedProfit += netProfit;

    const contributionMarginVal = takeRateRevenue - taxes - variableCosts;
    const avgMarginPerUser = currentUsers > 0 ? contributionMarginVal / currentUsers : 0;
    const ltv = userChurnRate > 0 ? avgMarginPerUser / userChurnRate : 0;
    const cac = (grossNewUsers > 0 && actualRides > 0) ? totalMarketing / grossNewUsers : 0;

    results.push({
      month: m + 1,
      year,
      monthName: MONTH_NAMES[monthIndex],
      drivers: Math.round(currentDrivers),
      users: Math.round(currentUsers),
      rides: Math.round(actualRides),
      grossRevenue,
      takeRateGross,
      cashback,
      takeRateRevenue,
      taxes,
      variableCosts, 
      fixedCosts: currentFixedCosts,
      marketing: totalMarketing,
      tech: totalTech, 
      campaignCosts,
      ebitda,
      netProfit,
      accumulatedProfit,
      margin: takeRateRevenue > 0 ? (netProfit / takeRateRevenue) * 100 : 0,
      contributionMargin: takeRateRevenue > 0 ? (contributionMarginVal / takeRateRevenue) * 100 : 0,
      cac,
      ltv,
      grossPerDriver: currentDrivers > 0 ? grossRevenue / currentDrivers : 0,
      netPerDriver: currentDrivers > 0 ? (grossRevenue - takeRateRevenue) / currentDrivers : 0,
      ridesPerDriver: ridesPM,
      ridesPerDriverDay: ridesPM / 30
    });
  }

  return results;
};

export const auditYears = (results: MonthlyResult[]): YearAudit[] => {
  const audits: YearAudit[] = [];
  const years = [...new Set(results.map(r => r.year))];
  
  years.forEach((y, i) => {
    const data = results.filter(r => r.year === y);
    if (data.length === 0) return;
    
    const totalGMV = data.reduce((a, b) => a + b.grossRevenue, 0);
    const totalRev = data.reduce((a, b) => a + b.takeRateRevenue, 0);
    const totalCashback = data.reduce((a, b) => a + b.cashback, 0);
    const totalProfit = data.reduce((a, b) => a + b.netProfit, 0);
    const totalEbitda = data.reduce((a, b) => a + b.ebitda, 0);
    const totalRides = data.reduce((a, b) => a + b.rides, 0);
    
    const totalOpCosts = data.reduce((a, b) => a + b.marketing + b.tech + b.variableCosts, 0);
    const endUsers = data[data.length - 1].users;
    const endDrivers = data[data.length - 1].drivers;
    const avgMonthlyRides = totalRides / data.length;
    
    audits.push({
      year: y,
      totalGMV,
      totalRevenue: totalRev,
      totalCashback,
      totalNetProfit: totalProfit,
      totalEbitda,
      totalRides,
      avgMonthlyProfit: totalProfit / data.length,
      avgRidesPerDriverDay: data.reduce((a, b) => a + b.ridesPerDriverDay, 0) / data.length,
      growthFromPrev: i === 0 ? 0 : (audits[i-1] && audits[i-1].totalRevenue > 0 ? ((totalRev - audits[i-1].totalRevenue) / audits[i-1].totalRevenue) * 100 : 0),
      bestMonth: [...data].sort((a,b) => b.netProfit - a.netProfit)[0].monthName,
      worstMonth: [...data].sort((a,b) => a.netProfit - b.netProfit)[0].monthName,
      endUsers,
      endDrivers,
      avgMonthlyRides,
      totalOpCosts
    });
  });
  return audits;
};
