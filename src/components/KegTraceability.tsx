import React, { useState } from 'react';
import { Keg } from '../types';
import { Cylinder, Plus, RotateCcw, Search, MapPin, CheckCircle, Edit, Trash2, Truck, Wine } from 'lucide-react';

interface KegManagementProps {
    kegs: Keg[];
    onUpdateKegs: (kegs: Keg[]) => void; 
    onReturnKeg: (kegId: string, remainingVolume?: number) => void;
    onCreateKeg: (keg: Keg) => void;
    onUpdateKegLocation: (kegId: string, location: string) => void;
    onBottleFromKeg: (kegId: string, bottleCount: number, bottleVolume: number, labelName: string) => void;
}

export const KegManagement: React.FC<KegManagementProps> = ({ kegs, onUpdateKegs, onReturnKeg, onCreateKeg, onUpdateKegLocation, onBottleFromKeg }) => {
  const [filter, setFilter] = useState<'ALL' | 'FULL' | 'EMPTY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // New Keg Form
  const [newKegId, setNewKegId] = useState('');
  const [newKegCapacity, setNewKegCapacity] = useState(50); // Default to 50L

  // Edit Keg Form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKeg, setEditingKeg] = useState<Keg | null>(null);
  const [editKegId, setEditKegId] = useState('');
  const [editKegCapacity, setEditKegCapacity] = useState(50);

  // Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchKegId, setDispatchKegId] = useState('');
  const [dispatchLocation, setDispatchLocation] = useState('');

  // Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnKegId, setReturnKegId] = useState('');
  const [returnVolume, setReturnVolume] = useState(0);

  // Bottling Modal
  const [isBottlingModalOpen, setIsBottlingModalOpen] = useState(false);
  const [bottlingKegId, setBottlingKegId] = useState('');
  const [bottleCount, setBottleCount] = useState(0);
  const [bottleVolume, setBottleVolume] = useState(0.6);
  const [bottleLabel, setBottleLabel] = useState('');

  const handleDeleteKeg = (kegId: string) => {
    if (confirm('Tem certeza que deseja excluir este barril?')) {
        const updatedKegs = kegs.filter(k => k.id !== kegId);
        onUpdateKegs(updatedKegs);
    }
  };

  const handleEditClick = (keg: Keg) => {
      setEditingKeg(keg);
      setEditKegId(keg.id);
      setEditKegCapacity(keg.capacity);
      setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingKeg || !editKegId) return;

      const updatedKegs = kegs.map(k => {
          if (k.id === editingKeg.id) {
              return { ...k, id: editKegId.toUpperCase(), capacity: editKegCapacity };
          }
          return k;
      });

      onUpdateKegs(updatedKegs);
      setIsEditModalOpen(false);
      setEditingKeg(null);
  };

  const handleDispatchClick = (keg: Keg) => {
      setDispatchKegId(keg.id);
      setDispatchLocation('');
      setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!dispatchKegId || !dispatchLocation) return;
      onUpdateKegLocation(dispatchKegId, dispatchLocation);
      setIsDispatchModalOpen(false);
      setDispatchKegId('');
      setDispatchLocation('');
  };

  const handleReturnClick = (kegId: string) => {
      setReturnKegId(kegId);
      setReturnVolume(0);
      setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!returnKegId) return;
      onReturnKeg(returnKegId, returnVolume);
      setIsReturnModalOpen(false);
      setReturnKegId('');
      setReturnVolume(0);
  };

  const handleBottleClick = (keg: Keg) => {
      setBottlingKegId(keg.id);
      setBottleLabel(keg.recipeName || '');
      setBottleCount(0);
      setBottleVolume(0.6); // Default 600ml
      setIsBottlingModalOpen(true);
  };

  const handleBottleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!bottlingKegId || bottleCount <= 0) return;
      onBottleFromKeg(bottlingKegId, bottleCount, bottleVolume, bottleLabel);
      setIsBottlingModalOpen(false);
      setBottlingKegId('');
      setBottleCount(0);
      setBottleLabel('');
  };

  const filteredKegs = kegs.filter(k => {
      const matchesSearch = k.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            k.recipeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            k.customer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isFull = k.volume > 0 && k.status !== 'Empty';
      
      if (filter === 'FULL') return matchesSearch && isFull;
      if (filter === 'EMPTY') return matchesSearch && !isFull;
      return matchesSearch;
  });

  const stats = {
      total: kegs.length,
      full: kegs.filter(k => k.volume > 0 && k.status !== 'Empty').length,
      empty: kegs.filter(k => k.volume === 0 || k.status === 'Empty').length,
      atClient: kegs.filter(k => k.status === 'Retail').length
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newKegId) return;
      onCreateKeg({
          id: newKegId.toUpperCase(),
          capacity: newKegCapacity, // Save fixed capacity
          batchId: '',
          recipeName: '',
          fillDate: '-',
          volume: 0,
          status: 'Empty',
          locationHistory: ['Cadastro Inicial'],
          customer: 'Fábrica'
      });
      setIsCreateModalOpen(false);
      setNewKegId('');
      setNewKegCapacity(50);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-industrial-900">Gestão de Barris</h2>
            <p className="text-slate-500">Controle de frota, localização e retorno de vazios.</p>
        </div>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-industrial-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold"
        >
            <Plus size={18} /> Novo Barril
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase">Total Frota</div>
              <div className="text-2xl font-bold text-industrial-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
              <div className="text-green-600 text-xs font-bold uppercase">Cheios</div>
              <div className="text-2xl font-bold text-green-800">{stats.full}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase">Disponíveis</div>
              <div className="text-2xl font-bold text-slate-700">{stats.empty}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
              <div className="text-blue-600 text-xs font-bold uppercase">Em Clientes</div>
              <div className="text-2xl font-bold text-blue-800">{stats.atClient}</div>
          </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${filter === 'ALL' ? 'bg-white shadow text-industrial-900' : 'text-slate-500'}`}>Todos</button>
                  <button onClick={() => setFilter('FULL')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${filter === 'FULL' ? 'bg-white shadow text-green-700' : 'text-slate-500'}`}>Cheios</button>
                  <button onClick={() => setFilter('EMPTY')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${filter === 'EMPTY' ? 'bg-white shadow text-slate-700' : 'text-slate-500'}`}>Vazios</button>
              </div>
              <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input type="text" placeholder="Buscar Barril..." className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-3">ID Barril</th>
                          <th className="px-6 py-3">Capacidade</th>
                          <th className="px-6 py-3">Conteúdo</th>
                          <th className="px-6 py-3">Volume Atual</th>
                          <th className="px-6 py-3">Localização</th>
                          <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredKegs.map(keg => {
                          const isFull = keg.volume > 0 && keg.status !== 'Empty';
                          const isAtFactory = !keg.customer || keg.customer === 'Fábrica' || keg.status === 'In-House';

                          return (
                              <tr key={keg.id} className="hover:bg-slate-50 transition">
                                  <td className="px-6 py-4 font-mono font-bold text-industrial-900 flex items-center gap-2">
                                      <Cylinder size={16} className="text-slate-400" />
                                      {keg.id}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 text-xs">
                                      {keg.capacity} Litros
                                  </td>
                                  <td className="px-6 py-4">
                                      {isFull ? <span className="font-bold text-brew-700">{keg.recipeName}</span> : <span className="text-slate-400 italic">Vazio</span>}
                                  </td>
                                  <td className="px-6 py-4 font-mono font-bold">
                                      {isFull ? `${keg.volume}L` : <span className="text-slate-300">0L</span>}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-1">
                                          <MapPin size={14} className={keg.status === 'Retail' ? 'text-blue-500' : 'text-slate-400'} />
                                          {keg.customer || 'Fábrica'}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          {isFull ? (
                                              <>
                                                {isAtFactory ? (
                                                  <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleDispatchClick(keg)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold flex items-center gap-2 transition shadow-md"
                                                        title="Destinar para cliente"
                                                    >
                                                        <Truck size={14} /> Destinar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBottleClick(keg)}
                                                        className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-bold flex items-center gap-2 transition shadow-md"
                                                        title="Engarrafar (Envase)"
                                                    >
                                                        <Wine size={14} /> Engarrafar
                                                    </button>
                                                  </div>
                                              ) : (
                                                    <button 
                                                        onClick={() => handleReturnClick(keg.id)}
                                                        className="px-3 py-1.5 bg-industrial-900 text-white rounded hover:bg-slate-800 text-xs font-bold flex items-center gap-2 transition shadow-md"
                                                        title="Receber de volta (Esvaziar ou Parcial)"
                                                    >
                                                        <RotateCcw size={14} /> Retorno
                                                    </button>
                                                )}
                                              </>
                                          ) : (
                                              <span className="flex items-center gap-1 text-green-600 text-xs font-bold px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                                                  <CheckCircle size={14} /> Disp.
                                              </span>
                                          )}
                                          
                                          <div className="flex items-center border-l border-slate-200 pl-2 ml-2 gap-1">
                                            <button 
                                                onClick={() => handleEditClick(keg)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                title="Editar Informações"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteKeg(keg.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                title="Excluir Barril"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
              {filteredKegs.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                      Nenhum barril encontrado com os filtros atuais.
                  </div>
              )}
          </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                  <h3 className="text-xl font-bold mb-4 text-industrial-900">Novo Barril</h3>
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ID / Código do Barril</label>
                          <input 
                              type="text" 
                              required
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500 uppercase font-mono"
                              placeholder="ex: K001"
                              value={newKegId}
                              onChange={e => setNewKegId(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade (Litros)</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                              value={newKegCapacity}
                              onChange={e => setNewKegCapacity(Number(e.target.value))}
                          >
                              <option value={10}>10 Litros</option>
                              <option value={20}>20 Litros</option>
                              <option value={30}>30 Litros</option>
                              <option value={50}>50 Litros</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-brew-600 text-white rounded hover:bg-brew-700 font-bold">Criar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                  <h3 className="text-xl font-bold mb-4 text-industrial-900">Editar Barril</h3>
                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ID / Código</label>
                          <input 
                              type="text" 
                              required
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500 uppercase font-mono"
                              value={editKegId}
                              onChange={e => setEditKegId(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade (Litros)</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                              value={editKegCapacity}
                              onChange={e => setEditKegCapacity(Number(e.target.value))}
                          >
                              <option value={10}>10 Litros</option>
                              <option value={20}>20 Litros</option>
                              <option value={30}>30 Litros</option>
                              <option value={50}>50 Litros</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-brew-600 text-white rounded hover:bg-brew-700 font-bold">Salvar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                  <h3 className="text-xl font-bold mb-4 text-industrial-900">Destinar Barril</h3>
                  <p className="text-sm text-slate-500 mb-4">Barril: {dispatchKegId}</p>
                  <form onSubmit={handleDispatchSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Local / Cliente de Destino</label>
                          <input 
                              type="text" 
                              required
                              placeholder="Ex: Bar do Zé, Evento X..."
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                              value={dispatchLocation}
                              onChange={e => setDispatchLocation(e.target.value)}
                              autoFocus
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Confirmar Saída</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Bottling Modal */}
      {isBottlingModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                  <h3 className="text-xl font-bold mb-4 text-industrial-900">Engarrafar do Barril</h3>
                  <p className="text-sm text-slate-500 mb-4">Barril de Origem: {bottlingKegId}</p>
                  <form onSubmit={handleBottleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rótulo / Receita</label>
                          <input 
                              type="text" 
                              required
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                              value={bottleLabel}
                              onChange={e => setBottleLabel(e.target.value)}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Garrafas</label>
                            <input 
                                type="number" 
                                min="1"
                                required
                                className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                                value={bottleCount}
                                onChange={e => setBottleCount(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vol. Garrafa (L)</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                                value={bottleVolume}
                                onChange={e => setBottleVolume(Number(e.target.value))}
                            >
                                <option value={0.3}>300ml</option>
                                <option value={0.33}>330ml (Long Neck)</option>
                                <option value={0.5}>500ml</option>
                                <option value={0.6}>600ml</option>
                                <option value={1.0}>1 Litro</option>
                            </select>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded text-sm text-purple-800">
                        Total a retirar: <strong>{(bottleCount * bottleVolume).toFixed(1)} Litros</strong>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsBottlingModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold">Confirmar Envase</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                  <h3 className="text-xl font-bold mb-4 text-industrial-900">Retorno de Barril</h3>
                  <p className="text-sm text-slate-500 mb-4">Barril: {returnKegId}</p>
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Volume Retornado (Sobra)</label>
                          <div className="flex items-center gap-2">
                              <input 
                                  type="number" 
                                  step="0.1"
                                  min="0"
                                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brew-500"
                                  value={returnVolume}
                                  onChange={e => setReturnVolume(Number(e.target.value))}
                              />
                              <span className="text-slate-500 font-bold">L</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Deixe 0 para retorno vazio (padrão).</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsReturnModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Confirmar Retorno</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
