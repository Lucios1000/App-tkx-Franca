
import React from 'react';
import { ScenarioType } from './types';
import { FRANCA_STATS } from './constants';
import Layout from './components/Layout';
import { useViability } from './hooks/useViability';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Legend, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Users, Target, UserCheck, Wallet, Zap, Clock, Sliders, 
  FileText, Landmark, Info, Megaphone, AlertTriangle, Star, Coins, 
  Map as MapIcon, ToggleRight, ToggleLeft, ArrowUpRight, Briefcase, Activity, ShieldCheck, Award
} from 'lucide-react';

const PLAYER_COLORS: Record<string, string> = {
  'TKX Franca': '#EAB308',
  'Uber': '#64748b',
  '99': '#f97316',
  'Maxim': '#ef4444',
  'Garupa': '#8b5cf6',
  'Urban 66': '#22c55e'
};

const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    scenario,
    setScenario,
    dreYear,
    setDreYear,
    paramsMap,
    currentParams,
    projections: results, // Alias para manter compatibilidade com código de UI anterior
    audits,
    filteredDreResults,
    supplyBottleneck,
    oversupplyWarning,
    updateParam,
    updateCurrentParam,
    lastResult,
    totalMarketingInvest,
    calculateProjections
  } = useViability();

  const getCoverage = (drivers: number, users: number) => users > 0 ? (drivers * 200) / users : 0;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const getStatusMetadata = (val: number) => {
    if (val < 0.8) return { label: "Gargalo Crítico", color: "text-red-500", bg: "bg-red-500/10" };
    if (val <= 1.2) return { label: "Operação Ideal", color: "text-green-400", bg: "bg-green-400/10" };
    if (val <= 3.0) return { label: "Estável", color: "text-yellow-400", bg: "bg-yellow-400/10" };
    return { label: "Excesso / Ociosidade", color: "text-orange-400", bg: "bg-orange-400/10" };
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-container');
    if (!element) return alert("Elemento de relatório não encontrado.");

    // @ts-ignore
    const html2pdf = window.html2pdf;
    if (!html2pdf) return alert("Biblioteca html2pdf.js não disponível.");

    const opt = {
      margin: 10,
      filename: 'TKX_Franca_Projecao.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#020617' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    const headers = ["Mes", "Ano", "Drivers", "Users", "Rides", "GMV", "Rec_TKX", "Lucro", "Acumulado"];
    const rows = results.map(r => [
      r.month, r.year, r.drivers, r.users, r.rides, 
      r.grossRevenue.toFixed(2).replace('.', ','), 
      r.takeRateRevenue.toFixed(2).replace('.', ','), 
      r.netProfit.toFixed(2).replace('.', ','), 
      r.accumulatedProfit.toFixed(2).replace('.', ',')
    ]);
    const csvContent = BOM + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TKX_FRANCA_PROJECAO.csv`;
    link.click();
  };

  const renderMetricCard = (title: string, value: string | number, sub: string, icon: React.ReactNode, variant: 'pos' | 'neg' | 'neu' = 'neu') => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{title}</span>
        <div className="text-yellow-500 group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <div className={`text-2xl font-black ${variant === 'pos' ? 'text-green-400' : variant === 'neg' ? 'text-red-400' : 'text-white'}`}>{value}</div>
      <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{sub}</div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel}>
      <div id="report-container" className="space-y-6 pb-20">
        
        {/* HEADER DE STATUS DINÂMICO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {Object.values(ScenarioType).map(t => (
              <button key={t} onClick={() => setScenario(t)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${scenario === t ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
             {/* INVESTIMENTO TOTAL CARD */}
             <div className="bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-3 backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Investimento MKT</span>
                  <span className="text-[11px] font-black text-white">{formatCurrency(totalMarketingInvest)}</span>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <Megaphone size={14} className="text-yellow-500" />
             </div>

             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase">Manutenção Ativa</span>
               <button onClick={() => updateCurrentParam('isMaintenanceActive', !currentParams.isMaintenanceActive)} className={`p-1 rounded-full transition-all ${currentParams.isMaintenanceActive ? 'text-green-400' : 'text-slate-600'}`}>
                  {currentParams.isMaintenanceActive ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
               </button>
             </div>
          </div>
        </div>

        {/* --- ABA 0: CALOR / DEMANDA --- */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
             <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><MapIcon size={18}/> Zonas de Calor e Demanda Franca-SP</h5>
                <div className="space-y-5">
                   {[
                     { area: 'Centro / Estação', demand: 'Crítico', peak: '12h-14h / 18h-19h', color: 'bg-red-500', val: 95 },
                     { area: 'Leporace / Brasilândia', demand: 'Alto', peak: '06h-08h / 17h-19h', color: 'bg-orange-500', val: 82 },
                     { area: 'City Petrópolis / Aeroporto', demand: 'Médio', peak: '07h-09h / Finais de Semana', color: 'bg-yellow-500', val: 68 },
                     { area: 'Distrito Industrial', demand: 'Focal', peak: '05h-06h / 14h-15h / 22h-23h', color: 'bg-blue-500', val: 55 },
                   ].map(zona => (
                     <div key={zona.area} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                           <div className="text-[10px] font-black text-white uppercase">{zona.area}</div>
                           <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Status: {zona.demand} | Pico: {zona.peak}</div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${zona.color}`} style={{ width: `${zona.val}%` }}></div>
                           </div>
                           <span className="text-[10px] font-black text-slate-400">{zona.val}%</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Benchmarks Tickets Locais</h5>
                <div className="space-y-3">
                   {FRANCA_STATS.marketPlayers.map(p => (
                     <div key={p.name} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: PLAYER_COLORS[p.name]}}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{p.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">R$ {p.ticket.toFixed(2)}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* --- ABA 1: BENCH / MARKET SHARE --- */}
        {activeTab === 1 && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl animate-in fade-in duration-500">
             <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><Briefcase size={18}/> Benchmark e Comparativo Local Franca-SP</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FRANCA_STATS.marketPlayers.map(p => (
                  <div key={p.name} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 border-l-4 group hover:border-l-yellow-500 transition-all" style={{borderLeftColor: PLAYER_COLORS[p.name]}}>
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-black text-white uppercase">{p.name}</span>
                        <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{p.share}% Market Share</span>
                     </div>
                     <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-[10px] uppercase"><span className="text-slate-500">Ticket Médio</span><span className="text-yellow-500 font-black">R$ {p.ticket.toFixed(2)}</span></div>
                        <div className="flex justify-between text-[10px] uppercase"><span className="text-slate-500">Foco Estratégico</span><span className="text-slate-300 font-bold text-right">{p.focus}</span></div>
                     </div>
                     <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < p.satisfaction ? PLAYER_COLORS[p.name] : 'none'} className={i < p.satisfaction ? '' : 'opacity-20'} />)}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* --- ABA 2: MKT/CF --- */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><Megaphone size={18}/> Gestão de Investimento de Marketing</h5>
                <div className="space-y-8">
                   {[
                     { label: 'Tráfego Pago (FB/IG/Google Ads)', key: 'trafegoPago', min: 0, max: 20000, step: 500 },
                     { label: 'Campanha Adesão Turbo (Eventos)', key: 'adesaoTurbo', min: 0, max: 10000, step: 250 },
                     { label: 'Parcerias Bares & Restaurantes', key: 'parceriasBares', min: 0, max: 10000, step: 250 },
                     { label: 'Campanha clientes (Indique e Ganhe)', key: 'indiqueGanhe', min: 0, max: 10000, step: 250 },
                     { label: 'Marketing de Marca (Offline)', key: 'marketingMonthly', min: 0, max: 50000, step: 500 },
                   ].map(item => (
                     <div key={item.key} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span className="text-yellow-500 text-sm">{formatCurrency((currentParams as any)[item.key])}</span>
                        </div>
                        <input 
                          type="range" 
                          min={item.min} 
                          max={item.max} 
                          step={item.step} 
                          value={(currentParams as any)[item.key]} 
                          onChange={(e) => updateCurrentParam(item.key as any, parseFloat(e.target.value))} 
                          className="w-full h-1.5 bg-slate-800 accent-yellow-500 rounded-lg appearance-none cursor-pointer hover:accent-yellow-400" 
                        />
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-10 self-start">Distribuição de Alocação de Verba</h5>
                <ResponsiveContainer width="100%" height={280}>
                   <PieChart>
                      <Pie data={[
                        { name: 'Performance', value: currentParams.trafegoPago },
                        { name: 'Brand / Offline', value: currentParams.marketingMonthly },
                        { name: 'Viral Growth', value: currentParams.indiqueGanhe + currentParams.parceriasBares },
                        { name: 'Activation', value: currentParams.adesaoTurbo },
                      ]} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                        <Cell fill="#EAB308" />
                        <Cell fill="#64748b" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f97316" />
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', borderRadius: '8px', fontSize: '10px'}} />
                      <Legend wrapperStyle={{fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold'}} verticalAlign="bottom" height={36}/>
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* --- ABA 3: PARAMETRIZAÇÃO --- */}
        {activeTab === 3 && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl animate-in fade-in duration-500">
            <h5 className="text-[11px] font-black uppercase text-yellow-500 mb-10 border-b border-slate-800 pb-4 flex items-center gap-2"><Sliders size={20}/> Painel de Parâmetros Operacionais</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {[
                { label: 'Frota Inicial', key: 'activeDrivers', min: 0, max: 500, step: 1, unit: ' condutores' },
                { label: 'Adição Mensal Frota', key: 'driverAdditionMonthly', min: 0, max: 100, step: 1, unit: ' condutores' },
                { label: 'Corridas p/ Usuário', key: 'ridesPerUserMonth', min: 1, max: 10, step: 0.1, unit: ' rides/mês' },
                { label: 'Tarifa Médio (R$)', key: 'avgFare', min: 10, max: 50, step: 0.5, unit: '' },
                { label: 'Crescimento Usuários (%)', key: 'userGrowth', min: 0, max: 30, step: 1, unit: '%' },
                { label: 'Custos Fixos (R$)', key: 'fixedCosts', min: 0, max: 20000, step: 100, unit: '' },
                { label: 'Tecnologia / APIs (R$/ride)', key: 'apiMaintenanceRate', min: 0, max: 2, step: 0.05, unit: '' },
              ].map(item => (
                <div key={item.key} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{item.label}</span>
                    <span className="text-yellow-500 text-lg">{(currentParams as any)[item.key]}{item.unit}</span>
                  </div>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={(currentParams as any)[item.key]} onChange={(e) => updateCurrentParam(item.key as any, parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 accent-yellow-500 rounded-lg appearance-none cursor-pointer hover:accent-yellow-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA 4: DRIVERS/ ESCALA --- */}
        {activeTab === 4 && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* CAMPANHA DE INCENTIVO */}
                 <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2"><Award size={18}/> Campanha de Incentivo: Tarifas Progressivas</h5>
                    <div className="space-y-2">
                       <p className="text-[9px] text-slate-400 uppercase leading-relaxed mb-4">Bonificamos a meritocracia: Quanto mais corridas o motorista realiza no mês, menor é o Take Rate da plataforma.</p>
                       <div className="divide-y divide-slate-800/50">
                          {[
                            { range: '> 600 Corridas', rate: '10%' },
                            { range: '500 - 599 Corridas', rate: '11%' },
                            { range: '400 - 499 Corridas', rate: '12%' },
                            { range: '300 - 399 Corridas', rate: '13%' },
                            { range: '< 300 Corridas (Base)', rate: '15%' },
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between py-3">
                               <span className="text-[10px] font-bold text-slate-300">{item.range}</span>
                               <span className="text-[10px] font-black text-yellow-500">{item.rate}</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-6 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                          <ShieldCheck size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                          <span className="text-[8px] text-yellow-500/80 uppercase font-bold leading-tight">Métrica auditada mensalmente. Cashback creditado automaticamente na carteira do condutor.</span>
                       </div>
                    </div>
                 </div>

                 {/* GAP DE FROTA */}
                 <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8 flex items-center gap-2"><UserCheck size={18}/> Gestão de Frota Alvo e GAP de Atendimento</h5>
                    <div className="overflow-x-auto">
                       <table className="w-full text-[10px] text-left border-collapse">
                          <thead className="bg-slate-950 text-slate-500 font-black uppercase border-b border-slate-800">
                             <tr><th className="p-5">Mês</th><th className="p-5 text-center">Frota Real</th><th className="p-5 text-center">Alvo (Min 50)</th><th className="p-5 text-center">GAP</th><th className="p-5 text-right">Status Cobertura</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/20">
                             {results.map(r => {
                               const target = Math.max(50, Math.round(r.users / 200));
                               const cov = getCoverage(r.drivers, r.users);
                               const meta = getStatusMetadata(cov);
                               const gap = r.drivers - target;
                               return (
                                 <tr key={r.month} className="hover:bg-slate-800/10">
                                    <td className="p-5 font-black text-white">MÊS {r.month}</td>
                                    <td className="p-5 text-center font-bold">{r.drivers}</td>
                                    <td className="p-5 text-center text-slate-500">{target}</td>
                                    <td className={`p-5 text-center font-black ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gap > 0 ? `+${gap}` : gap}</td>
                                    <td className={`p-5 text-right font-black ${meta.color}`}>
                                       <span className="mr-3">{cov.toFixed(2)}</span>
                                       <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${meta.bg}`}>{meta.label}</span>
                                    </td>
                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- ABA 5: PROJEÇÕES/ ESCALA --- */}
        {activeTab === 5 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[500px] animate-in fade-in duration-500">
             <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-8">Escalabilidade de Operação e Frota</h5>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                   <YAxis stroke="#475569" fontSize={9} />
                   <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '10px'}} />
                   <Legend wrapperStyle={{fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold'}} verticalAlign="top" height={36}/>
                   <Line type="stepAfter" dataKey="users" name="Usuários Ativos" stroke="#EAB308" strokeWidth={3} dot={false} />
                   <Line type="stepAfter" dataKey="drivers" name="Frota Real" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        )}

        {/* --- ABA 6: 36 meses --- */}
        {activeTab === 6 && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[350px]">
                 <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-4">GMV Bruto (3 Anos)</h5>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results}>
                       <Area type="monotone" dataKey="grossRevenue" stroke="#EAB308" fill="#EAB308" fillOpacity={0.1} />
                       <Tooltip formatter={v => formatCurrency(v as number)} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[350px]">
                 <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-4">Receita Líquida TKX</h5>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results}>
                       <Area type="monotone" dataKey="takeRateRevenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                       <Tooltip formatter={v => formatCurrency(v as number)} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        )}

        {/* --- ABA 7: DRE --- */}
        {activeTab === 7 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase flex items-center gap-2"><FileText size={18}/> Demonstrativo de Resultados Detalhado</h5>
                <div className="flex bg-slate-950 p-1 rounded-lg no-print">
                   {[2026, 2027, 2028, 'total'].map(y => (
                     <button key={y} onClick={() => setDreYear(y as any)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${dreYear === y ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>{y}</button>
                   ))}
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse min-w-[1200px]">
                   <thead className="bg-slate-950 text-slate-500 font-black uppercase border-b border-slate-800">
                      <tr><th className="p-4 sticky left-0 bg-slate-950 z-20">Resultado Financeiro</th>{filteredDreResults.map(r=><th key={r.month} className="p-4 text-center">{r.monthName.substring(0,3)}</th>)}<th className="p-4 text-right bg-slate-800/50 text-white">Acumulado</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/20 text-slate-300">
                      <tr className="bg-slate-900/40"><td className="p-4 sticky left-0 bg-slate-900 font-bold text-white uppercase">1. GMV Bruto</td>{filteredDreResults.map(r=><td key={r.month} className="p-4 text-center">{formatCurrency(r.grossRevenue).replace('R$', '')}</td>)}<td className="p-4 text-right font-black">{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.grossRevenue,0))}</td></tr>
                      <tr className="bg-yellow-500/10"><td className="p-4 sticky left-0 bg-slate-900 font-black text-yellow-500 uppercase">2. Receita Líquida TKX</td>{filteredDreResults.map(r=><td key={r.month} className="p-4 text-center font-bold text-yellow-500">{formatCurrency(r.takeRateRevenue).replace('R$', '')}</td>)}<td className="p-4 text-right font-black text-yellow-500">{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.takeRateRevenue,0))}</td></tr>
                      
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Impostos (11.2%)</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.taxes).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.taxes, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Custos Variáveis / Bancários</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.variableCosts).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.variableCosts, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Custos Fixos</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.fixedCosts).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.fixedCosts, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Marketing</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.marketing).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.marketing, 0))}</td>
                      </tr>
                      <tr>
                        <td className="p-4 sticky left-0 bg-slate-900 pl-8 text-slate-500">(-) Tecnologia / APIs</td>
                        {filteredDreResults.map(r => <td key={r.month} className="p-4 text-center opacity-60 text-red-400/70">{formatCurrency(r.tech).replace('R$', '')}</td>)}
                        <td className="p-4 text-right opacity-60 text-red-400/70">{formatCurrency(filteredDreResults.reduce((a, b) => a + b.tech, 0))}</td>
                      </tr>

                      <tr className="bg-slate-950 font-black text-white border-y-2 border-slate-800"><td className="p-6 sticky left-0 bg-slate-950 uppercase text-green-400 tracking-widest text-[11px]">3. EBITDA / Lucro Operacional</td>{filteredDreResults.map(r=><td key={r.month} className={`p-6 text-center ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(r.netProfit).replace('R$', '')}</td>)}<td className={`p-6 text-right ${filteredDreResults.reduce((a,b)=>a+b.netProfit,0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(filteredDreResults.reduce((a,b)=>a+b.netProfit,0))}</td></tr>
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- ABA 8: kpis --- */}
        {activeTab === 8 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {renderMetricCard('LTV / CAC', `${(lastResult.ltv / (lastResult.cac || 1)).toFixed(1)}x`, 'Eficiência de Aquisição', <Activity size={18}/>, 'pos')}
               {renderMetricCard('Churn Rate', `${currentParams.churnRate}%`, 'Evasão de Usuários', <AlertTriangle size={18}/>, 'neg')}
               {renderMetricCard('ARPU TKX', formatCurrency(lastResult.takeRateRevenue / lastResult.users), 'Receita por Usuário', <Coins size={18}/>)}
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[350px]">
               <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Equilíbrio Frota vs Demanda</h5>
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={results}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                     <YAxis yAxisId="left" stroke="#475569" fontSize={9} />
                     <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={9} />
                     <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '10px'}} />
                     <Bar yAxisId="left" dataKey="rides" name="Corridas Realizadas" fill="#EAB308" radius={[4,4,0,0]} />
                     <Line yAxisId="right" type="monotone" dataKey="drivers" name="Frota Real" stroke="#64748b" strokeWidth={3} dot={false} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- ABA 9: Cenários --- */}
        {activeTab === 9 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {Object.values(ScenarioType).map(t => {
              const res = calculateProjections(paramsMap[t], t);
              const last = res[res.length-1];
              return (
                <div key={t} className={`bg-slate-900 border ${scenario === t ? 'border-yellow-500' : 'border-slate-800'} p-6 rounded-2xl relative`}>
                  <div className="text-[10px] font-black uppercase text-slate-500 mb-6">{t}</div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span>GMV M36</span><span className="font-bold">{formatCurrency(last.grossRevenue)}</span></div>
                    <div className="flex justify-between"><span>Lucro M36</span><span className="font-bold text-green-400">{formatCurrency(last.netProfit)}</span></div>
                    <div className="flex justify-between"><span>Status</span><span className={`font-black ${last.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>{last.netProfit > 0 ? 'VIÁVEL' : 'INVESTIMENTO ALTO'}</span></div>
                  </div>
                  {scenario === t && <div className="absolute top-4 right-4 text-yellow-500"><Target size={16}/></div>}
                </div>
              );
            })}
          </div>
        )}

        {/* --- ABA 10: Geral --- */}
        {activeTab === 10 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderMetricCard('GMV Mensal (M36)', formatCurrency(lastResult.grossRevenue), 'Faturamento Bruto', <Coins size={18}/>)}
              {renderMetricCard('Lucro Mensal (M36)', formatCurrency(lastResult.netProfit), 'Resultado Líquido', <TrendingUp size={18}/>, lastResult.netProfit > 0 ? 'pos' : 'neg')}
              {renderMetricCard('Frota Ativa', lastResult.drivers, 'Motoristas Cadastrados', <UserCheck size={18}/>)}
              {renderMetricCard('Usuários Ativos', lastResult.users.toLocaleString(), 'Base de Passageiros', <Users size={18}/>)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderMetricCard('Equity M36', formatCurrency(lastResult.accumulatedProfit), 'Saldo Acumulado', <Wallet size={18}/>)}
              {renderMetricCard('Market Share', `${((lastResult.users / FRANCA_STATS.digitalUsers) * 100).toFixed(1)}%`, 'Participação', <Target size={18}/>)}
              {renderMetricCard('Break-even', results.findIndex(r=>r.netProfit>0) !== -1 ? `Mês ${results.findIndex(r=>r.netProfit>0)+1}` : 'N/A', 'Mês de Equilíbrio', <Activity size={18}/>, 'pos')}
              {renderMetricCard('Valuation', formatCurrency(lastResult.ebitda * 12 * 8 / 12), 'Múltiplo 8x', <Landmark size={18}/>)}
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-[400px]">
              <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6 flex items-center gap-2"><TrendingUp size={18}/> Patrimônio Projetado</h5>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip contentStyle={{backgroundColor: '#020617', border: 'none', fontSize: '10px'}} />
                  <Area type="monotone" dataKey="accumulatedProfit" name="Saldo" stroke="#EAB308" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- ABA 11: VISÃO 360º --- */}
        {activeTab === 11 && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                   <Briefcase className="absolute -right-4 -bottom-4 text-slate-800 group-hover:text-slate-700 transition-colors" size={120} />
                   <span className="text-[9px] text-slate-500 uppercase font-black">Valuation Projetado M36</span>
                   <div className="text-3xl font-black text-white mt-2">{formatCurrency(lastResult.ebitda * 12 * 8 / 12)}</div>
                   <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Múltiplo 8x EBITDA</div>
                </div>
                {renderMetricCard('ROI Total', `${((lastResult.accumulatedProfit / currentParams.initialInvestment) * 100).toFixed(0)}%`, 'Retorno s/ Capital', <TrendingUp size={18}/>, 'pos')}
                {renderMetricCard('Burn Máximo', formatCurrency(Math.min(...results.map(r=>r.netProfit))), 'Custo Operacional', <Zap size={18}/>, 'neg')}
             </div>
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase mb-6">Performance Anual Auditada</h5>
                <table className="w-full text-[10px] text-left">
                   <thead className="bg-slate-950 text-slate-500 uppercase font-black">
                      <tr><th className="p-4">Ano</th><th className="p-4">GMV Total</th><th className="p-4">Rec. TKX</th><th className="p-4">Profit Líquido</th><th className="p-4 text-right">Drivers/Users</th></tr>
                   </thead>
                   <tbody>
                      {audits.map(a => (
                        <tr key={a.year} className="border-t border-slate-800">
                           <td className="p-4 font-black text-white">{a.year}</td>
                           <td className="p-4">{formatCurrency(a.totalGMV)}</td>
                           <td className="p-4 text-yellow-500">{formatCurrency(a.totalRevenue)}</td>
                           <td className="p-4 text-green-400 font-bold">{formatCurrency(a.totalNetProfit)}</td>
                           <td className="p-4 text-right">{a.endDrivers} / {a.endUsers.toLocaleString()}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

      </div>

      {/* OVERLAY DE ALERTAS */}
      {supplyBottleneck && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-xs font-black uppercase text-center z-[100] animate-pulse">
          <AlertTriangle size={14} className="inline mr-2" /> Gargalo de Atendimento Detectado
        </div>
      )}
      
      {oversupplyWarning && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-600 text-white p-2 text-xs font-black uppercase text-center z-[100]">
          <Info size={14} className="inline mr-2" /> Excesso de Oferta de Motoristas
        </div>
      )}
    </Layout>
  );
};

export default App;
