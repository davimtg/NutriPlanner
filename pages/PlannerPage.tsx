import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { DailyPlan, Meal, MealType, PlannedItem, Ingredient, Recipe, NutrientInfo, CsvDietPlanItem } from '../types';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, CSV_DIET_PLAN_HEADERS } from '../constants';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconEdit, IconSave, IconFileText, IconUpload, IconTarget, IconDownload } from '../components/Icon';
import Papa from 'papaparse';

const NutrientBar: React.FC<{ value: number; max: number; color: string; label: string; unit: string }> = ({ value, max, color, label, unit }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span>{label}</span>
        <span>{value.toFixed(unit === 'mg' ? 0 : 1)} / {max.toFixed(unit === 'mg' ? 0 : 1)} {unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage > 100 ? 100 : percentage}%` }}></div>
      </div>
    </div>
  );
};


const PlannerPage: React.FC = () => {
  const { 
    ingredients, recipes, getDailyPlan, updateDailyPlan, addItemToMeal, removeItemFromMeal, updateItemInMeal, 
    getIngredientById, getRecipeById,
    globalTargetNutrients, updateGlobalTargetNutrients, // For global targets
    exportDietToCsv, importDietFromCsv, saveCurrentDietPlan // For diet management
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialDate = () => {
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
  };

  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedDayPlan, setSelectedDayPlan] = useState<DailyPlan | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentItem, setCurrentItem] = useState<Partial<PlannedItem>>({});
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for Save Diet Modal
  const [isSaveDietModalOpen, setIsSaveDietModalOpen] = useState(false);
  const [saveDietName, setSaveDietName] = useState('');
  const [saveDietDescription, setSaveDietDescription] = useState('');
  const [saveDietStartDate, setSaveDietStartDate] = useState('');
  const [saveDietEndDate, setSaveDietEndDate] = useState('');
  
  // State for Import Diet Modal/Feedback
  const [importCsvFile, setImportCsvFile] = useState<File | null>(null);
  const [importFeedback, setImportFeedback] = useState<{success: boolean; message: string} | null>(null);


  const formatDateISO = (date: Date): string => date.toISOString().split('T')[0];

  const setupWeek = useCallback((date: Date) => {
    const dayOfWeek = date.getDay(); 
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); 
    
    const week = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
    setWeekDates(week);
    setSelectedDayPlan(getDailyPlan(formatDateISO(date)) || createEmptyPlan(formatDateISO(date)));
    setSearchParams({ date: formatDateISO(date) }, { replace: true });
  }, [getDailyPlan, setSearchParams]);

  useEffect(() => {
    setupWeek(currentDate);
  }, [currentDate, setupWeek]);

  useEffect(() => { // Initialize save diet dates when weekDates are available
    if (weekDates.length === 7) {
      setSaveDietStartDate(formatDateISO(weekDates[0]));
      setSaveDietEndDate(formatDateISO(weekDates[6]));
    }
  }, [weekDates]);
  
  const createEmptyPlan = (dateStr: string): DailyPlan => ({
    date: dateStr,
    meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [], totalNutrients: {...DEFAULT_NUTRIENT_INFO} })),
    totalNutrients: {...DEFAULT_NUTRIENT_INFO}
  });

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + offset * 7);
    setCurrentDate(newDate);
  };

  const openModal = (mealType: MealType, item?: PlannedItem) => {
    setSelectedMealType(mealType);
    if (item) { setModalMode('edit'); setCurrentItem({ ...item }); } 
    else { setModalMode('add'); setCurrentItem({ type: 'ingredient', quantity: 1 }); }
    setIsModalOpen(true);
    setSearchTerm('');
  };

  const closeModal = () => { setIsModalOpen(false); setCurrentItem({}); setSelectedMealType(null); setSearchTerm(''); };

  const handleAddItem = () => {
    if (selectedDayPlan && selectedMealType && currentItem.itemId && currentItem.type && currentItem.quantity) {
      addItemToMeal(selectedDayPlan.date, selectedMealType, { type: currentItem.type, itemId: currentItem.itemId, quantity: currentItem.quantity, customName: currentItem.customName });
      setSelectedDayPlan(getDailyPlan(selectedDayPlan.date));
      closeModal();
    }
  };
  
  const handleEditItem = () => {
    if (selectedDayPlan && selectedMealType && currentItem.id && currentItem.itemId && currentItem.type && currentItem.quantity) {
        updateItemInMeal(selectedDayPlan.date, selectedMealType, { id: currentItem.id, type: currentItem.type, itemId: currentItem.itemId, quantity: currentItem.quantity, customName: currentItem.customName });
        setSelectedDayPlan(getDailyPlan(selectedDayPlan.date)); 
        closeModal();
    }
  };

  const handleRemoveItem = (mealType: MealType, itemId: string) => {
    if (selectedDayPlan) {
      removeItemFromMeal(selectedDayPlan.date, mealType, itemId);
      setSelectedDayPlan(getDailyPlan(selectedDayPlan.date)); 
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    const searchResults: ({ id: string; name: string; type: 'ingredient' | 'recipe'; details: Ingredient | Recipe })[] = [];
    ingredients.filter(ing => ing.name.toLowerCase().includes(lowerSearchTerm)).forEach(ing => searchResults.push({ id: ing.id, name: ing.name, type: 'ingredient', details: ing }));
    recipes.filter(rec => rec.name.toLowerCase().includes(lowerSearchTerm)).forEach(rec => searchResults.push({ id: rec.id, name: rec.name, type: 'recipe', details: rec }));
    return searchResults.slice(0, 10);
  }, [searchTerm, ingredients, recipes]);

  const handleTargetNutrientChange = (key: keyof NutrientInfo, value: string) => {
    updateGlobalTargetNutrients({ ...globalTargetNutrients, [key]: parseFloat(value) || 0 });
  };

  const handleSaveDiet = () => {
    if (!saveDietName.trim()) { alert("Por favor, dê um nome ao plano de dieta."); return; }
    if (!saveDietStartDate || !saveDietEndDate) { alert("Por favor, selecione um intervalo de datas para salvar."); return; }
    if (new Date(saveDietStartDate) > new Date(saveDietEndDate)) { alert("A data inicial não pode ser posterior à data final."); return; }
    
    saveCurrentDietPlan(saveDietName, saveDietDescription, saveDietStartDate, saveDietEndDate);
    setIsSaveDietModalOpen(false);
    setSaveDietName('');
    setSaveDietDescription('');
    // Optionally reset dates or keep them for next save attempt
  };

  const handleExportPDF = () => {
    // Basic print functionality. For better PDF, use a library or dedicated service.
    // Consider adding print-specific CSS (@media print) for layout.
    window.print();
  };

  const handleExportCSV = () => {
    if (weekDates.length < 7) { alert("Carregue uma semana válida primeiro."); return;}
    const csvString = exportDietToCsv(formatDateISO(weekDates[0]), formatDateISO(weekDates[6]));
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nutriplanner_dieta_${formatDateISO(weekDates[0])}_a_${formatDateISO(weekDates[6])}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImportCsvFile(event.target.files[0]);
      setImportFeedback(null);
    }
  };

  const handleImportDiet = () => {
    if (!importCsvFile) { alert("Por favor, selecione um arquivo CSV para importar."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse<CsvDietPlanItem>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: (field: string | number) => {
                if (typeof field === 'string') {
                    if (field === 'quantity' || field.endsWith('_kcal') || field.endsWith('_g') || field.endsWith('_mg')) {
                        return true; 
                    }
                }
                return false;
            },
            complete: (results) => {
                if (results.errors.length > 0) {
                    setImportFeedback({ success: false, message: "Erro ao parsear CSV: " + results.errors.map(err => `Linha ${err.row}: ${err.message}`).join('\n') });
                    return;
                }
                const validItems = results.data.filter(item => item.date && item.mealType && item.itemType && item.itemId && item.itemName && typeof item.quantity === 'number')
                const importResult = importDietFromCsv(validItems);
                setImportFeedback(importResult);
                if (importResult.success) {
                    setupWeek(new Date()); 
                }
                setImportCsvFile(null);
                const fileInput = document.getElementById('importDietCsvFile') as HTMLInputElement | null;
                if (fileInput) fileInput.value = '';
            },
            error: (error: any) => {
                setImportFeedback({ success: false, message: `Erro ao ler arquivo: ${error.message}`});
            }
        });
    };
    reader.readAsText(importCsvFile, 'UTF-8');
  };


  if (!selectedDayPlan) {
    return <div className="text-center p-8">Carregando planejador...</div>;
  }
  
  const dayTotalNutrients = selectedDayPlan.totalNutrients || DEFAULT_NUTRIENT_INFO;
  const nutrientLabels: { key: keyof NutrientInfo; label: string; unit: string; color: string }[] = [
    { key: 'Energia', label: 'Energia', unit: 'Kcal', color: 'bg-emerald-500' },
    { key: 'Proteína', label: 'Proteína', unit: 'g', color: 'bg-blue-500' },
    { key: 'Carboidrato', label: 'Carboidrato', unit: 'g', color: 'bg-orange-500' },
    { key: 'Lipídeos', label: 'Lipídeos', unit: 'g', color: 'bg-red-500' },
    { key: 'Colesterol', label: 'Colesterol', unit: 'mg', color: 'bg-indigo-500' },
    { key: 'FibraAlimentar', label: 'Fibra Alimentar', unit: 'g', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white shadow rounded-lg">
        <h1 className="text-3xl font-bold text-emerald-700">Planejador Semanal</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => changeWeek(-1)} variant="ghost" size="sm" aria-label="Semana anterior"><IconChevronLeft /></Button>
          <span className="text-lg font-medium text-gray-700 whitespace-nowrap">
            {weekDates.length > 0 && `${weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </span>
          <Button onClick={() => changeWeek(1)} variant="ghost" size="sm" aria-label="Próxima semana"><IconChevronRight /></Button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center"><IconTarget className="mr-2" />Metas Nutricionais Diárias Globais</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {nutrientLabels.map(({key, label, unit}) => (
            <div key={key}>
              <label htmlFor={`target-${key}`} className="block text-sm font-medium text-gray-700">{label} ({unit})</label>
              <input
                type="number" id={`target-${key}`} name={key}
                value={globalTargetNutrients[key]}
                onChange={(e) => handleTargetNutrientChange(key, e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          ))}
        </div>
         <p className="text-xs text-gray-500">Estas metas são aplicadas a todos os dias para cálculo do resumo nutricional.</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
         <h2 className="text-xl font-semibold text-gray-700">Gerenciamento do Plano</h2>
         <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsSaveDietModalOpen(true)} leftIcon={<IconSave />} variant="primary">Salvar Plano Atual</Button>
            <Button onClick={handleExportCSV} leftIcon={<IconDownload />} variant="ghost">Exportar Semana (CSV)</Button>
            <Button onClick={handleExportPDF} leftIcon={<IconFileText />} variant="ghost">Exportar Semana (PDF/Print)</Button>
         </div>
         <div className="mt-4 pt-4 border-t">
             <h3 className="text-lg font-medium text-gray-700 mb-2">Importar Plano de CSV</h3>
             <div className="flex items-end gap-2">
                 <div className="flex-grow">
                    <label htmlFor="importDietCsvFile" className="block text-sm font-medium text-gray-700">Arquivo CSV da Dieta</label>
                    <input type="file" id="importDietCsvFile" accept=".csv" onChange={handleImportFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                 </div>
                <Button onClick={handleImportDiet} disabled={!importCsvFile} leftIcon={<IconUpload />}>Importar</Button>
             </div>
            {importFeedback && (
                <div className={`mt-2 p-3 rounded-md text-sm ${importFeedback.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {importFeedback.message}
                </div>
            )}
         </div>
      </div>


      <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-white p-2 rounded-lg shadow">
        {weekDates.map(date => (
          <button key={date.toISOString()} onClick={() => handleDateChange(date)}
            className={`p-2 sm:p-3 rounded-md text-center transition-colors duration-150 ${formatDateISO(date) === formatDateISO(currentDate) ? 'bg-emerald-500 text-white font-semibold shadow-md' : 'bg-gray-100 hover:bg-emerald-100 text-gray-700'}`}>
            <span className="block text-xs sm:text-sm">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3)}</span>
            <span className="block text-lg sm:text-xl font-bold">{date.getDate()}</span>
          </button>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">
          {new Date(selectedDayPlan.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-700 mb-1">Resumo Nutricional do Dia (vs Metas Globais)</h3>
            {nutrientLabels.map(({key, label, unit, color}) => (
                 <NutrientBar key={key} label={label} value={dayTotalNutrients[key]} max={globalTargetNutrients[key]} color={color} unit={unit} />
            ))}
        </div>
        <div className="space-y-6">
          {selectedDayPlan.meals.map(meal => (
            <div key={meal.mealType} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-emerald-600">{meal.mealType}</h3>
                <Button onClick={() => openModal(meal.mealType)} size="sm" leftIcon={<IconPlus />}>Adicionar</Button>
              </div>
              {meal.items.length === 0 ? (<p className="text-sm text-gray-500 italic">Nenhum item adicionado.</p>) : (
                <ul className="space-y-2">
                  {meal.items.map(item => {
                    const details = item.type === 'ingredient' ? getIngredientById(item.itemId) : getRecipeById(item.itemId);
                    const name = item.customName || details?.name || 'Item desconhecido';
                    const quantityUnit = item.type === 'ingredient' ? `${item.quantity} ${(details as Ingredient)?.unit || ''}` : `${item.quantity} porç${item.quantity > 1 ? 'ões' : 'ão'}`;
                    let itemNutrients: NutrientInfo = DEFAULT_NUTRIENT_INFO;
                    if (item.type === 'ingredient' && details) { 
                        const ing = details as Ingredient; 
                        const divisor = (ing.unit === '100g' || ing.unit === '100ml' || ing.unit === 'g' || ing.unit === 'ml') ? 100 : 1; 
                        itemNutrients = { 
                            Energia: ((ing.Energia || 0) / divisor) * item.quantity, 
                            Proteína: ((ing.Proteína || 0) / divisor) * item.quantity, 
                            Carboidrato: ((ing.Carboidrato || 0) / divisor) * item.quantity, 
                            Lipídeos: ((ing.Lipídeos || 0) / divisor) * item.quantity, 
                            Colesterol: ((ing.Colesterol || 0) / divisor) * item.quantity, 
                            FibraAlimentar: ((ing.FibraAlimentar || 0) / divisor) * item.quantity, 
                        }; 
                    } 
                    else if (item.type === 'recipe' && details) { const rec = details as Recipe; if (rec.totalNutrients && rec.servings > 0) { itemNutrients = { Energia: (rec.totalNutrients.Energia / rec.servings) * item.quantity, Proteína: (rec.totalNutrients.Proteína / rec.servings) * item.quantity, Carboidrato: (rec.totalNutrients.Carboidrato / rec.servings) * item.quantity, Lipídeos: (rec.totalNutrients.Lipídeos / rec.servings) * item.quantity, Colesterol: (rec.totalNutrients.Colesterol / rec.servings) * item.quantity, FibraAlimentar: (rec.totalNutrients.FibraAlimentar / rec.servings) * item.quantity, }; } }
                    return (
                      <li key={item.id} className="flex justify-between items-start p-3 bg-white rounded shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-medium text-gray-800">{name} <span className="text-sm text-gray-600">({quantityUnit})</span></p>
                          <p className="text-xs text-gray-500">E: {itemNutrients.Energia.toFixed(0)}Kcal, P: {itemNutrients.Proteína.toFixed(1)}g, C: {itemNutrients.Carboidrato.toFixed(1)}g, L: {itemNutrients.Lipídeos.toFixed(1)}g, Col: {itemNutrients.Colesterol.toFixed(0)}mg, FA: {itemNutrients.FibraAlimentar.toFixed(1)}g</p>
                        </div>
                        <div className="flex space-x-2"><Button onClick={() => openModal(meal.mealType, item)} variant="ghost" size="sm" aria-label="Editar item"><IconEdit /></Button><Button onClick={() => handleRemoveItem(meal.mealType, item.id)} variant="danger" size="sm" aria-label="Remover item"><IconTrash /></Button></div>
                      </li>);
                  })}</ul>
              )}
              {meal.totalNutrients && (<div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs text-gray-600 text-right">Total Refeição: E: {meal.totalNutrients.Energia.toFixed(0)} Kcal, P: {meal.totalNutrients.Proteína.toFixed(1)}g, C: {meal.totalNutrients.Carboidrato.toFixed(1)}g, L: {meal.totalNutrients.Lipídeos.toFixed(1)}g, Col: {meal.totalNutrients.Colesterol.toFixed(0)}mg, FA: {meal.totalNutrients.FibraAlimentar.toFixed(1)}g</p></div>)}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalMode === 'add' ? 'Adicionar Item à Refeição' : 'Editar Item da Refeição'} size="lg">
        <div className="space-y-4">
          <div><label htmlFor="itemSearch" className="block text-sm font-medium text-gray-700">Buscar Ingrediente ou Receita</label><input type="text" id="itemSearch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Digite para buscar..." className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/></div>
          {searchTerm && filteredItems.length > 0 && (<div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">{filteredItems.map(resItem => (<button key={resItem.id} onClick={() => { setCurrentItem(prev => ({ ...prev, itemId: resItem.id, type: resItem.type, customName: resItem.name })); setSearchTerm('');}} className={`block w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors ${currentItem.itemId === resItem.id ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'}`}>{resItem.name} <span className="text-xs text-gray-500">({resItem.type === 'ingredient' ? 'Ingrediente' : 'Receita'})</span></button>))}</div>)}
           {currentItem.itemId && (<p className="text-sm text-emerald-700">Selecionado: {currentItem.customName || (currentItem.type === 'ingredient' ? getIngredientById(currentItem.itemId || '')?.name : getRecipeById(currentItem.itemId || '')?.name)}</p>)}
          <div><label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantidade ({currentItem.type === 'ingredient' ? (getIngredientById(currentItem.itemId || '') as Ingredient)?.unit || 'unidade' : 'porções'})</label><input type="number" id="quantity" value={currentItem.quantity || ''} onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} min="0.1" step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/></div>
          <div><label htmlFor="customName" className="block text-sm font-medium text-gray-700">Nome Personalizado (Opcional)</label><input type="text" id="customName" value={currentItem.customName || ''} onChange={(e) => setCurrentItem(prev => ({ ...prev, customName: e.target.value }))} placeholder="Ex: Maçã grande, Salada especial" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/></div>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><Button variant="ghost" onClick={closeModal}>Cancelar</Button><Button onClick={modalMode === 'add' ? handleAddItem : handleEditItem} disabled={!currentItem.itemId || !currentItem.quantity || currentItem.quantity <= 0}>{modalMode === 'add' ? 'Adicionar' : 'Salvar Alterações'}</Button></div>
      </Modal>

      <Modal isOpen={isSaveDietModalOpen} onClose={() => setIsSaveDietModalOpen(false)} title="Salvar Plano de Dieta Atual" size="md">
        <div className="space-y-4">
            <div><label htmlFor="saveDietName" className="block text-sm font-medium text-gray-700">Nome do Plano</label><input type="text" id="saveDietName" value={saveDietName} onChange={(e) => setSaveDietName(e.target.value)} placeholder="Ex: Dieta Hipercalórica Verão" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required/></div>
            <div><label htmlFor="saveDietDescription" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label><textarea id="saveDietDescription" value={saveDietDescription} onChange={(e) => setSaveDietDescription(e.target.value)} rows={2} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label htmlFor="saveDietStartDate" className="block text-sm font-medium text-gray-700">Data Inicial do Plano</label><input type="date" id="saveDietStartDate" value={saveDietStartDate} onChange={(e) => setSaveDietStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
                <div><label htmlFor="saveDietEndDate" className="block text-sm font-medium text-gray-700">Data Final do Plano</label><input type="date" id="saveDietEndDate" value={saveDietEndDate} onChange={(e) => setSaveDietEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
            </div>
            <p className="text-xs text-gray-500">O plano de refeições entre estas datas (inclusive) será salvo.</p>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><Button variant="ghost" onClick={() => setIsSaveDietModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveDiet}>Salvar Plano</Button></div>
      </Modal>
    </div>
  );
};

export default PlannerPage;