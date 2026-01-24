import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Percent, Clock } from 'lucide-react';
import { SimulationParams, MonthlyResult } from '../types';

interface TestTabProps {
  currentParams: SimulationParams;
  projections: MonthlyResult[];
  audits: any;
  scenario: string;
}

const TestTab: React.FC<TestTabProps> = ({ currentParams, projections, audits, scenario }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Simular loading ao alterar parâmetros
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [currentParams, scenario]);

  // Formatação com Intl.NumberFormat
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number, digits = 1) =>
    new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: digits }).format(value / 100);

  // Cálculos de teste
  const testMetrics = useMemo(() => {
    const totalInvestment = currentParams.initialInvestment;
    const totalRevenue = projections.reduce((sum, p) => sum + p.grossRevenue, 0);
    const totalProfit = projections.reduce((sum, p) => sum + p.netProfit, 0);
    const paybackPeriod = totalInvestment > 0 ? totalInvestment / (totalProfit / projections.length) : Infinity;
    const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

    // Delta (comparação com cenário anterior - simulado)
    const prevTotalProfit = totalProfit * 0.95; // Simulação
    const profitDelta = ((totalProfit - prevTotalProfit) / Math.abs(prevTotalProfit)) * 100;

    return {
      totalInvestment,
      totalRevenue,
      totalProfit,
      paybackPeriod: isFinite(paybackPeriod) ? paybackPeriod : null,
      roi,
      profitDelta,
    };
  }, [currentParams, projections]);

  const hasError = testMetrics.totalInvestment < 0 || !testMetrics.paybackPeriod;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-32 shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-900 via-blue-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-2">
            (Test Suite) **Suite de Testes**
          </h1>
          <p className="text-slate-300 text-lg">
            (Testing Environment) **Ambiente de Testes** - Cenário: {scenario}
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Investimento Total */}
          <div className={`glass-card p-6 rounded-xl border-2 ${hasError ? 'border-red-500' : 'border-gradient-gold'} shadow-3d-blue`}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              {hasError && <AlertTriangle className="w-6 h-6 text-red-500" />}
            </div>
            <h3 className="text-sm font-bold text-yellow-300 mb-2">
              (Total Investment) **Investimento Total**
            </h3>
            <div className="text-2xl font-black text-white">
              {formatCurrency(testMetrics.totalInvestment)}
            </div>
          </div>

          {/* Receita Total */}
          <div className="glass-card p-6 rounded-xl border-2 border-gradient-gold shadow-3d-blue">
            <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-sm font-bold text-yellow-300 mb-2">
              (Total Revenue) **Receita Total**
            </h3>
            <div className="text-2xl font-black text-green-300">
              {formatCurrency(testMetrics.totalRevenue)}
            </div>
          </div>

          {/* Lucro Total com Delta */}
          <div className="glass-card p-6 rounded-xl border-2 border-gradient-gold shadow-3d-blue">
            <div className="flex items-center justify-between mb-4">
              {testMetrics.profitDelta >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
              <span className={`text-sm font-bold ${testMetrics.profitDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {testMetrics.profitDelta >= 0 ? '↑' : '↓'} {Math.abs(testMetrics.profitDelta).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-yellow-300 mb-2">
              (Total Profit) **Lucro Total**
            </h3>
            <div className={`text-2xl font-black ${testMetrics.totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(testMetrics.totalProfit)}
            </div>
          </div>

          {/* Payback Period */}
          <div className={`glass-card p-6 rounded-xl border-2 ${hasError ? 'border-red-500' : 'border-gradient-gold'} shadow-3d-blue`}>
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
              {hasError && <AlertTriangle className="w-6 h-6 text-red-500" />}
            </div>
            <h3 className="text-sm font-bold text-yellow-300 mb-2">
              (Payback Period) **Período de Payback**
            </h3>
            <div className="text-2xl font-black text-blue-300">
              {testMetrics.paybackPeriod ? `${testMetrics.paybackPeriod.toFixed(1)} meses` : 'Impossível'}
            </div>
          </div>
        </div>

        {/* ROI */}
        <div className="glass-card p-6 rounded-xl border-2 border-gradient-gold shadow-3d-blue">
          <Percent className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="text-sm font-bold text-yellow-300 mb-2">
            (Return on Investment) **Retorno sobre Investimento**
          </h3>
          <div className="text-4xl font-black text-purple-300">
            {formatPercent(testMetrics.roi)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTab;