import React, { useState, useEffect } from 'react';
import { Batch, Keg, BottleStock, Recipe } from '../types';
import { Beer, Package, AlertTriangle, CheckCircle, ArrowLeft, Database, Edit2, Clock, Tag, Box, Cylinder, PieChart as PieChartIcon, LayoutGrid } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
    tanks: Batch[];
    kegs: Keg[];
    bottles: BottleStock[];
    recipes: Recipe[];
    onUpdateKegLocation: (kegId: string, location: string) => void;
}

const STORAGE_KEY = 'dashboard_layout_v1';

export const Dashboard: React.FC<DashboardProps> = ({ tanks, kegs, bottles, recipes, onUpdateKegLocation }) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [editingKeg, setEditingKeg] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState('');
  
  // Layout State
  const [layouts, setLayouts] = useState<any>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
  });

  const getStatsForStyle = (recipeName: string) => {
      const activeTanks = tanks.filter(t => t.recipeName === recipeName && t.status !== 'Empty');
      const tankVol = activeTanks.reduce((acc, t) => acc + t.volume, 0);

      const styleKegs = kegs.filter(k => k.recipeName === recipeName && k.status !== 'Empty');
      const kegVol = styleKegs.reduce((acc, k) => acc + k.volume, 0);
      
      const styleBottles = bottles.filter(b => b.recipeName === recipeName);
      const totalBottleCount = styleBottles.reduce((acc, b) => acc + b.count, 0);
      const totalBottleVol = styleBottles.reduce((acc, b) => acc + (b.count * b.volumePerBottle), 0);

      const totalVol = tankVol + kegVol + totalBottleVol;

      return { activeTanks, styleKegs, styleBottles, tankVol, kegVol, totalBottleCount, totalBottleVol, totalVol };
  };

  const kegSummary = React.useMemo(() => Object.values(kegs
      .filter(k => k.status !== 'Empty' && k.status !== 'Cleaning')
      .reduce((acc, keg) => {
          const key = `${keg.recipeName}-${keg.volume}`;
          if (!acc[key]) {
              acc[key] = {
                  recipeName: keg.recipeName,
                  volume: keg.volume,
                  total: 0,
                  inHouse: 0,
                  retail: 0
              };
          }
          acc[key].total++;
          if (keg.status === 'In-House') acc[key].inHouse++;
          if (keg.status === 'Retail' || keg.status === 'Distributor') acc[key].retail++;
          return acc;
      }, {} as Record<string, { recipeName: string, volume: number, total: number, inHouse: number, retail: number }>))
      .sort((a, b) => a.recipeName.localeCompare(b.recipeName)), [kegs]);

  // Prepare Data for Pie Chart
  const chartData = React.useMemo(() => recipes.map(recipe => {
      const stats = getStatsForStyle(recipe.name);
      return {
          name: recipe.name,
          value: stats.totalVol
      };
  }).filter(item => item.value > 0), [recipes, tanks, kegs, bottles]);

  // Generate default layout if not present
  useEffect(() => {
    if (!layouts) {
        const generatedLayouts: any = { lg: [], md: [], sm: [] };
        
        // Chart Widget (Top Right)
        generatedLayouts.lg.push({ i: 'chart', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 8 });
        generatedLayouts.md.push({ i: 'chart', x: 6, y: 0, w: 4, h: 10 });
        generatedLayouts.sm.push({ i: 'chart', x: 0, y: 0, w: 6, h: 10 });

        // Recipe Widgets (Grid)
        recipes.forEach((recipe, index) => {
            // LG: 3 columns in the first 8 cols space (0-8)
            const colLg = (index % 2) * 4; 
            const rowLg = Math.floor(index / 2) * 8; 
            
            generatedLayouts.lg.push({ i: recipe.id, x: colLg, y: rowLg, w: 4, h: 8 });
            generatedLayouts.md.push({ i: recipe.id, x: (index % 2) * 3, y: Math.floor(index / 2) * 8, w: 3, h: 8 });
            generatedLayouts.sm.push({ i: recipe.id, x: 0, y: 10 + (index * 8), w: 6, h: 8 });
        });

        // Keg Summary Widget (Bottom)
        const summaryY = Math.ceil(recipes.length / 2) * 8 + 10;
        const kegRows = kegSummary.length || 1;
        const kegH = 5 + (kegRows * 2);

        generatedLayouts.lg.push({ i: 'keg-summary', x: 0, y: summaryY, w: 12, h: kegH });
        generatedLayouts.md.push({ i: 'keg-summary', x: 0, y: summaryY, w: 10, h: kegH });
        generatedLayouts.sm.push({ i: 'keg-summary', x: 0, y: summaryY + 20, w: 6, h: kegH });

        // Bottle Summary Widget (Below Keg Summary)
        const bottleY = summaryY + kegH;
        const bottleRows = bottles.length > 0 ? bottles.length : 1; // Approx
        const bottleH = 5 + (bottleRows * 2);

        generatedLayouts.lg.push({ i: 'bottle-summary', x: 0, y: bottleY, w: 12, h: bottleH });
        generatedLayouts.md.push({ i: 'bottle-summary', x: 0, y: bottleY, w: 10, h: bottleH });
        generatedLayouts.sm.push({ i: 'bottle-summary', x: 0, y: bottleY + 20, w: 6, h: bottleH });

        setLayouts(generatedLayouts);
    }
  }, [recipes, layouts, kegSummary.length, bottles.length]);

  const onLayoutChange = (_layout: Layout, allLayouts: any) => {
        setLayouts(allLayouts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
    };

  const handleResetLayout = () => {
      localStorage.removeItem(STORAGE_KEY);
      setLayouts(null); // Will trigger useEffect to regenerate
  };

  const calculateDaysRemaining = (dispatchDate: string | undefined, shelfLife: number) => {
      if (!dispatchDate) return null; 
      const dispatch = new Date(dispatchDate);
      const expiry = new Date(dispatch);
      expiry.setDate(dispatch.getDate() + shelfLife);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysElapsed = (startDate?: string) => {
      if (!startDate || startDate === '-') return 0;
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return days === 0 ? 1 : days;
  };

  const handleSaveLocation = (kegId: string) => {
      if(newLocation.trim()) {
          onUpdateKegLocation(kegId, newLocation);
          setEditingKeg(null);
          setNewLocation('');
      }
  };

  const formatBottleSize = (vol: number) => {
      if (vol >= 1) return `${vol}L`;
      if (vol === 0.6) return '600ml';
      if (vol === 0.5) return '500ml';
      if (vol === 0.355) return '355ml';
      if (vol === 0.3) return '300ml';
      return `${(vol * 1000).toFixed(0)}ml`;
  };

  if (selectedStyle) {
      const stats = getStatsForStyle(selectedStyle);
      const recipe = recipes.find(r => r.name === selectedStyle);

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedStyle(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                      <ArrowLeft size={20} className="text-slate-600" />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-industrial-900">{selectedStyle}</h2>
                      <p className="text-slate-500">{recipe?.style} • {recipe?.abv}% ABV • Validade no PDV: {recipe?.shelfLife || 30} dias</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><Database size={18} /> Em Produção (Tanques)</h3>
                      {stats.activeTanks.length === 0 ? (
                          <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">Nenhum tanque ativo com esta receita.</div>
                      ) : (
                          stats.activeTanks.map(tank => {
                              let timeInfo = '';
                              if (tank.status === 'Fermenting') timeInfo = `Dia ${getDaysElapsed(tank.brewDate)} (Ferm)`;
                              else if (tank.status === 'Conditioning') timeInfo = `Dia ${getDaysElapsed(tank.conditioningDate || tank.brewDate)} (Mat)`;
                              else if (tank.status === 'Packaging') timeInfo = 'Pronto para Envase';

                              return (
                              <div key={tank.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-bold text-lg text-industrial-900">{tank.tankId}</span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-700`}>{tank.status}</span>
                                  </div>
                                  <div className="text-2xl font-bold text-brew-600 mb-1">{tank.volume.toLocaleString()} L</div>
                                  <div className="text-xs text-slate-400 mb-2">de {tank.capacity} L (Capacidade)</div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-brew-500" style={{ width: `${(tank.volume / tank.capacity) * 100}%` }}></div>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                      <span>SG: {tank.currentGravity}</span>
                                      <span className="font-bold text-slate-700 flex items-center gap-1"><Clock size={12}/> {timeInfo}</span>
                                  </div>
                              </div>
                          )})
                      )}
                  </div>

                  <div className="space-y-6 lg:col-span-2">
                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Package size={18} /> Estoque de Barris & Localização ({stats.styleKegs.length})</h3>
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                               <table className="w-full text-sm text-left">
                                   <thead className="bg-slate-50 text-slate-500 font-medium">
                                       <tr>
                                           <th className="px-4 py-2">ID</th>
                                           <th className="px-4 py-2">Vol</th>
                                           <th className="px-4 py-2">Local / Cliente</th>
                                           <th className="px-4 py-2">Data Envase</th>
                                           <th className="px-4 py-2">Validade (PDV)</th>
                                           <th className="px-4 py-2">Ação</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {stats.styleKegs.length === 0 ? (
                                           <tr><td colSpan={6} className="p-4 text-center text-slate-400">Nenhum barril cheio.</td></tr>
                                       ) : (
                                           stats.styleKegs.map(keg => {
                                               const daysLeft = calculateDaysRemaining(keg.dispatchDate, recipe?.shelfLife || 30);
                                               let expiryBadge;
                                               if (daysLeft === null) expiryBadge = <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">Aguardando Saída</span>;
                                               else {
                                                   let color = 'text-green-600 bg-green-50';
                                                   if (daysLeft < 0) color = 'text-red-600 bg-red-50';
                                                   else if (daysLeft < 7) color = 'text-amber-600 bg-amber-50';
                                                   expiryBadge = <span className={`text-xs font-bold px-2 py-1 rounded border border-transparent ${color}`}>{daysLeft < 0 ? 'VENCIDO' : `${daysLeft} dias`}</span>;
                                               }
                                               return (
                                               <tr key={keg.id}>
                                                   <td className="px-4 py-3 font-mono font-bold text-industrial-900">{keg.id}</td>
                                                   <td className="px-4 py-3">{keg.volume}L</td>
                                                   <td className="px-4 py-3">
                                                       {editingKeg === keg.id ? (
                                                           <div className="flex gap-2"><input type="text" className="border border-slate-300 rounded px-2 py-1 w-full text-xs" autoFocus value={newLocation} onChange={(e) => setNewLocation(e.target.value)} /><button onClick={() => handleSaveLocation(keg.id)} className="text-green-600 font-bold text-xs">OK</button></div>
                                                       ) : (<span className={`text-xs px-2 py-0.5 rounded-full ${keg.status === 'In-House' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>{keg.customer || 'Fábrica'}</span>)}
                                                   </td>
                                                   <td className="px-4 py-3 text-xs text-slate-500">{keg.fillDate}</td>
                                                   <td className="px-4 py-3">{expiryBadge}</td>
                                                   <td className="px-4 py-3"><button onClick={() => { setEditingKeg(keg.id); setNewLocation(keg.customer || ''); }} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-brew-600"><Edit2 size={16} /></button></td>
                                               </tr>
                                           )})
                                       )}
                                   </tbody>
                               </table>
                          </div>
                      </div>

                      {/* NOVA TABELA DE DETALHAMENTO DE RÓTULOS NA VISÃO DE ESTILO */}
                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Beer size={18} /> Detalhamento de Rótulos (Garrafas)</h3>
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                               <table className="w-full text-sm text-left">
                                   <thead className="bg-slate-50 text-slate-500 font-medium">
                                       <tr>
                                           <th className="px-4 py-2">Rótulo / Edição</th>
                                           <th className="px-4 py-2">Formato</th>
                                           <th className="px-4 py-2 text-right">Quantidade</th>
                                           <th className="px-4 py-2 text-right">Volume Eq.</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {stats.styleBottles.length === 0 ? (
                                           <tr><td colSpan={4} className="p-4 text-center text-slate-400">Nenhuma garrafa em estoque para este estilo.</td></tr>
                                       ) : (
                                           stats.styleBottles.map((b, i) => (
                                               <tr key={i} className="hover:bg-slate-50">
                                                   <td className="px-4 py-3 flex items-center gap-2 font-bold text-industrial-900">
                                                       <div className="w-8 h-8 rounded-lg bg-brew-50 border border-brew-100 flex items-center justify-center text-brew-600">
                                                           <Tag size={16} />
                                                       </div>
                                                       {b.labelName}
                                                   </td>
                                                   <td className="px-4 py-3 text-slate-500">
                                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{formatBottleSize(b.volumePerBottle)}</span>
                                                   </td>
                                                   <td className="px-4 py-3 text-right font-bold text-lg">{b.count}</td>
                                                   <td className="px-4 py-3 text-right text-slate-500">{(b.count * b.volumePerBottle).toFixed(1)} L</td>
                                               </tr>
                                           ))
                                       )}
                                   </tbody>
                               </table>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-500 mb-1">Total Garrafas (Estoque Estilo)</div>
                            <div className="text-3xl font-bold text-industrial-900">{stats.totalBottleCount} un.</div>
                            <div className="text-xs text-slate-400 mt-1">Volume Eq: {stats.totalBottleVol.toFixed(1)} L</div>
                          </div>
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Beer size={24} /></div>
                      </div>
                      <div className="bg-industrial-900 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
                          <div>
                              <div className="flex items-center gap-2 mb-2 opacity-75"><CheckCircle size={20} /><span className="font-bold uppercase tracking-wider text-sm">Disponibilidade Total</span></div>
                              <div className="text-4xl font-bold">{stats.totalVol.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-2xl opacity-50">L</span></div>
                          </div>
                          <div className="text-right text-xs text-slate-400 max-w-[150px]">Somatória de Tanques, Barris e Rótulos.</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const COLORS = ['#eab308', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#64748b'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-industrial-900">Dashboard de Estoque & Produção</h2>
            <p className="text-slate-500">Acompanhe o volume em tanques, barris cheios e o estoque detalhado por rótulo.</p>
        </div>
        <button onClick={handleResetLayout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brew-600 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <LayoutGrid size={16} /> Resetar Layout
        </button>
      </div>

      {layouts ? (
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            onLayoutChange={onLayoutChange}
            draggableHandle=".drag-handle"
            margin={[24, 24]}
        >
        {/* Chart Widget */}
        {chartData.length > 0 && (
          <div key="chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between drag-handle cursor-move select-none">
                  <div className="flex items-center gap-2">
                      <PieChartIcon className="text-brew-600" size={18} />
                      <h3 className="font-bold text-industrial-900">Distribuição</h3>
                  </div>
              </div>
              <div className="flex-1 p-2 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: any) => [`${value?.toLocaleString() || 0} Litros`, 'Volume Total']}
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
        )}

        {/* Recipe Widgets */}
        {recipes.map(recipe => {
            const stats = getStatsForStyle(recipe.name);
            const isOutStock = stats.kegVol === 0 && stats.totalBottleVol === 0;
            return (
            <div key={recipe.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:ring-2 hover:ring-brew-100 transition-shadow">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start w-full drag-handle cursor-move select-none">
                    <div><h3 className="text-lg font-bold text-industrial-900">{recipe.name}</h3><span className="text-xs font-bold text-slate-500 uppercase">{recipe.style} • {recipe.abv}% ABV</span></div>
                    {isOutStock ? (<div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100"><AlertTriangle size={14} /> SEM ESTOQUE</div>) : (<div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-100"><CheckCircle size={14} /> DISPONÍVEL</div>)}
                </div>
                <button onClick={() => setSelectedStyle(recipe.name)} className="flex-1 text-left w-full flex flex-col h-full">
                    <div className="p-6 text-center border-b border-slate-100 w-full"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Volume Total</span><div className="text-3xl font-bold text-industrial-900 mt-1">{stats.totalVol.toLocaleString()} <span className="text-lg text-slate-400">L</span></div></div>
                    <div className="flex-1 p-4 grid grid-cols-3 gap-2 divide-x divide-slate-100 w-full items-center">
                        <div className="text-center px-1"><div className="text-[10px] text-slate-400 font-bold mb-1">TANQUE</div><div className="font-bold text-sm text-brew-600">{stats.tankVol.toLocaleString()} L</div></div>
                        <div className="text-center px-1"><div className="text-[10px] text-slate-400 font-bold mb-1">BARRIS</div><div className="font-bold text-sm text-industrial-800">{stats.styleKegs.length}</div></div>
                        <div className="text-center px-1"><div className="text-[10px] text-slate-400 font-bold mb-1">GARRAFAS</div><div className="font-bold text-sm text-industrial-800">{stats.totalBottleCount}</div></div>
                    </div>
                    <div className="bg-slate-50 p-2 text-center text-xs font-bold text-brew-600 border-t border-slate-100 w-full group-hover:bg-brew-50 transition-colors mt-auto">Ver Detalhes &rarr;</div>
                </button>
            </div>
            );
        })}

        {/* Keg Summary Widget */}
        <div key="keg-summary" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 drag-handle cursor-move select-none">
                    <Cylinder className="text-brew-600" size={20} />
                    <h3 className="font-bold text-industrial-900">Resumo de Estoque de Barris</h3>
            </div>
            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 bg-slate-50">Cerveja</th>
                            <th className="px-6 py-3 text-center bg-slate-50">Vol</th>
                            <th className="px-6 py-3 text-center bg-slate-50">Total</th>
                            <th className="px-6 py-3 text-center text-green-700 bg-slate-50">Fábrica</th>
                            <th className="px-6 py-3 text-center text-blue-700 bg-slate-50">Ext.</th>
                            <th className="px-6 py-3 text-right bg-slate-50">Vol. Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {kegSummary.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">Nenhum barril cheio.</td></tr>
                        ) : (
                            kegSummary.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-industrial-900">{item.recipeName}</td>
                                    <td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{item.volume}L</span></td>
                                    <td className="px-6 py-3 text-center font-bold">{item.total}</td>
                                    <td className="px-6 py-3 text-center text-green-600 font-bold">{item.inHouse}</td>
                                    <td className="px-6 py-3 text-center text-blue-600 font-bold">{item.retail}</td>
                                    <td className="px-6 py-3 text-right text-slate-500 font-mono">{(item.total * item.volume).toFixed(0)} L</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Bottle Summary Widget */}
        <div key="bottle-summary" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 drag-handle cursor-move select-none">
                <Box className="text-brew-600" size={20} />
                <h3 className="font-bold text-industrial-900">Resumo de Estoque por Rótulo</h3>
            </div>
            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 bg-slate-50">Rótulo</th>
                            <th className="px-6 py-3 bg-slate-50">Estilo Base</th>
                            <th className="px-6 py-3 text-center bg-slate-50">Formato</th>
                            <th className="px-6 py-3 text-right bg-slate-50">Estoque</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bottles.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">Nenhuma garrafa.</td></tr>
                        ) : (
                            bottles.map((b, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 flex items-center gap-2 font-bold text-industrial-900"><Tag size={14} className="text-brew-500" /> {b.labelName}</td>
                                    <td className="px-6 py-3 text-slate-600">{b.recipeName}</td>
                                    <td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{formatBottleSize(b.volumePerBottle)}</span></td>
                                    <td className="px-6 py-3 text-right font-bold text-brew-600">{b.count} un</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </ResponsiveGridLayout>
      ) : (
          <div className="flex items-center justify-center h-64 text-slate-400 gap-2"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brew-600"></div> Carregando Dashboard...</div>
      )}
    </div>
  );
};