
import { useState, useMemo, useEffect } from 'react';
import { ScenarioType, SimulationParams, MonthlyResult } from '../types';
import { INITIAL_PARAMS, STORAGE_KEY } from '../constants';
import { calculateProjections, auditYears } from '../services/financeEngine';

// Chave atualizada para forçar o reset dos parâmetros no navegador do usuário
const STORAGE_KEY_V7 = 'tkx_simulation_params_v7';

export const useViability = () => {
  const [activeTab, setActiveTab] = useState(17);
  const [scenario, setScenario] = useState<ScenarioType>(ScenarioType.REALISTA);
  const [dreYear, setDreYear] = useState<number | 'total'>('total');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  // Limpar localStorage antigo para forçar reset
  localStorage.removeItem('tkx_simulation_params_v4');
  localStorage.removeItem('tkx_simulation_params_v5');
  localStorage.removeItem('tkx_simulation_params_v6');
  localStorage.removeItem('tkx_simulation_params_v7');
  localStorage.removeItem('tkx_snapshots');

  const DEFAULT_VALUES: Record<ScenarioType, SimulationParams> = {
    [ScenarioType.REALISTA]: {
      ridesPerDriverDay: 15, 
      avgFare: 18.5,
      takeRate: 15,          
      activeDrivers: 5.00,
      driverAdditionMonthly: 10.00,
      ridesPerUserMonth: 4.2, 
      initialRides: 14000, 
      fixedCosts: 6200,
      userGrowth: 15.00,
      initialInvestment: 0.00,
      marketingMonthly: 11000,
      techMonthly: 3500.00,
      cancellationRate: 3,
      driverGrowth: 5,
      adesaoTurbo: 1500.00,
      trafegoPago: 4000.00,
      mktMensalOff: 1000.00,
      parceriasBares: 1000.00,
      indiqueGanhe: 1500.00,
      apiMaintenanceRate: 0.3,
      chargebackReserveRate: 1,
      churnRate: 2,
      bankFeeRate: 3.0,
      isMaintenanceActive: true,
      applyMinimumCosts: false,
      custoComercialMkt: 5000.00,
      minCostsEnabled: false,
      eliteDriversSemestral: 3000.00,
      fidelidadePassageirosAnual: 5000.00,
      reservaOperacionalGMV: 0.00,
      takeRateEfetivo: 15,
      currentUsersReal: undefined
    }, 
    [ScenarioType.PESSIMISTA]: { 
      ridesPerDriverDay: 15, 
      avgFare: 17.5,
      takeRate: 15,          
      activeDrivers: 3.00,
      driverAdditionMonthly: 10.00,
      ridesPerUserMonth: 4.2, 
      initialRides: 14000, 
      fixedCosts: 6200,
      userGrowth: 12.00,
      initialInvestment: 0.00,
      marketingMonthly: 11000,
      techMonthly: 3500.00,
      cancellationRate: 3,
      driverGrowth: 5,
      adesaoTurbo: 1500.00,
      trafegoPago: 4000.00,
      mktMensalOff: 1000.00,
      parceriasBares: 1000.00,
      indiqueGanhe: 1500.00,
      apiMaintenanceRate: 0.3,
      chargebackReserveRate: 1,
      churnRate: 2,
      bankFeeRate: 3.0,
      isMaintenanceActive: true,
      applyMinimumCosts: false,
      custoComercialMkt: 5000.00,
      minCostsEnabled: false,
      eliteDriversSemestral: 3000.00,
      fidelidadePassageirosAnual: 5000.00,
      reservaOperacionalGMV: 0.00,
      takeRateEfetivo: 15,
      currentUsersReal: undefined
    }, 
    [ScenarioType.OTIMISTA]: { 
      ridesPerDriverDay: 15, 
      avgFare: 18.5,
      takeRate: 15,          
      activeDrivers: 10.00,
      driverAdditionMonthly: 13.00,
      ridesPerUserMonth: 4.2, 
      initialRides: 14000, 
      fixedCosts: 6200,
      userGrowth: 18.00,
      initialInvestment: 0.00,
      marketingMonthly: 11000,
      techMonthly: 3500.00,
      cancellationRate: 3,
      driverGrowth: 5,
      adesaoTurbo: 1500.00,
      trafegoPago: 4000.00,
      mktMensalOff: 1000.00,
      parceriasBares: 1000.00,
      indiqueGanhe: 1500.00,
      apiMaintenanceRate: 0.3,
      chargebackReserveRate: 1,
      churnRate: 2,
      bankFeeRate: 3.0,
      isMaintenanceActive: true,
      applyMinimumCosts: false,
      custoComercialMkt: 5000.00,
      minCostsEnabled: false,
      eliteDriversSemestral: 3000.00,
      fidelidadePassageirosAnual: 5000.00,
      reservaOperacionalGMV: 0.00,
      takeRateEfetivo: 15,
      currentUsersReal: undefined
    } 
  };

  const [paramsMap, setParamsMap] = useState<Record<ScenarioType, SimulationParams>>(DEFAULT_VALUES);

  // Debug: verificar se os valores estão corretos
  console.log('DEFAULT_VALUES aplicados:', DEFAULT_VALUES);

  const currentParams = useMemo(() => paramsMap[scenario], [paramsMap, scenario]);

  // Debug: verificar currentParams
  console.log('currentParams para', scenario, ':', currentParams);
  const [projections, setProjections] = useState<MonthlyResult[] | null>(null);

  useEffect(() => {
    setProjections(calculateProjections(currentParams, scenario));
    localStorage.setItem(STORAGE_KEY_V7, JSON.stringify(paramsMap));
  }, [currentParams, scenario, paramsMap]);

  const audits = useMemo(() => projections ? auditYears(projections) : [], [projections]);

  // Filtros e cálculos adicionais
  const filteredDreResults = useMemo(() => {
    if (!audits) return [];
    if (dreYear === 'total') return audits;
    return audits.filter(audit => audit.year === dreYear);
  }, [audits, dreYear]);

  // Funções adicionais
  const resetParams = () => {
    setParamsMap(DEFAULT_VALUES);
  };

  const toggleMinCosts = () => {
    updateCurrentParam('minCostsEnabled', !currentParams.minCostsEnabled);
  };

  const supplyBottleneck = useMemo(() => {
    // Lógica simples: bottleneck se drivers < rides / avg per driver
    const avgRidesPerDriver = currentParams.ridesPerDriverDay * 30;
    const requiredDrivers = (currentParams.initialRides / avgRidesPerDriver) * (1 + currentParams.userGrowth / 100);
    return currentParams.activeDrivers < requiredDrivers;
  }, [currentParams]);

  const oversupplyWarning = useMemo(() => {
    // Oversupply se drivers > 1.5x required
    const avgRidesPerDriver = currentParams.ridesPerDriverDay * 30;
    const requiredDrivers = (currentParams.initialRides / avgRidesPerDriver) * (1 + currentParams.userGrowth / 100);
    return currentParams.activeDrivers > requiredDrivers * 1.5;
  }, [currentParams]);

  // --- FUNÇÕES DE AÇÃO (RESOLVE OS ERROS VERMELHOS) ---
  const updateCurrentParam = (key: keyof SimulationParams, value: any) => {
    setParamsMap(prev => ({
      ...prev,
      [scenario]: { ...prev[scenario], [key]: value }
    }));
  };

  const updateParam = updateCurrentParam; // Alias

  const updateScenarioParam = (scenarioKey: ScenarioType, key: keyof SimulationParams, value: any) => {
    setParamsMap(prev => ({
      ...prev,
      [scenarioKey]: { ...prev[scenarioKey], [key]: value }
    }));
  };

  const handleSaveSnapshot = (name: string) => {
    const newSnap = { id: Date.now().toString(), name, scenario, params: { ...currentParams }, date: new Date().toISOString() };
    setSnapshots(prev => [...prev, newSnap]);
  };

  const handleLoadSnapshot = (snap: any) => {
    setParamsMap(prev => ({ ...prev, [snap.scenario]: snap.params }));
    setScenario(snap.scenario);
    setIsSnapshotModalOpen(false);
  };

  // Placeholders para SnapshotModal não dar erro
  const deleteSnapshot = (id: string) => setSnapshots(prev => prev.filter(s => s.id !== id));
  const renameSnapshot = () => {};
  const duplicateSnapshot = () => {};
  const exportSingleSnapshot = () => {};
  const exportSnapshots = () => {};
  const importSnapshots = () => {};
  const handleExportPDF = () => {};
  const handleExportExcel = () => {};

  return {
    activeTab, setActiveTab,
    scenario, setScenario,
    currentParams, updateCurrentParam,
    projections, audits,
    filteredDreResults,
    updateParam,
    updateScenarioParam,
    resetParams,
    toggleMinCosts,
    supplyBottleneck,
    oversupplyWarning,
    dreYear, setDreYear,
    snapshots, setSnapshots,
    isSnapshotModalOpen, setIsSnapshotModalOpen,
    handleSaveSnapshot, handleLoadSnapshot, deleteSnapshot,
    renameSnapshot, duplicateSnapshot, exportSingleSnapshot,
    exportSnapshots, importSnapshots, handleExportPDF, handleExportExcel,
    paramsMap,
    calculateProjections
  };
};