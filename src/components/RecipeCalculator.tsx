import React, { useState } from 'react';
import { Calculator, Save, BookOpen, Trash2, CalendarClock, Edit2, RotateCcw, Plus, X, FlaskConical } from 'lucide-react';
import { Recipe, RawMaterial, MaterialType } from '../types';

interface RecipeCalculatorProps {
    recipes: Recipe[];
    materials: RawMaterial[];
    onAdd: (recipe: Recipe) => void;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: string) => void;
}

export const RecipeCalculator: React.FC<RecipeCalculatorProps> = ({ recipes, materials, onAdd, onEdit, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [current, setCurrent] = useState<{
        name: string;
        style: string;
        og: number;
        fg: number;
        ibu: number;
        shelfLife: number;
        baseVolume: number;
        ingredients: {
            materialId: string;
            name: string;
            type: MaterialType;
            quantity: number;
            unit: string;
        }[];
    }>({
        name: '',
        style: '',
        og: 1.050,
        fg: 1.010,
        ibu: 0,
        shelfLife: 90,
        baseVolume: 100,
        ingredients: []
    });

    // Temporary state for adding a new ingredient
    const [newIng, setNewIng] = useState({
        materialId: '',
        quantity: 0
    });

    const getMaterialTypeLabel = (type: string) => {
    switch (type) {
        case 'MALT': return 'Malte';
        case 'HOPS': return 'Lúpulo';
        case 'YEAST': return 'Levedura';
        case 'ADJUNCT': return 'Adjunto';
        default: return type;
    }
  };

  const calculateABV = (og: number, fg: number) => {
        return ((og - fg) * 131.25).toFixed(1);
    };

    const calculateCalories = (og: number, fg: number) => {
        const abv = (og - fg) * 131.25;
        const cals = ((6.9 * abv) + (4 * (og - fg) * 1000 * 0.25)) * 3.55; 
        return cals.toFixed(0);
    };

    const handleLoadForEdit = (recipe: Recipe) => {
        setEditingId(recipe.id);
        setCurrent({
            name: recipe.name,
            style: recipe.style,
            og: recipe.og,
            fg: recipe.fg,
            ibu: recipe.ibu,
            shelfLife: recipe.shelfLife,
            baseVolume: recipe.baseVolume || 100,
            ingredients: recipe.ingredients || []
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setCurrent({ name: '', style: '', og: 1.050, fg: 1.010, ibu: 0, shelfLife: 90, baseVolume: 100, ingredients: [] });
        setNewIng({ materialId: '', quantity: 0 });
    };

    const handleAddIngredient = () => {
        if (!newIng.materialId || newIng.quantity <= 0) return;
        const material = materials.find(m => m.id === newIng.materialId);
        if (!material) return;

        const newItem = {
            materialId: material.id,
            name: material.name,
            type: material.type,
            quantity: newIng.quantity,
            unit: material.unit
        };

        setCurrent(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, newItem]
        }));
        setNewIng({ materialId: '', quantity: 0 });
    };

    const handleRemoveIngredient = (index: number) => {
        setCurrent(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!current.name) return;
        
        const recipeData: Recipe = {
            id: editingId || Date.now().toString(),
            name: current.name,
            style: current.style,
            og: current.og,
            fg: current.fg,
            abv: calculateABV(current.og, current.fg),
            ibu: current.ibu,
            shelfLife: current.shelfLife,
            baseVolume: current.baseVolume,
            ingredients: current.ingredients
        };

        if (editingId) {
            onEdit(recipeData);
            alert("Receita atualizada com sucesso!");
        } else {
            onAdd(recipeData);
            alert("Receita criada com sucesso!");
        }
        
        handleCancelEdit();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-industrial-900">Calculadora de Receitas</h2>
                    <p className="text-slate-500">Planejamento de brassagem e definição de ingredientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calculator Form */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calculator size={20} className="text-brew-600" />
                            <h3 className="font-bold text-industrial-900">{editingId ? 'Editar Receita' : 'Nova Formulação'}</h3>
                        </div>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline">
                                <RotateCcw size={12} /> Cancelar Edição
                            </button>
                        )}
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Receita</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                    placeholder="Ex: Imperial Stout 2024"
                                    value={current.name}
                                    onChange={(e) => setCurrent({...current, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estilo</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                    placeholder="Ex: Stout"
                                    value={current.style}
                                    onChange={(e) => setCurrent({...current, style: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Validade do Barril (Dias)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none"
                                    value={current.shelfLife}
                                    onChange={(e) => setCurrent({...current, shelfLife: parseFloat(e.target.value) || 30})}
                                    placeholder="Ex: 90"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">OG (Densidade Inicial)</label>
                                <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none font-mono text-lg"
                                    value={current.og}
                                    onChange={(e) => setCurrent({...current, og: parseFloat(e.target.value) || 1.000})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">FG (Densidade Final)</label>
                                <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none font-mono text-lg"
                                    value={current.fg}
                                    onChange={(e) => setCurrent({...current, fg: parseFloat(e.target.value) || 1.000})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">IBU</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brew-500 outline-none font-mono text-lg"
                                    value={current.ibu}
                                    onChange={(e) => setCurrent({...current, ibu: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                        </div>

                        {/* Ingredients Section */}
                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="font-bold text-industrial-900 mb-4 flex items-center gap-2">
                                <FlaskConical size={20} className="text-brew-600" /> Ingredientes da Receita
                            </h4>
                            
                            <div className="flex gap-2 mb-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Insumo (Estoque)</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        value={newIng.materialId}
                                        onChange={(e) => setNewIng({...newIng, materialId: e.target.value})}
                                    >
                                        <option value="">Selecione...</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.type}) - Estoque: {m.quantity} {m.unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="Qtd"
                                        value={newIng.quantity}
                                        onChange={(e) => setNewIng({...newIng, quantity: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddIngredient}
                                    className="p-2 bg-brew-600 text-white rounded-lg hover:bg-brew-700 transition mb-[1px]"
                                    title="Adicionar Ingrediente"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                {current.ingredients.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 italic text-sm">Nenhum ingrediente adicionado.</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-600 font-bold">
                                            <tr>
                                                <th className="p-2 text-left">Insumo</th>
                                                <th className="p-2 text-left">Tipo</th>
                                                <th className="p-2 text-right">Qtd</th>
                                                <th className="p-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {current.ingredients.map((ing, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2">{ing.name}</td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            ing.type === 'HOPS' ? 'bg-green-100 text-green-700' :
                                                            ing.type === 'MALT' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {getMaterialTypeLabel(ing.type)}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-right font-mono">{ing.quantity} {ing.unit}</td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => handleRemoveIngredient(idx)} className="text-slate-400 hover:text-red-500">
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Live Results */}
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                            <div className="p-3 bg-brew-50 rounded-lg border border-brew-100 text-center">
                                <div className="text-xs uppercase font-bold text-brew-600 mb-1">ABV Estimado</div>
                                <div className="text-2xl font-bold text-brew-800">{calculateABV(current.og, current.fg)}%</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                <div className="text-xs uppercase font-bold text-blue-600 mb-1">Atenuação</div>
                                <div className="text-2xl font-bold text-blue-800">
                                    {(((current.og - current.fg) / (current.og - 1)) * 100).toFixed(0)}%
                                </div>
                            </div>
                             <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                                <div className="text-xs uppercase font-bold text-purple-600 mb-1">Calorias</div>
                                <div className="text-2xl font-bold text-purple-800">{calculateCalories(current.og, current.fg)}</div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSave}
                            className={`w-full py-3 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 ${editingId ? 'bg-brew-600 hover:bg-brew-700' : 'bg-industrial-900 hover:bg-industrial-800'}`}
                        >
                            <Save size={18} /> {editingId ? 'Atualizar Receita' : 'Salvar Receita'}
                        </button>
                    </div>
                </div>

                {/* Saved Recipes List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[800px]">
                    <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                        <BookOpen size={20} className="text-slate-500" />
                        <h3 className="font-bold text-industrial-900">Banco de Receitas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="p-3 border border-slate-200 rounded-lg hover:border-brew-400 transition group relative bg-slate-50">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800">{recipe.name}</h4>
                                    <span className="text-xs font-bold bg-brew-100 text-brew-800 px-2 py-0.5 rounded-full">{recipe.abv}% ABV</span>
                                </div>
                                <p className="text-sm text-slate-500 italic mb-2">{recipe.style}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-200 pt-2 mb-2">
                                    <div>OG: {recipe.og}</div>
                                    <div className="flex items-center gap-1"><CalendarClock size={12}/> {recipe.shelfLife} dias</div>
                                </div>
                                {recipe.ingredients && recipe.ingredients.length > 0 && (
                                    <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                        <span className="font-bold block mb-1">Ingredientes ({recipe.baseVolume || 100}L):</span>
                                        <div className="flex flex-wrap gap-1">
                                            {recipe.ingredients.map((ing, i) => (
                                                <span key={i} className="bg-white border border-slate-200 px-1 rounded text-[10px]">{ing.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button 
                                        onClick={() => handleLoadForEdit(recipe)}
                                        className="p-1 text-slate-300 hover:text-brew-600"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(recipe.id)}
                                        className="p-1 text-slate-300 hover:text-red-500"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
