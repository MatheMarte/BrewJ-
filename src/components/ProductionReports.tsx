import React, { useState, useMemo } from 'react';
import { ProductionHistoryItem, ActionType, Recipe } from '../types';
import { FileText, Calendar, PlayCircle, Package, CheckSquare, Download, BarChart2, ArrowRight, ArrowLeft, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProductionReportsProps {
    history: ProductionHistoryItem[];
    recipes: Recipe[];
}

export const ProductionReports: React.FC<ProductionReportsProps> = ({ history, recipes }) => {
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [chartView, setChartView] = useState<'production' | 'kegs' | 'styles' | 'finished_batches'>('production');

    const getActionIcon = (type: ActionType) => {
        switch (type) {
            case 'BREW': return <PlayCircle size={18} className="text-blue-500" />;
            case 'KEG': return <Package size={18} className="text-brew-600" />;
            case 'BOTTLE': return <Package size={18} className="text-purple-600" />;
            case 'FINISH': return <CheckSquare size={18} className="text-green-600" />;
            case 'DISPATCH': return <ArrowRight size={18} className="text-orange-500" />;
            case 'RETURN': return <ArrowLeft size={18} className="text-teal-500" />;
            default: return <FileText size={18} />;
        }
    };

    const getActionLabel = (type: ActionType) => {
         switch (type) {
            case 'BREW': return 'Nova Brassagem';
            case 'KEG': return 'Envase Barril';
            case 'BOTTLE': return 'Envase Garrafa';
            case 'FINISH': return 'Finalização Tanque';
            case 'DISPATCH': return 'Expedição / Saída';
            case 'RETURN': return 'Retorno de Barril';
            default: return type;
        }
    };

    // Filter history by selected month
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            // item.date format is assumed to be PT-BR locale string (DD/MM/YYYY, HH:MM:SS) or similar
            // We need to parse it correctly. 
            // The app saves date as: new Date().toLocaleString('pt-BR')
            // Example: "26/01/2025, 14:30:00"
            
            const parts = item.date.split(',');
            const dateParts = parts[0].trim().split(' ')[0].split('/'); // Handle "DD/MM/YYYY HH:mm" case too
            
            if (dateParts.length !== 3) return false;
            
            const itemYear = dateParts[2];
            const itemMonth = dateParts[1];
            
            const [selectedYear, selectedMonthNum] = selectedMonth.split('-');
            
            return itemYear === selectedYear && itemMonth === selectedMonthNum;
        });
    }, [history, selectedMonth]);

    // Prepare chart data
    const chartData = useMemo(() => {
        const data: Record<string, { name: string, Produzido: number, Envasado: number }> = {};
        
        filteredHistory.forEach(item => {
            const day = item.date.split('/')[0];
            if (!data[day]) {
                data[day] = { name: `Dia ${day}`, Produzido: 0, Envasado: 0 };
            }
            
            if (item.actionType === 'BREW') {
                data[day].Produzido += item.volumeChanged;
            } else if (item.actionType === 'KEG' || item.actionType === 'BOTTLE') {
                data[day].Envasado += item.volumeChanged;
            }
        });

        return Object.values(data).sort((a, b) => {
            const dayA = parseInt(a.name.split(' ')[1]);
            const dayB = parseInt(b.name.split(' ')[1]);
            return dayA - dayB;
        });
    }, [filteredHistory]);

    const kegMovementData = useMemo(() => {
        const data: Record<string, { name: string, Saiu: number, Voltou: number }> = {};
        
        filteredHistory.forEach(item => {
            const day = item.date.split('/')[0];
            if (!data[day]) {
                data[day] = { name: `Dia ${day}`, Saiu: 0, Voltou: 0 };
            }
            
            if (item.actionType === 'DISPATCH') {
                data[day].Saiu += item.volumeChanged;
            } else if (item.actionType === 'RETURN') {
                data[day].Voltou += item.volumeChanged;
            }
        });

        return Object.values(data).sort((a, b) => {
            const dayA = parseInt(a.name.split(' ')[1]);
            const dayB = parseInt(b.name.split(' ')[1]);
            return dayA - dayB;
        });
    }, [filteredHistory]);

    const styleChartData = useMemo(() => {
        const data: Record<string, { name: string, Produzido: number, Envasado: number }> = {};
        
        filteredHistory.forEach(item => {
            // Find recipe to get style
            const recipe = recipes.find(r => r.name === item.recipeName);
            const style = recipe?.style || 'Outros / N/A';
            
            if (!data[style]) {
                data[style] = { name: style, Produzido: 0, Envasado: 0 };
            }
            
            if (item.actionType === 'BREW') {
                data[style].Produzido += item.volumeChanged;
            } else if (item.actionType === 'KEG' || item.actionType === 'BOTTLE') {
                data[style].Envasado += item.volumeChanged;
            }
        });

        // Filter out entries with 0 volume if desired, or keep them. 
        // Here we keep them if they appeared in history.
        return Object.values(data).sort((a, b) => b.Produzido - a.Produzido);
    }, [filteredHistory, recipes]);

    const finishedBatches = useMemo(() => {
        return filteredHistory
            .filter(item => item.actionType === 'FINISH' && item.batchData)
            .map(item => item.batchData!)
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    }, [filteredHistory]);

    const handleExport = () => {
        if (filteredHistory.length === 0) {
            alert("Não há dados para exportar neste período.");
            return;
        }

        const headers = ["Data", "Hora", "Tipo Ação", "Tanque", "Receita", "Volume (L)", "Detalhes"];
        const csvContent = [
            headers.join(";"),
            ...filteredHistory.map(item => {
                const parts = item.date.split(',');
                return [
                    parts[0].trim(),
                    parts[1] ? parts[1].trim() : '',
                    getActionLabel(item.actionType),
                    item.tankId,
                    item.recipeName,
                    item.volumeChanged,
                    item.details
                ].join(";");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_producao_${selectedMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-industrial-900">Histórico & Relatórios</h2>
                    <p className="text-slate-500">Log completo de atividades da fábrica.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                        <BarChart2 size={18} className="text-slate-400" />
                        <select
                            value={chartView}
                            onChange={(e) => setChartView(e.target.value as 'production' | 'kegs' | 'styles' | 'finished_batches')}
                            className="outline-none text-slate-600 font-medium bg-transparent cursor-pointer"
                        >
                            <option value="production">Produção vs. Envase</option>
                            <option value="kegs">Movimentação de Barris</option>
                            <option value="styles">Por Estilo de Cerveja</option>
                            <option value="finished_batches">Levas Finalizadas</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={18} className="text-slate-400" />
                        <input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="outline-none text-slate-600 font-medium bg-transparent"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-brew-600 text-white rounded-md hover:bg-brew-700 transition font-bold text-sm"
                    >
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {chartView === 'finished_batches' && (
                     <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <CheckSquare size={20} className="text-green-600"/> 
                            Relatório Detalhado de Levas Finalizadas
                        </h3>
                        <div className="space-y-6">
                            {finishedBatches.length > 0 ? finishedBatches.map((batch, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-xl p-6 bg-slate-50 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-industrial-900 flex items-center gap-2">
                                                {batch.recipeSnapshot.name}
                                                <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{batch.recipeSnapshot.style}</span>
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-1">Tanque: <b>{batch.tankId}</b> | Início: {new Date(batch.startDate).toLocaleDateString('pt-BR')} | Fim: {new Date(batch.endDate).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="text-right">
                                            {batch.qualityControl ? (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${batch.qualityControl.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {batch.qualityControl.isApproved ? 'Aprovado CQ' : 'Reprovado CQ'}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-500">Sem CQ</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-700 mb-2 uppercase flex items-center gap-2"><FileText size={14}/> Dados Técnicos</h5>
                                            <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">pH Final:</span>
                                                    <span className="font-mono font-bold">{batch.qualityControl?.finalPh || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">ABV Final:</span>
                                                    <span className="font-mono font-bold">{batch.qualityControl?.finalAbv ? `${batch.qualityControl.finalAbv}%` : '-'}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-100">
                                                    <span className="block text-slate-500 text-xs mb-1">Notas Sensoriais:</span>
                                                    <p className="italic text-slate-700">{batch.qualityControl?.sensoryNotes || 'Nenhuma nota registrada.'}</p>
                                                </div>
                                                {batch.qualityControl?.labNotes && (
                                                    <div className="pt-2 border-t border-slate-100">
                                                        <span className="block text-slate-500 text-xs mb-1">Laboratório:</span>
                                                        <p className="text-slate-700">{batch.qualityControl.labNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-sm text-slate-700 mb-2 uppercase flex items-center gap-2"><Package size={14}/> Ingredientes Utilizados</h5>
                                            <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm max-h-[200px] overflow-y-auto">
                                                <table className="w-full text-left">
                                                    <thead className="text-xs text-slate-400 border-b border-slate-100">
                                                        <tr>
                                                            <th className="pb-1">Nome</th>
                                                            <th className="pb-1 text-right">Qtd</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {batch.recipeSnapshot.ingredients.map((ing, i) => (
                                                            <tr key={i}>
                                                                <td className="py-2 text-slate-600">{ing.name}</td>
                                                                <td className="py-2 text-right font-mono text-slate-800">{ing.quantity} {ing.unit}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhuma leva finalizada com dados detalhados neste período.</p>
                                </div>
                            )}
                        </div>
                     </div>
                )}
                {chartView === 'production' && (
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <BarChart2 size={20} className="text-brew-600"/> 
                            Produção vs. Envase ({selectedMonth})
                        </h3>
                        <div className="h-[300px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            cursor={{fill: '#f1f5f9'}}
                                        />
                                        <Legend />
                                        <Bar dataKey="Produzido" name="Produzido (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="Envasado" name="Envasado (L)" fill="#d97706" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <BarChart2 size={48} className="mb-2 opacity-20" />
                                    <p>Sem dados para exibir no gráfico neste mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {chartView === 'kegs' && (
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <ArrowRight size={20} className="text-orange-500"/> 
                            Movimentação de Barris: Saída vs. Retorno ({selectedMonth})
                        </h3>
                        <div className="h-[300px] w-full">
                            {kegMovementData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={kegMovementData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            cursor={{fill: '#f1f5f9'}}
                                        />
                                        <Legend />
                                        <Bar dataKey="Saiu" name="Saiu (L)" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="Voltou" name="Voltou (L)" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Package size={48} className="mb-2 opacity-20" />
                                    <p>Sem movimentação de barris neste mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {chartView === 'styles' && (
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-purple-600"/> 
                            Volume por Estilo ({selectedMonth})
                        </h3>
                        <div className="h-[300px] w-full">
                            {styleChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={styleChartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            cursor={{fill: '#f1f5f9'}}
                                        />
                                        <Legend />
                                        <Bar dataKey="Produzido" name="Produzido (L)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                        <Bar dataKey="Envasado" name="Envasado (L)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <BarChart2 size={48} className="mb-2 opacity-20" />
                                    <p>Sem dados de produção para exibir neste mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">Data / Hora</th>
                            <th className="px-6 py-4 font-medium">Ação</th>
                            <th className="px-6 py-4 font-medium">Ref. / Receita</th>
                            <th className="px-6 py-4 font-medium">Volume Movimentado</th>
                            <th className="px-6 py-4 font-medium">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                                    <FileText size={48} className="mb-2 opacity-20" />
                                    <p>Nenhuma atividade registrada neste mês.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredHistory.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {item.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                            {getActionIcon(item.actionType)}
                                            {getActionLabel(item.actionType)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-industrial-900">{item.recipeName || '-'}</div>
                                        <div className="text-xs text-slate-400">ID: {item.tankId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold">
                                        {item.actionType === 'BREW' ? (
                                            <span className="text-green-600">+ {item.volumeChanged} L</span>
                                        ) : (
                                            <span className="text-slate-600">{item.volumeChanged} L</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {item.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
