import React, { useState } from 'react';
import { BottleStock } from '../types';
import { Search, Beer, ShoppingBag } from 'lucide-react';

interface BottleManagementProps {
    bottles: BottleStock[];
    onSellBottles: (recipeName: string, labelName: string | undefined, count: number) => void;
}

export const BottleManagement: React.FC<BottleManagementProps> = ({ bottles, onSellBottles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sale Modal State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleData, setSaleData] = useState<{recipeName: string, labelName?: string, currentStock: number, sellCount: number} | null>(null);

  const handleSellClick = (bottle: BottleStock) => {
      setSaleData({
          recipeName: bottle.recipeName,
          labelName: bottle.labelName,
          currentStock: bottle.count,
          sellCount: 1
      });
      setIsSaleModalOpen(true);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!saleData || saleData.sellCount <= 0) return;
      if (saleData.sellCount > saleData.currentStock) {
          alert("Quantidade insuficiente em estoque!");
          return;
      }
      
      onSellBottles(saleData.recipeName, saleData.labelName, saleData.sellCount);
      setIsSaleModalOpen(false);
      setSaleData(null);
  };

  const filteredBottles = bottles.filter(b => b.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) || (b.labelName && b.labelName.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-industrial-900">Gestão de Garrafas</h2>
            <p className="text-slate-500">Controle de estoque de garrafas e vendas.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Search className="text-slate-400" />
        <input 
            type="text" 
            placeholder="Buscar por receita ou rótulo..." 
            className="flex-1 outline-none text-industrial-900 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bottle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBottles.map((bottle, idx) => (
            <div key={`${bottle.recipeName}-${bottle.labelName}-${idx}`} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Beer size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-industrial-900">{bottle.labelName || bottle.recipeName}</h3>
                            <p className="text-xs text-slate-500">{bottle.recipeName}</p>
                        </div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                        {bottle.volumePerBottle}L
                    </span>
                </div>

                <div className="mt-2 p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Estoque Atual</p>
                        <p className="text-2xl font-bold text-industrial-900">{bottle.count} <span className="text-sm font-normal text-slate-500">unid.</span></p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-slate-500 uppercase tracking-wide">Volume Total</p>
                         <p className="font-medium text-industrial-900">{(bottle.count * bottle.volumePerBottle).toFixed(1)} L</p>
                    </div>
                </div>

                <button 
                    onClick={() => handleSellClick(bottle)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                    <ShoppingBag size={16} />
                    <span>Vender / Saída</span>
                </button>
            </div>
        ))}
        
        {filteredBottles.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                <Beer size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nenhuma garrafa encontrada no estoque.</p>
                <p className="text-sm mt-1">Finalize levas em garrafa na tela de Produção para adicionar itens aqui.</p>
            </div>
        )}
      </div>

      {/* Sale Modal */}
      {isSaleModalOpen && saleData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-industrial-900">Registrar Venda / Saída</h3>
                    <p className="text-slate-500 text-sm">Abater garrafas do estoque.</p>
                </div>
                
                <form onSubmit={handleSellSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500">Produto</p>
                        <p className="font-bold text-industrial-900">{saleData.labelName || saleData.recipeName}</p>
                        <div className="mt-2 flex justify-between text-sm">
                            <span className="text-slate-500">Em estoque:</span>
                            <span className="font-medium">{saleData.currentStock} unidades</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-industrial-900 mb-1">Quantidade a vender</label>
                        <input 
                            type="number" 
                            min="1" 
                            max={saleData.currentStock}
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-brew-500 focus:ring-1 focus:ring-brew-500"
                            value={saleData.sellCount}
                            onChange={(e) => setSaleData({...saleData, sellCount: parseInt(e.target.value) || 0})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsSaleModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Confirmar Saída
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
