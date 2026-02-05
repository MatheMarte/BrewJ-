import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FermentationMonitor } from './components/FermentationMonitor';
import { InventoryManager } from './components/InventoryManager';
import { KegManagement } from './components/KegTraceability';
import { BottleManagement } from './components/BottleManagement';
import { RecipeCalculator } from './components/RecipeCalculator';
import { ProductionReports } from './components/ProductionReports';
import { Recipe, Batch, Keg, BottleStock, RawMaterial, ProductionHistoryItem, ActionType } from './types';
// import { MOCK_RECIPES, MOCK_BATCHES, MOCK_KEGS, MOCK_MATERIALS } from './constants'; // Removido para iniciar limpo

const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    // Logica de recarregar mocks removida para permitir estado vazio
    return parsed;
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadState('brewja_recipes', []));
  const [tanks, setTanks] = useState<Batch[]>(() => loadState('brewja_tanks', []));
  const [history, setHistory] = useState<ProductionHistoryItem[]>(() => loadState('brewja_history', []));
  const [kegs, setKegs] = useState<Keg[]>(() => loadState('brewja_kegs', []));
  const [bottles, setBottles] = useState<BottleStock[]>(() => loadState('brewja_bottles', []));
  const [materials, setMaterials] = useState<RawMaterial[]>(() => loadState('brewja_materials', []));

  useEffect(() => { localStorage.setItem('brewja_recipes', JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem('brewja_tanks', JSON.stringify(tanks)); }, [tanks]);
  useEffect(() => { localStorage.setItem('brewja_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('brewja_kegs', JSON.stringify(kegs)); }, [kegs]);
  useEffect(() => { localStorage.setItem('brewja_bottles', JSON.stringify(bottles)); }, [bottles]);
  useEffect(() => { localStorage.setItem('brewja_materials', JSON.stringify(materials)); }, [materials]);

  const logHistory = (actionType: ActionType, entityId: string, recipeName: string, volumeChanged: number, details: string, batchData?: ProductionHistoryItem['batchData']) => {
      const newItem: ProductionHistoryItem = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('pt-BR'),
          actionType,
          tankId: entityId || 'N/A',
          recipeName: recipeName || 'N/A',
          volumeChanged: volumeChanged,
          details,
          batchData
      };
      setHistory(prev => [newItem, ...prev]);
  };

  const handleAddRecipe = (recipe: Recipe) => setRecipes([...recipes, recipe]);
  const handleEditRecipe = (updatedRecipe: Recipe) => setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  const handleDeleteRecipe = (id: string) => setRecipes(recipes.filter(r => r.id !== id));

  const handleAddTank = (newTank: Batch) => setTanks([...tanks, newTank]);
  const handleDeleteTank = (tankId: string) => setTanks(tanks.filter(t => t.id !== tankId));
  const handleUpdateTank = (updatedTank: Batch) => setTanks(tanks.map(t => t.tankId === updatedTank.tankId ? updatedTank : t));

  const handleStartBatch = (tankId: string, recipeName: string, brewVolume: number) => {
      const tank = tanks.find(t => t.id === tankId);
      if (!tank) return;
      if (brewVolume > tank.capacity) {
          alert(`Erro: O volume declarado (${brewVolume}L) excede a capacidade do tanque (${tank.capacity}L).`);
          return;
      }
      const recipe = recipes.find(r => r.name === recipeName);
      
      // Inventory Deduction Logic
      let batchIngredients: { materialId: string; amount: number; }[] = [];
      
      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          const scaleFactor = brewVolume / (recipe.baseVolume || 100);
          const updates: { id: string, newQuantity: number }[] = [];

          // First pass: Check availability
          for (const ing of recipe.ingredients) {
              const required = ing.quantity * scaleFactor;
              const stockItem = materials.find(m => m.id === ing.materialId);
              
              if (!stockItem) {
                  alert(`Erro: Ingrediente "${ing.name}" não encontrado no estoque.`);
                  return;
              }
              if (stockItem.quantity < required) {
                  alert(`Erro: Estoque insuficiente de "${stockItem.name}". Necessário: ${required.toFixed(2)}${stockItem.unit}, Disponível: ${stockItem.quantity}${stockItem.unit}`);
                  return;
              }
              updates.push({ id: stockItem.id, newQuantity: stockItem.quantity - required });
              batchIngredients.push({ materialId: ing.materialId, amount: required });
          }

          // Second pass: Apply updates
          setMaterials(prev => prev.map(m => {
              const update = updates.find(u => u.id === m.id);
              return update ? { ...m, quantity: update.newQuantity } : m;
          }));
      }

      const newBatch: Batch = {
          ...tank,
          id: `BATCH-${Date.now()}`,
          status: 'Fermenting',
          recipeName: recipeName,
          volume: brewVolume, 
          capacity: tank.capacity, 
          brewDate: new Date().toISOString(),
          originalGravity: recipe ? recipe.og : 1.050,
          targetGravity: recipe ? recipe.fg : 1.010,
          currentGravity: recipe ? recipe.og : 1.050,
          temperature: 20,
          ingredients: batchIngredients
      };
      handleUpdateTank(newBatch);
      logHistory('BREW', newBatch.tankId, newBatch.recipeName, brewVolume, `Nova Brassagem (OG: ${newBatch.originalGravity})`);
      if (batchIngredients.length > 0) {
          alert(`Brassagem iniciada! Estoque atualizado automaticamente.`);
      }
  };

  const handlePackageKeg = (tankId: string, kegId: string, volume: number) => {
      const tank = tanks.find(t => t.id === tankId);
      if (!tank) return;
      if (tank.volume < volume) {
          alert("Erro: Volume insuficiente no tanque!");
          return;
      }
      const existingKeg = kegs.find(k => k.id === kegId);
      if (existingKeg && existingKeg.status !== 'Empty') {
          alert("Erro: Este barril já está cheio ou em uso.");
          return;
      }
      const updatedTank = { ...tank, volume: tank.volume - volume };
      handleUpdateTank(updatedTank);
      setKegs(prevKegs => prevKegs.map(k => {
          if (k.id === kegId) {
              return {
                  ...k,
                  batchId: tank.id,
                  recipeName: tank.recipeName,
                  fillDate: new Date().toISOString().split('T')[0],
                  volume: volume,
                  status: 'In-House',
                  customer: 'Fábrica (Estoque)',
                  locationHistory: [...(k.locationHistory || []), 'Envasado na Fábrica']
              };
          }
          return k;
      }));
      logHistory('KEG', tank.tankId, tank.recipeName, volume, `Barril: ${kegId}`);
      alert(`Barril ${kegId} envasado com sucesso! Restam ${updatedTank.volume}L no tanque.`);
  };

  const handlePackageBottles = (tankId: string, count: number, volPerBottle: number, labelName: string) => {
      const tank = tanks.find(t => t.id === tankId);
      if (!tank) return;
      const totalVol = count * volPerBottle;
      if (tank.volume < totalVol) {
          alert("Erro: Volume insuficiente no tanque!");
          return;
      }
      const updatedTank = { ...tank, volume: tank.volume - totalVol };
      handleUpdateTank(updatedTank);
      
      setBottles(prev => {
          // Busca exata: Mesma receita, mesmo nome de rótulo E mesmo tamanho de garrafa
          const existingIdx = prev.findIndex(b => 
              b.recipeName === tank.recipeName && 
              b.labelName === labelName && 
              b.volumePerBottle === volPerBottle
          );

          if (existingIdx !== -1) {
              const newBottles = [...prev];
              newBottles[existingIdx] = { ...newBottles[existingIdx], count: newBottles[existingIdx].count + count };
              return newBottles;
          } else {
              return [...prev, { recipeName: tank.recipeName, labelName, count, volumePerBottle: volPerBottle }];
          }
      });


      logHistory('BOTTLE', tank.tankId, tank.recipeName, totalVol, `${count} garrafas (${volPerBottle}L) - Rótulo: ${labelName}`);
      alert(`${count} garrafas envasadas com o rótulo "${labelName}"! Restam ${updatedTank.volume}L no tanque.`);
  };

  const handleFinalizeBatch = (tankId: string) => {
      const tank = tanks.find(t => t.id === tankId);
      if (!tank) return;

      if (!confirm("Tem certeza que deseja finalizar esta leva? O tanque será marcado como vazio.")) return;

      // Capture snapshot data for history
      const recipeSnapshot = recipes.find(r => r.name === tank.recipeName);
      
      const batchDataSnapshot = {
          startDate: tank.brewDate,
          endDate: new Date().toISOString(),
          tankId: tank.tankId,
          recipeSnapshot: {
              name: tank.recipeName,
              style: recipeSnapshot?.style || 'N/A',
              ingredients: tank.ingredients.map(ing => {
                  const material = materials.find(m => m.id === ing.materialId);
                  return {
                      name: material?.name || 'Desconhecido',
                      quantity: ing.amount,
                      unit: material?.unit || '',
                      type: material?.type || 'N/A'
                  };
              })
          },
          qualityControl: tank.qualityControl
      };

      logHistory('FINISH', tankId, tank.recipeName, tank.volume, `Leva finalizada no tanque ${tankId}`, batchDataSnapshot);

      const updatedTanks = tanks.map(t => t.id === tankId ? { 
          ...t, 
          status: 'Empty' as const, 
          volume: 0, 
          recipeName: '', 
          brewDate: '-',
          conditioningDate: undefined,
          ingredients: [],
          qualityControl: undefined // Clear QC data
      } : t);

      // Replaced by above map logic but kept structure
      const finalTanks = updatedTanks.map(t => {
          if (t.id === tankId) {
             return {
                 ...t,
                 currentGravity: 1.000,
                 originalGravity: 1.050,
                 targetGravity: 1.010,
                 temperature: 20,
                 ph: 7.0
             };
          }
          return t;
      });
      
      setTanks(finalTanks);
      alert("Tanque finalizado e zerado! Pronto para nova produção.");
  };

  const handleReturnKeg = (kegId: string, remainingVolume: number = 0) => {
      const targetKeg = kegs.find(k => k.id === kegId);
      if (!targetKeg) return;
      const previousLocation = targetKeg.customer || 'Desconhecido';
      
      setKegs(prevKegs => prevKegs.map(k => {
          if (k.id === kegId) {
              if (remainingVolume > 0) {
                  // Retorno parcial (sobra)
                  return {
                      ...k,
                      status: 'In-House', // Volta para a fábrica, mas cheio/parcial
                      volume: remainingVolume,
                      customer: 'Fábrica',
                      locationHistory: [...(k.locationHistory || []), `Retorno Parcial (${remainingVolume}L): ${previousLocation} -> Fábrica`]
                      // Mantém recipeName, batchId, fillDate, etc.
                  };
              } else {
                  // Retorno vazio (padrão)
                  return {
                      ...k,
                      status: 'Empty',
                      volume: 0,
                      recipeName: '',
                      batchId: '',
                      fillDate: '-',
                      dispatchDate: undefined,
                      customer: 'Fábrica',
                      locationHistory: [...(k.locationHistory || []), `Retorno Vazio: ${previousLocation} -> Fábrica`]
                  };
              }
          }
          return k;
      }));
      
      if (remainingVolume > 0) {
          logHistory('RETURN', kegId, targetKeg.recipeName, targetKeg.volume - remainingVolume, `Barril ${kegId} retornou com ${remainingVolume}L de sobra de ${previousLocation}`);
          alert(`Barril ${kegId} recebido com ${remainingVolume}L de sobra!`);
      } else {
          logHistory('RETURN', kegId, targetKeg.recipeName, targetKeg.volume, `Barril ${kegId} voltou vazio de ${previousLocation}`);
          alert(`Barril ${kegId} recebido e esvaziado!`);
      }
  };

  const handleCreateKeg = (newKeg: Keg) => {
      if (kegs.some(k => k.id === newKeg.id)) {
          alert("Erro: ID de barril já existe.");
          return;
      }
      setKegs([...kegs, newKeg]);
  };

  const handleReceiveMaterial = (newMaterial: RawMaterial) => setMaterials([...materials, newMaterial]);
  const handleUpdateMaterial = (updatedMaterial: RawMaterial) => setMaterials(materials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  const handleDeleteMaterial = (materialId: string) => setMaterials(materials.filter(m => m.id !== materialId));

  const handleUpdateKegLocation = (kegId: string, location: string) => {
      const keg = kegs.find(k => k.id === kegId);
      setKegs(kegs.map(k => {
          if (k.id === kegId) {
              const isMovingOut = !location.toLowerCase().includes('fábrica') && !location.toLowerCase().includes('estoque');
              const newStatus = isMovingOut ? 'Retail' : 'In-House';
              const dispatchDate = (isMovingOut && !k.dispatchDate) ? new Date().toISOString().split('T')[0] : k.dispatchDate;
              return { ...k, customer: location, status: newStatus as any, dispatchDate: dispatchDate, locationHistory: [...(k.locationHistory || []), location] };
          }
          return k;
      }));
      logHistory('DISPATCH', kegId, keg ? keg.recipeName : 'N/A', keg ? keg.volume : 0, `Barril ${kegId} movido para ${location}`);
  };

  const handleSellBottles = (recipeName: string, labelName: string | undefined, count: number) => {
      const bottleIndex = bottles.findIndex(b => b.recipeName === recipeName && b.labelName === labelName);
      
      if (bottleIndex === -1) {
          alert("Erro: Item não encontrado no estoque.");
          return;
      }

      const bottle = bottles[bottleIndex];
      if (count > bottle.count) {
          alert("Erro: Quantidade insuficiente.");
          return;
      }

      let updatedBottles = [...bottles];
      const newCount = bottle.count - count;
      
      if (newCount === 0) {
          updatedBottles = updatedBottles.filter((_, idx) => idx !== bottleIndex);
      } else {
          updatedBottles[bottleIndex] = { ...bottle, count: newCount };
      }

      setBottles(updatedBottles);
      logHistory('SALE', 'Bottle', recipeName, -(count * bottle.volumePerBottle), `Venda de ${count} garrafas de ${labelName || recipeName}`);
      alert("Venda registrada com sucesso!");
  };

  const handleBottleFromKeg = (kegId: string, bottleCount: number, bottleVolume: number, labelName: string) => {
      const keg = kegs.find(k => k.id === kegId);
      if (!keg) return;

      const totalNeeded = bottleCount * bottleVolume;
      
      if (keg.volume < totalNeeded) {
          alert(`Erro: Volume insuficiente no barril. Necessário: ${totalNeeded}L, Disponível: ${keg.volume}L`);
          return;
      }

      // 1. Update Keg
      const updatedVolume = keg.volume - totalNeeded;
      const isKegEmpty = updatedVolume <= 0.1; // Margin of error, consider empty if very low

      setKegs(prevKegs => prevKegs.map(k => {
          if (k.id === kegId) {
              return {
                  ...k,
                  volume: isKegEmpty ? 0 : updatedVolume,
                  status: isKegEmpty ? 'Empty' : k.status,
                  // If empty, clear data? Usually yes, but maybe keep trace until returned?
                  // Following current pattern: if empty, it's Empty.
                  recipeName: isKegEmpty ? '' : k.recipeName,
                  batchId: isKegEmpty ? '' : k.batchId,
                  fillDate: isKegEmpty ? '-' : k.fillDate,
                  customer: isKegEmpty ? 'Fábrica' : k.customer
              };
          }
          return k;
      }));

      // 2. Add Bottles to Stock
      setBottles(prev => {
          const existingIdx = prev.findIndex(b => 
              b.recipeName === keg.recipeName && 
              b.labelName === labelName && 
              b.volumePerBottle === bottleVolume
          );

          if (existingIdx !== -1) {
              const newBottles = [...prev];
              newBottles[existingIdx] = { ...newBottles[existingIdx], count: newBottles[existingIdx].count + bottleCount };
              return newBottles;
          } else {
              return [...prev, { recipeName: keg.recipeName, labelName, count: bottleCount, volumePerBottle: bottleVolume }];
          }
      });

      logHistory('BOTTLE', kegId, keg.recipeName, totalNeeded, `Envase de ${bottleCount} garrafas (${bottleVolume}L) via Barril ${kegId}`);
      alert(`Sucesso! ${bottleCount} garrafas envasadas. ${isKegEmpty ? 'O barril esvaziou.' : `Restam ${updatedVolume.toFixed(1)}L no barril.`}`);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard tanks={tanks} kegs={kegs} bottles={bottles} recipes={recipes} onUpdateKegLocation={handleUpdateKegLocation} />;
      case 'production': return <FermentationMonitor recipes={recipes} tanks={tanks} kegs={kegs} onUpdateTank={handleUpdateTank} onAddTank={handleAddTank} onDeleteTank={handleDeleteTank} onStartBatch={handleStartBatch} onPackageKeg={handlePackageKeg} onPackageBottles={handlePackageBottles} onFinalizeBatch={handleFinalizeBatch} />;
      case 'reports': return <ProductionReports history={history} recipes={recipes} />;
      case 'recipes': return <RecipeCalculator recipes={recipes} materials={materials} onAdd={handleAddRecipe} onEdit={handleEditRecipe} onDelete={handleDeleteRecipe} />;
      case 'inventory': return <InventoryManager materials={materials} onReceiveMaterial={handleReceiveMaterial} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} />;
      case 'kegs': return <KegManagement kegs={kegs} onUpdateKegs={setKegs} onReturnKeg={handleReturnKeg} onCreateKeg={handleCreateKeg} onUpdateKegLocation={handleUpdateKegLocation} onBottleFromKeg={handleBottleFromKeg} />;
      case 'bottles': return <BottleManagement bottles={bottles} onSellBottles={handleSellBottles} />;
      default: return <Dashboard tanks={tanks} kegs={kegs} bottles={bottles} recipes={recipes} onUpdateKegLocation={handleUpdateKegLocation} />;
    }
  };

  return <Layout activeView={activeView} setActiveView={setActiveView}>{renderView()}</Layout>;
};

export default App;