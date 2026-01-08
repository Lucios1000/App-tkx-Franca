
import { useState, useMemo, useEffect } from 'react';
import { ScenarioType, SimulationParams, MonthlyResult } from '../types';
import { INITIAL_PARAMS, STORAGE_KEY } from '../constants';
import { calculateProjections, auditYears } from '../services/financeEngine';

export const useViability = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scenario, setScenario] = useState<ScenarioType>(ScenarioType.REALISTA);
  const [dreYear, setDreYear] = useState<number | 'total'>('total');

  const DEFAULT_VALUES: Record<ScenarioType, SimulationParams> = {
    [ScenarioType.REALISTA]: {
      ...INITIAL_PARAMS,
      activeDrivers: 44,
      driverAdditionMonthly: 10,
      avgFare: 18.5,
      userGrowth: 15,
      initialInvestment: 0,
      techMonthly: 3000,
      adesaoTurbo: 3000,
      trafegoPago: 4000,
      mktMensalOff: 2000,
      parceriasBares: 6000,
      indiqueGanhe: 1500,
      custoComercialMkt: 8000,
      eliteDriversSemestral: 10000,
      fidelidadePassageirosAnual: 5000,
      reservaOperacionalGMV: 2.0,
      minCostsEnabled: true
    }, 
    [ScenarioType.PESSIMISTA]: { 
      ...INITIAL_PARAMS, 
      activeDrivers: 30,
      driverAdditionMonthly: 10,
      avgFare: 17.5,
      userGrowth: 12,
      initialInvestment: 0,
      techMonthly: 3000,
      adesaoTurbo: 3000,
      trafegoPago: 4000,
      mktMensalOff: 1000,
      parceriasBares: 3000,
      indiqueGanhe: 1500,
      custoComercialMkt: 8000,
      eliteDriversSemestral: 10000,
      fidelidadePassageirosAnual: 5000,
      reservaOperacionalGMV: 1.0,
      minCostsEnabled: true
    }, 
    [ScenarioType.OTIMISTA]: { 
      ...INITIAL_PARAMS, 
      activeDrivers: 80,
      driverAdditionMonthly: 13,
      avgFare: 18.5,
      userGrowth: 18,
      initialInvestment: 0,
      techMonthly: 3000,
      adesaoTurbo: 3000,
      trafegoPago: 4000,
      mktMensalOff: 4000,
      parceriasBares: 10000,
      indiqueGanhe: 1500,
      custoComercialMkt: 8000,
      eliteDriversSemestral: 10000,
      fidelidadePassageirosAnual: 5000,
      reservaOperacionalGMV: 3.0,
      minCostsEnabled: true
    } 
  };

  const [paramsMap, setParamsMap] = useState<Record<ScenarioType, SimulationParams>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<ScenarioType, SimulationParams>;
        return {
          [ScenarioType.REALISTA]: { ...INITIAL_PARAMS, ...parsed[ScenarioType.REALISTA] },
          [ScenarioType.PESSIMISTA]: { ...INITIAL_PARAMS, ...parsed[ScenarioType.PESSIMISTA] },
          [ScenarioType.OTIMISTA]: { ...INITIAL_PARAMS, ...parsed[ScenarioType.OTIMISTA] },
        };
      }
    } catch {}
    return {
      [ScenarioType.REALISTA]: { ...DEFAULT_VALUES[ScenarioType.REALISTA] },
      [ScenarioType.PESSIMISTA]: { ...DEFAULT_VALUES[ScenarioType.PESSIMISTA] },
      [ScenarioType.OTIMISTA]: { ...DEFAULT_VALUES[ScenarioType.OTIMISTA] },
    };
  });

  // Migração/normalização: garante que cada cenário tenha objeto independente (sem referências compartilhadas)
  useEffect(() => {
    const r = paramsMap[ScenarioType.REALISTA];
    const p = paramsMap[ScenarioType.PESSIMISTA];
    const o = paramsMap[ScenarioType.OTIMISTA];
    if (r === p || r === o || p === o) {
      setParamsMap(prev => ({
        [ScenarioType.REALISTA]: { ...prev[ScenarioType.REALISTA] },
        [ScenarioType.PESSIMISTA]: { ...prev[ScenarioType.PESSIMISTA] },
        [ScenarioType.OTIMISTA]: { ...prev[ScenarioType.OTIMISTA] },
      }));
    }
    // Executa apenas uma vez na montagem para quebrar referências antigas persistidas via HMR/estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva automaticamente no LocalStorage sempre que os parâmetros mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paramsMap));
  }, [paramsMap]);

  // currentParams REATIVO - recalcula quando scenario ou paramsMap mudam
  const currentParams = useMemo(() => paramsMap[scenario], [paramsMap, scenario]);

  // Recalcula as projeções apenas quando os parâmetros mudam (Performance!)
  // Adaptação: Passamos o scenario também, pois o engine precisa dele para definir tetos de frota
  const projections = useMemo(() => calculateProjections(currentParams, scenario), [currentParams, scenario]);

  // Removidos efeitos automáticos de ajuste do marketing com base em custos mínimos
  
  const audits = useMemo(() => auditYears(projections), [projections]);

  const filteredDreResults = useMemo(() => {
    if (dreYear === 'total') return projections;
    return projections.filter(r => r.year === dreYear);
  }, [projections, dreYear]);

  // Lógica de Alertas e Gargalos
  const lastResult = projections[projections.length - 1] || projections[0];
  const getCoverage = (drivers: number, users: number) => users > 0 ? (drivers * 200) / users : 0;
  const coverageIndexFinal = getCoverage(lastResult.drivers, lastResult.users);
  
  const supplyBottleneck = coverageIndexFinal < 0.8 && currentParams.isMaintenanceActive && lastResult.rides > 0;
  const oversupplyWarning = coverageIndexFinal > 5.0 && currentParams.isMaintenanceActive && lastResult.rides > 0;

  const totalMarketingInvest = currentParams.marketingMonthly + currentParams.adesaoTurbo + currentParams.trafegoPago + currentParams.parceriasBares + currentParams.indiqueGanhe;

  const updateParam = (targetScenario: ScenarioType, key: keyof SimulationParams, value: any) => {
    setParamsMap(prev => ({
      ...prev,
      [targetScenario]: { ...prev[targetScenario], [key]: value }
    }));
  };

  // Helper para atualizar o parâmetro do cenário ATUAL (simplifica a chamada na UI)
  const updateCurrentParam = (key: keyof SimulationParams, value: any) => {
    updateParam(scenario, key, value);
  };

  const resetParams = () => {
    // Reset apenas o cenário atual (não todos os cenários)
    setParamsMap(prev => ({
      ...prev,
      [scenario]: { ...DEFAULT_VALUES[scenario], minCostsEnabled: true }
    }));
  };

  const toggleMinCosts = () => {
    updateCurrentParam('minCostsEnabled', !currentParams.minCostsEnabled);
  };

  return {
    activeTab,
    setActiveTab,
    scenario,
    setScenario,
    dreYear,
    setDreYear,
    paramsMap,           // Necessário para a aba de Comparação de Cenários
    currentParams,       // Parâmetros do cenário ativo
    projections,         // Resultados mensais (MonthlyResult[])
    audits,              // Resumo anual
    filteredDreResults,  // DRE filtrado
    supplyBottleneck,
    oversupplyWarning,
    updateParam,         // Atualiza qualquer cenário
    updateCurrentParam,  // Atualiza cenário atual
    resetParams,
    toggleMinCosts,
    lastResult,
    totalMarketingInvest,
    calculateProjections // Exposto para recalcular outros cenários na aba 9 se necessário
  };
};
