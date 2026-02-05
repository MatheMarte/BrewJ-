import React, { useState } from 'react';
import { MaterialType, RawMaterial } from '../types';
import { Search, PackagePlus, Edit, Trash2, Package } from 'lucide-react';

interface InventoryManagerProps {
    materials: RawMaterial[];
    onReceiveMaterial: (m: RawMaterial) => void;
    onUpdateMaterial: (m: RawMaterial) => void;
    onDeleteMaterial: (id: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ materials, onReceiveMaterial, onUpdateMaterial, onDeleteMaterial }) => {
  const [filter, setFilter] = useState<MaterialType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
      type: MaterialType.MALT,
      unit: 'kg'
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<RawMaterial>>({});

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
        case 'MALT': return 'Malte';
        case 'HOPS': return 'Lúpulo';
        case 'YEAST': return 'Levedura';
        case 'ADJUNCT': return 'Adjunto';
        default: return type;
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesType = filter === 'ALL' || m.type === filter;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.lotNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.quantity || !formData.lotNumber) return;

      const newMaterial: RawMaterial = {
          id: Date.now().toString(),
          name: formData.name,
          type: formData.type as MaterialType,
          quantity: Number(formData.quantity),
          unit: formData.unit || 'kg',
          lotNumber: formData.lotNumber,
          alphaAcid: formData.alphaAcid ? Number(formData.alphaAcid) : undefined,
          generation: formData.generation ? Number(formData.generation) : undefined
      };

      onReceiveMaterial(newMaterial);
      setIsModalOpen(false);
      setFormData({ type: MaterialType.MALT, unit: 'kg' });
  };

  const handleEditClick = (material: RawMaterial) => {
      setEditingMaterial(material);
      setEditFormData({ ...material });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingMaterial || !editFormData.name || !editFormData.quantity || !editFormData.lotNumber) return;

      const updatedMaterial: RawMaterial = {
          ...editingMaterial,
          name: editFormData.name,
          type: editFormData.type as MaterialType,
          quantity: Number(editFormData.quantity),
          unit: editFormData.unit || 'kg',
          lotNumber: editFormData.lotNumber,
          alphaAcid: editFormData.alphaAcid ? Number(editFormData.alphaAcid) : undefined,
          generation: editFormData.generation ? Number(editFormData.generation) : undefined
      };

      onUpdateMaterial(updatedMaterial);
      setIsEditModalOpen(false);
      setEditingMaterial(null);
  };

  const handleDeleteClick = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este item do estoque?')) {
          onDeleteMaterial(id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-industrial-900">Estoque de Insumos</h2>
          <p className="text-slate-500">Gestão de Matéria-Prima (Malte, Lúpulo, Levedura)</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-brew-600 text-white rounded-lg font-medium hover:bg-brew-700 transition flex items-center gap-2"
            >
                <PackagePlus size={18} />
                Receber Material
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por Nome ou Lote..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brew-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto">
                {['ALL', MaterialType.MALT, MaterialType.HOPS, MaterialType.YEAST, MaterialType.ADJUNCT].map(type => (
                    <button 
                        key={type}
                        onClick={() => setFilter(type as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                            filter === type 
                            ? 'bg-industrial-800 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {type === 'ALL' ? 'Todos' : getMaterialTypeLabel(type)}
                    </button>
                ))}
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-3">Item / Lote</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Quantidade</th>
                      <th className="px-6 py-3">Detalhes</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                              <div className="font-bold text-industrial-900">{item.name}</div>
                              <div className="text-xs text-slate-400 font-mono">Lote: {item.lotNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                  item.type === MaterialType.MALT ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  item.type === MaterialType.HOPS ? 'bg-green-50 text-green-700 border-green-100' :
                                  item.type === MaterialType.YEAST ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                  {getMaterialTypeLabel(item.type)}
                              </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium">
                              {item.quantity} <span className="text-slate-500 text-xs">{item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                              {item.alphaAcid && <div>AA: {item.alphaAcid}%</div>}
                              {item.generation && <div>Geração: {item.generation}</div>}
                              {!item.alphaAcid && !item.generation && '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                  <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition">
                                      <Edit size={16} />
                                  </button>
                                  <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {filteredMaterials.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Nenhum insumo encontrado.</p>
              </div>
          )}
        </div>
      </div>

      {/* Modal: Receber Material */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-industrial-900 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <PackagePlus size={20} /> Receber Material
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                          <Trash2 size={20} className="rotate-45" /> {/* Using Trash2 as Close icon for now, or just X if imported */}
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                              <select 
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.type}
                                  onChange={e => setFormData({...formData, type: e.target.value as MaterialType})}
                              >
                                  <option value={MaterialType.MALT}>Malte</option>
                                  <option value={MaterialType.HOPS}>Lúpulo</option>
                                  <option value={MaterialType.YEAST}>Levedura</option>
                                  <option value={MaterialType.ADJUNCT}>Adjunto</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                              <select 
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.unit}
                                  onChange={e => setFormData({...formData, unit: e.target.value})}
                              >
                                  <option value="kg">Quilograma (kg)</option>
                                  <option value="g">Grama (g)</option>
                                  <option value="L">Litro (L)</option>
                                  <option value="un">Unidade (un)</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                          <input 
                              type="text" 
                              required 
                              placeholder="Ex: Pilsen Agrária"
                              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                              value={formData.name || ''}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                              <input 
                                  type="number" 
                                  required 
                                  min="0"
                                  step="0.01"
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.quantity || ''}
                                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Lote</label>
                              <input 
                                  type="text" 
                                  required 
                                  placeholder="Lote do Fornecedor"
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.lotNumber || ''}
                                  onChange={e => setFormData({...formData, lotNumber: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Conditional Fields */}
                      {formData.type === MaterialType.HOPS && (
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Alpha Ácido (%)</label>
                              <input 
                                  type="number" 
                                  step="0.1"
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.alphaAcid || ''}
                                  onChange={e => setFormData({...formData, alphaAcid: Number(e.target.value)})}
                              />
                          </div>
                      )}
                      {formData.type === MaterialType.YEAST && (
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Geração</label>
                              <input 
                                  type="number" 
                                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                  value={formData.generation || ''}
                                  onChange={e => setFormData({...formData, generation: Number(e.target.value)})}
                              />
                          </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              className="px-6 py-2 bg-brew-600 text-white font-bold rounded-lg hover:bg-brew-700 shadow-lg shadow-brew-600/20 transition transform hover:-translate-y-0.5"
                          >
                              Adicionar ao Estoque
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="bg-industrial-900 px-6 py-4">
                      <h3 className="text-white font-bold text-lg">Editar Item</h3>
                  </div>
                  <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                          <input 
                              type="text" 
                              required 
                              className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                              value={editFormData.name || ''}
                              onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                              <input 
                                  type="number" 
                                  required 
                                  step="0.01"
                                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                  value={editFormData.quantity || ''}
                                  onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Lote</label>
                              <input 
                                  type="text" 
                                  required 
                                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                                  value={editFormData.lotNumber || ''}
                                  onChange={e => setEditFormData({...editFormData, lotNumber: e.target.value})}
                              />
                          </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-brew-600 text-white font-bold rounded-lg hover:bg-brew-700">Salvar Alterações</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
