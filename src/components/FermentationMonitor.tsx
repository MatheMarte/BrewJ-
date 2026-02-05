
import React, { useState } from 'react';
import { Batch, Recipe, Keg } from '../types';
import { Save, Database, Package, Trash2, CheckCircle, Plus, Settings2, X, Edit2, PlayCircle, AlertCircle, Clock, Tag, FlaskConical } from 'lucide-react';

interface FermentationMonitorProps {
    recipes: Recipe[];
    tanks: Batch[];
    kegs?: Keg[];
    onUpdateTank: (tank: Batch) => void;
    onAddTank: (tank: Batch) => void;
    onDeleteTank: (tankId: string) => void;
    onStartBatch: (tankId: string, recipeName: string, volume: number) => void;
    onPackageKeg: (tankId: string, kegId: string, volume: number) => void;
    onPackageBottles: (tankId: string, count: number, volPerBottle: number, labelName: string) => void;
    onFinalizeBatch: (tankId: string) => void;
}

export const FermentationMonitor: React.FC<FermentationMonitorProps> = ({ 
    recipes, 
    tanks, 
    kegs = [],
    onUpdateTank,
    onAddTank,
    onDeleteTank,
    onStartBatch,
    onPackageKeg,
    onPackageBottles,
    onFinalizeBatch
}) => {
  
  const [activeModal, setActiveModal] = useState<{tankId: string, type: 'KEG' | 'BOTTLE' | 'NEW_BREW' | 'QUALITY_CONTROL'} | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [formData, setFormData] = useState({ kegId: '', kegVol: 50, bottleCount: 0, bottleVol: 0.6, labelName: '' });
  const [newBrewData, setNewBrewData] = useState({ recipeName: '', volume: 0 });
  const [qcData, setQcData] = useState({ sensoryNotes: '', isApproved: false, labNotes: '', finalPh: 0, finalAbv: 0 });
  const [newTankData, setNewTankData] = useState({ id: '', volume: 2000 });

  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{tankId: string, capacity: number} | null>(null);

  const availableKegs = kegs.filter(k => k.status === 'Empty');

  const handleInputChange = (field: keyof Batch, value: any, tankId: string) => {
      const tank = tanks.find(t => t.id === tankId);
      if (tank) {
          onUpdateTank({ ...tank, [field]: value });
      }
  };

  const handleStatusChange = (newStatus: string, tank: Batch) => {
        const updates: Partial<Batch> = { status: newStatus as any };
        if (newStatus === 'Conditioning' && tank.status !== 'Conditioning') {
            updates.conditioningDate = new Date().toISOString();
        }
        onUpdateTank({ ...tank, ...updates });
    };

  const handleKegSelection = (kegId: string) => {
      const selectedKeg = availableKegs.find(k => k.id === kegId);
      setFormData({
          ...formData,
          kegId: kegId,
          kegVol: selectedKeg ? selectedKeg.capacity : 50
      });
  };

  const getDaysElapsed = (startDate?: string) => {
      if (!startDate || startDate === '-') return 0;
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return days === 0 ? 1 : days;
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Fermenting': return 'bg-green-500';
          case 'Conditioning': return 'bg-blue-500';
          case 'Packaging': return 'bg-amber-500';
          case 'Empty': return 'bg-slate-300';
          default: return 'bg-slate-500';
      }
  };

  const handleCreateTank = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTankData.id) return;
      const newTank: Batch = {
          id: `T-${Date.now()}`,
          tankId: newTankData.id,
          recipeName: '',
          brewDate: '-',
          status: 'Empty',
          targetGravity: 1.010,
          originalGravity: 1.050,
          currentGravity: 1.000,
          temperature: 20,
          ph: 5.2,
          volume: 0,
          capacity: newTankData.volume,
          ingredients: []
      };
      onAddTank(newTank);
      setNewTankData({ id: '', volume: 2000 });
  };

  const handleSaveEdit = (originalTank: Batch) => {
      if (!editValues) return;
      onUpdateTank({ ...originalTank, tankId: editValues.tankId, capacity: editValues.capacity });
      setEditingTankId(null);
  };

  const openNewBrewModal = (tankId: string) => {
      const tank = tanks.find(t => t.id === tankId);
      setNewBrewData({ recipeName: '', volume: tank ? tank.capacity * 0.8 : 1000 });
      setActiveModal({ tankId, type: 'NEW_BREW' });
  };

  const openQcModal = (tankId: string) => {
      const tank = tanks.find(t => t.id === tankId);
      if (tank) {
          setQcData({
              sensoryNotes: tank.qualityControl?.sensoryNotes || '',
              isApproved: tank.qualityControl?.isApproved || false,
              labNotes: tank.qualityControl?.labNotes || '',
              finalPh: tank.qualityControl?.finalPh || tank.ph || 0,
              finalAbv: tank.qualityControl?.finalAbv || 0
          });
          setActiveModal({ tankId, type: 'QUALITY_CONTROL' });
      }
  };

  const submitQc = () => {
      if (!activeModal) return;
      const tank = tanks.find(t => t.id === activeModal.tankId);
      if (tank) {
          onUpdateTank({
              ...tank,
              qualityControl: {
                  sensoryNotes: qcData.sensoryNotes,
                  isApproved: qcData.isApproved,
                  labNotes: qcData.labNotes,
                  finalPh: qcData.finalPh,
                  finalAbv: qcData.finalAbv
              }
          });
          setActiveModal(null);
      }
  };

  const submitNewBrew = () => {
      if (!activeModal || !newBrewData.recipeName) return alert("Selecione uma receita");
      if (newBrewData.volume <= 0) return alert("Volume inválido");
      onStartBatch(activeModal.tankId, newBrewData.recipeName, newBrewData.volume);
      setActiveModal(null);
  };

  const submitPackaging = () => {
      if (!activeModal) return;
      if (activeModal.type === 'KEG') {
          if(!formData.kegId) return alert("Selecione um barril");
          onPackageKeg(activeModal.tankId, formData.kegId, formData.kegVol);
      } else {
          if(!formData.labelName.trim()) return alert("Dê um NOME ao rótulo! Ex: 'Lote de Natal'");
          if(formData.bottleCount <= 0) return alert("Digite a quantidade de garrafas");
          onPackageBottles(activeModal.tankId, formData.bottleCount, formData.bottleVol, formData.labelName);
      }
      setActiveModal(null);
      setFormData({ kegId: '', kegVol: 50, bottleCount: 0, bottleVol: 0.6, labelName: '' });
  };

  return (
    <div className="space-y-8 relative">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-bold text-industrial-900">Produção & Envase</h2>
                <p className="text-slate-500">Monitore tanques e realize o envase para o estoque.</p>
             </div>
             <button onClick={() => setIsManageModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">
                 <Settings2 size={18} /> Gerenciar Tanques
             </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {tanks.map((tank) => {
                const isEmpty = tank.status === 'Empty';
                const percentFull = tank.capacity > 0 ? (tank.volume / tank.capacity) * 100 : 0;
                let dayLabel = '';
                let dayCount = 0;
                let statusColorClass = 'text-slate-500';

                if (tank.status === 'Fermenting') {
                    dayCount = getDaysElapsed(tank.brewDate);
                    dayLabel = 'Fermentando';
                    statusColorClass = 'text-green-600';
                } else if (tank.status === 'Conditioning') {
                    dayCount = getDaysElapsed(tank.conditioningDate || tank.brewDate); 
                    dayLabel = 'Maturando';
                    statusColorClass = 'text-blue-600';
                } else if (tank.status === 'Packaging') {
                    dayLabel = 'Pronto para Envase';
                    statusColorClass = 'text-amber-600';
                }

                return (
                <div key={tank.id} className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col group transition-all duration-300 ${isEmpty ? 'opacity-90 border-dashed border-2' : ''}`}>
                    <div className={`h-28 relative flex justify-center items-end border-b border-slate-200 ${isEmpty ? 'bg-slate-50' : 'bg-slate-100'}`}>
                        <div className="relative z-10 mb-[-24px]">
                            <div className="w-20 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl border-2 border-slate-300 shadow-inner flex flex-col items-center justify-center text-slate-400">
                                <Database size={32} className="opacity-50 mb-2" />
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(tank.status)} shadow-sm`}></div>
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 font-black text-4xl text-slate-200 select-none">{tank.tankId}</div>
                        <div className="absolute top-4 right-4 text-xs font-bold text-slate-400">Cap: {tank.capacity}L</div>
                        {!isEmpty && (
                            <div className="absolute bottom-0 left-0 h-full bg-brew-500 opacity-10 transition-all duration-1000" style={{ width: '100%', height: `${percentFull}%`, maxHeight: '100%', bottom: 0 }}></div>
                        )}
                    </div>

                    <div className="pt-10 p-6 flex-1 flex flex-col gap-5">
                        {isEmpty ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                                <p className="text-industrial-900 font-bold text-xl">FV Vazio</p>
                                <button onClick={() => openNewBrewModal(tank.id)} className="w-full py-4 bg-brew-600 text-white rounded-xl font-bold shadow-lg shadow-brew-200 hover:bg-brew-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                    <PlayCircle size={24} /> BRASSAR
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cerveja Atual</label>
                                    <select value={tank.recipeName} onChange={(e) => handleInputChange('recipeName', e.target.value, tank.id)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-industrial-900">
                                        <option value="">Selecione...</option>
                                        {recipes.map(r => (<option key={r.id} value={r.name}>{r.name}</option>))}
                                    </select>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={18} />
                                        <span className="text-xs font-bold uppercase">{dayLabel}</span>
                                    </div>
                                    <div className={`text-2xl font-bold ${statusColorClass}`}>{tank.status === 'Packaging' ? 'OK' : `Dia ${dayCount}`}</div>
                                </div>

                                <button 
                                    onClick={() => openQcModal(tank.id)}
                                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <FlaskConical size={16} className={tank.qualityControl?.isApproved ? "text-green-500" : "text-slate-400"} />
                                    {tank.qualityControl ? (tank.qualityControl.isApproved ? "Aprovado no CQ" : "Reprovado / Em Análise") : "Controle de Qualidade"}
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                         <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Status</label>
                                         <select value={tank.status} onChange={(e) => handleStatusChange(e.target.value, tank)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                                             <option value="Fermenting">Fermentação</option>
                                             <option value="Conditioning">Maturação</option>
                                             <option value="Packaging">Envase</option>
                                         </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Litros</label>
                                        <input type="number" value={tank.volume} onChange={(e) => handleInputChange('volume', Number(e.target.value), tank.id)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Densidade (SG)</label>
                                        <input type="number" step="0.001" value={tank.currentGravity} onChange={(e) => handleInputChange('currentGravity', Number(e.target.value), tank.id)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Temp (°C)</label>
                                        <input type="number" step="0.1" value={tank.temperature} onChange={(e) => handleInputChange('temperature', Number(e.target.value), tank.id)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center" />
                                    </div>
                                </div>
                                {tank.status === 'Packaging' ? (
                                    <div className="mt-2 space-y-2 border-t pt-4 border-slate-100">
                                        <p className="text-center text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Tanque pronto para retirar volume</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setActiveModal({ tankId: tank.id, type: 'KEG' })} className="py-2 px-3 bg-white border border-slate-200 text-industrial-900 rounded-lg hover:bg-slate-50 text-sm font-bold flex items-center justify-center gap-2">
                                                <Database size={16} /> Barril
                                            </button>
                                            <button onClick={() => setActiveModal({ tankId: tank.id, type: 'BOTTLE' })} className="py-2 px-3 bg-brew-600 text-white rounded-lg hover:bg-brew-700 text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform">
                                                <Package size={16} /> Garrafa
                                            </button>
                                        </div>
                                        <button onClick={() => onFinalizeBatch(tank.id)} className="w-full py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center justify-center gap-2">
                                            <Trash2 size={16} /> Finalizar Tanque
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-2 p-4 border border-dashed border-slate-200 rounded-lg text-center"><p className="text-xs text-slate-400 italic">Mude para "Envase" para retirar o volume.</p></div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                );
            })}
        </div>

        {activeModal && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-industrial-900 p-6 flex justify-between items-center text-white">
                        <h3 className="font-bold text-xl">
                            {activeModal.type === 'NEW_BREW' ? 'Nova Brassagem' : 
                             activeModal.type === 'KEG' ? 'Envasar em Barril' : 
                             activeModal.type === 'BOTTLE' ? 'Envasar Garrafas' : 
                             'Controle de Qualidade'}
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="text-slate-300 hover:text-white"><X size={24} /></button>
                    </div>

                    <div className="p-8 space-y-6">
                        {activeModal.type === 'QUALITY_CONTROL' && (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Aprovação Final</label>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setQcData({...qcData, isApproved: true})}
                                                className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${qcData.isApproved ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                            >
                                                <CheckCircle size={20} /> APROVADO
                                            </button>
                                            <button 
                                                onClick={() => setQcData({...qcData, isApproved: false})}
                                                className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${!qcData.isApproved ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                            >
                                                <X size={20} /> REPROVADO
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notas Sensoriais</label>
                                        <textarea 
                                            value={qcData.sensoryNotes}
                                            onChange={(e) => setQcData({...qcData, sensoryNotes: e.target.value})}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]"
                                            placeholder="Descreva aroma, sabor, aparência..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Análises de Laboratório (Opcional)</label>
                                        <textarea 
                                            value={qcData.labNotes}
                                            onChange={(e) => setQcData({...qcData, labNotes: e.target.value})}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[60px]"
                                            placeholder="Resultados de contagem de células, microbiológico..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">pH Final</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={qcData.finalPh}
                                                onChange={(e) => setQcData({...qcData, finalPh: Number(e.target.value)})}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">ABV (%)</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={qcData.finalAbv}
                                                onChange={(e) => setQcData({...qcData, finalAbv: Number(e.target.value)})}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={submitQc} className="w-full py-4 bg-industrial-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
                                    <Save size={20} /> Salvar Relatório QC
                                </button>
                            </>
                        )}

                        {activeModal.type === 'BOTTLE' && (
                            <>
                                <div className="bg-brew-100 p-6 rounded-2xl border-2 border-brew-400 ring-8 ring-brew-50 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-sm font-black text-brew-900 uppercase mb-3 flex items-center gap-2">
                                        <Tag size={18} className="text-brew-700" /> NOME DO RÓTULO ESCOLHIDO
                                    </label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        className="w-full p-4 border-2 border-brew-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-brew-500/30 font-black text-2xl text-industrial-900 bg-white shadow-inner"
                                        placeholder="EX: IPA NATAL, PILSER LOTE 1..."
                                        value={formData.labelName}
                                        onChange={e => setFormData({...formData, labelName: e.target.value.toUpperCase()})}
                                    />
                                    <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 rounded-lg border border-brew-200">
                                        <AlertCircle size={14} className="text-brew-600" />
                                        <p className="text-[10px] text-brew-700 font-bold uppercase leading-tight">Este nome irá para a seção "Estoque por Rótulo" no Dashboard.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Quantidade</label>
                                        <input type="number" className="w-full bg-transparent border-b-2 border-slate-300 focus:border-brew-500 outline-none font-black text-xl" value={formData.bottleCount} onChange={e => setFormData({...formData, bottleCount: Number(e.target.value)})} />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Garrafa (L)</label>
                                        <select className="w-full bg-transparent border-b-2 border-slate-300 focus:border-brew-500 outline-none font-black text-lg" value={formData.bottleVol} onChange={e => setFormData({...formData, bottleVol: Number(e.target.value)})}>
                                            <option value={0.3}>300ml</option>
                                            <option value={0.355}>355ml</option>
                                            <option value={0.5}>500ml</option>
                                            <option value={0.6}>600ml</option>
                                            <option value={1.0}>1 Litro</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={submitPackaging} className="w-full py-5 bg-industrial-900 text-white font-black text-xl rounded-2xl hover:bg-slate-800 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3">
                                    <Package size={24} /> FINALIZAR ENVASE
                                </button>
                            </>
                        )}
                        {/* Outros modais simplificados */}
                        {activeModal.type === 'KEG' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione o Barril Vazio</label>
                                    <select className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:border-brew-500 font-bold" value={formData.kegId} onChange={e => handleKegSelection(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {availableKegs.map(k => <option key={k.id} value={k.id}>{k.id} ({k.capacity}L)</option>)}
                                    </select>
                                </div>
                                <button onClick={submitPackaging} className="w-full py-4 bg-industrial-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg">Confirmar Retirada</button>
                            </>
                        )}
                        {activeModal.type === 'NEW_BREW' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Receita para este Tanque</label>
                                    <select className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:border-brew-500 font-bold" value={newBrewData.recipeName} onChange={e => setNewBrewData({...newBrewData, recipeName: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        {recipes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Volume da Brassagem (L)</label>
                                    <input type="number" className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:border-brew-500 font-bold" value={newBrewData.volume} onChange={e => setNewBrewData({...newBrewData, volume: Number(e.target.value)})} />
                                </div>
                                <button onClick={submitNewBrew} className="w-full py-4 bg-brew-600 text-white font-bold rounded-2xl hover:bg-brew-700 shadow-lg">Iniciar Tanque</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {isManageModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-industrial-900">Gerenciar Tanques</h3>
                    <div className="bg-slate-100 p-4 rounded-xl mb-6">
                        <h4 className="font-bold text-sm text-slate-600 mb-3 uppercase">Adicionar Novo Tanque</h4>
                        <div className="flex gap-4">
                            <div className="flex-1"><label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID (Nome)</label><input type="text" className="w-full p-2 border border-slate-300 rounded" placeholder="FV-01" value={newTankData.id} onChange={e => setNewTankData({...newTankData, id: e.target.value})} /></div>
                            <div className="flex-1"><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidade (L)</label><input type="number" className="w-full p-2 border border-slate-300 rounded" value={newTankData.volume} onChange={e => setNewTankData({...newTankData, volume: Number(e.target.value)})} /></div>
                        </div>
                        <button onClick={handleCreateTank} className="w-full mt-4 py-2 bg-industrial-900 text-white font-bold rounded hover:bg-slate-800 flex items-center justify-center gap-2"><Plus size={16}/> Adicionar Tanque</button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        <h4 className="font-bold text-sm text-slate-600 mb-2 uppercase sticky top-0 bg-white py-2">Tanques Existentes</h4>
                        {tanks.map(tank => (
                            <div key={tank.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                {editingTankId === tank.id && editValues ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input type="text" disabled value={editValues.tankId} className="w-20 p-1 bg-slate-100 border border-slate-300 rounded text-slate-500 cursor-not-allowed" />
                                        <input 
                                            type="number" 
                                            value={editValues.capacity} 
                                            onChange={(e) => setEditValues({...editValues, capacity: Number(e.target.value)})}
                                            className="w-24 p-1 border border-slate-300 rounded"
                                        />
                                        <button onClick={() => handleSaveEdit(tank)} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={18} /></button>
                                        <button onClick={() => setEditingTankId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={18} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <div className="font-bold text-industrial-900">{tank.tankId}</div>
                                            <div className="text-xs text-slate-500">{tank.capacity} Litros</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => { setEditingTankId(tank.id); setEditValues({ tankId: tank.tankId, capacity: tank.capacity }); }} 
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                title="Editar Capacidade"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('Tem certeza que deseja excluir este tanque?')) onDeleteTank(tank.id); }} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                title="Excluir Tanque"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setIsManageModalOpen(false)} className="w-full mt-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Fechar</button>
                </div>
            </div>
        )}
    </div>
  );
};
