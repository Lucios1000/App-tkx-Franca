export enum ScenarioType {
  REALISTA = 'Realista',
  PESSIMISTA = 'Pessimista',
  OTIMISTA = 'Otimista'
}

export interface SimulationParams {
  ridesPerDriverDay: number;
  avgFare: number;
  takeRate: number;
  activeDrivers: number;
  driverAdditionMonthly: number;
  ridesPerUserMonth: number;
  initialRides: number;
  fixedCosts: number;
  userGrowth: number;
  initialInvestment: number;
  marketingMonthly: number;
  techMonthly: number;
  cancellationRate: number;
  driverGrowth: number;
  adesaoTurbo: number;
  trafegoPago: number;
  mktMensalOff: number;
  parceriasBares: number;
  indiqueGanhe: number;
  apiMaintenanceRate: number;
  chargebackReserveRate: number;
  churnRate: number;
  bankFeeRate: number;
  isMaintenanceActive: boolean;
  applyMinimumCosts: boolean;
  custoComercialMkt: number;
  minCostsEnabled: boolean;
  eliteDriversSemestral: number;
  fidelidadePassageirosAnual: number;
  reservaOperacionalGMV: number;
  takeRateEfetivo: number;
  currentUsersReal?: number; // Novo: para o Mundo Real
}

export interface MonthlyResult {
  month: number;
  year: number;
  monthName: string;
  drivers: number;
  users: number; 
  rides: number;
  grossRevenue: number;
  takeRateGross: number;
  cashback: number;
  takeRateRevenue: number;
  taxes: number;
  variableCosts: number;
  fixedCosts: number;
  marketing: number;
  tech: number;
  campaignCosts: number;
  eliteDriversCost: number;
  fidelidadePassageirosCost: number;
  reservaOperacionalCost: number;
  ebitda: number;
  netProfit: number;
  accumulatedProfit: number;
  margin: number;
  contributionMargin: number;
  cac: number;
  ltv: number;
  grossPerDriver: number;
  netPerDriver: number;
  ridesPerDriver: number; 
  ridesPerDriverDay: number;
  supplyCapacity: number;
  demandedRides: number;
  isSupplyBottleneck: boolean;
  demandGap: number;
  newUsersAdded: number;
  totalMarketing?: number; // Campo necessário para o Excel
  totalTech?: number;      // Campo necessário para o Excel
}

export interface YearAudit {
  year: number;
  totalGMV: number;
  totalRevenue: number;
  totalCashback: number;
  totalNetProfit: number;
  totalEbitda: number;
  totalRides: number;
  avgMonthlyProfit: number;
  avgRidesPerDriverDay: number;
  growthFromPrev: number;
  bestMonth: string;
  worstMonth: string;
  endUsers: number;
  endDrivers: number;
  avgMonthlyRides: number;
  totalOpCosts: number;
}