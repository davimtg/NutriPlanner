import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { DailyPlan, Meal, MealType, PlannedItem, Ingredient, Recipe, NutrientInfo } from '../types';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO } from '../constants';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconEdit, IconSettings, IconTarget } from '../components/Icon';

const NutrientBar: React.FC<{ value: number; max: number; color: string; label: string; unit: string }> = ({ value, max, color, label, unit }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const displayValue = value.toFixed(unit === 'mg' || unit === 'Kcal' ? 0 : 1);
  const displayMax = max.toFixed(unit === 'mg' || unit === 'Kcal' ? 0 : 1);
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5 text-slate-600">
        <span>{label}</span>
        <span>{displayValue} / {displayMax} {unit}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
        <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${Math.min(100, percentage)}%` }}></div>
      </div>
    </div>
  );
};


const PlannerPage: React.FC = () => {
  const { 
    ingredients, recipes, getDailyPlan, addItemToMeal, removeItemFromMeal, updateItemInMeal, 
    getIngredientById, getRecipeById,
    globalTargetNutrients 
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
  const [searchType, setSearchType] = useState<'ingredient' | 'recipe'>('ingredient');


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
    if (item) { 
      setModalMode('edit'); 
      setCurrentItem({ ...item });
      setSearchType(item.type);
    } 
    else { 
      setModalMode('add'); 
      setCurrentItem({ type: 'ingredient', quantity: 1 });
      setSearchType('ingredient');
    }
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

  const itemsForDropdown = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const list = searchType === 'ingredient' ? ingredients : recipes;
    return list.filter(item => item.name.toLowerCase().includes(lowerSearchTerm)).sort((a,b) => a.name.localeCompare(b.name));
  }, [searchTerm, searchType, ingredients, recipes]);


  if (!selectedDayPlan) {
    return <div className="text-center p-8 text-slate-600">Carregando planejador...</div>;
  }
  
  const dayTotalNutrients = selectedDayPlan.totalNutrients || DEFAULT_NUTRIENT_INFO;
  const nutrientLabelsForBars: { key: keyof NutrientInfo; label: string; unit: string; color: string }[] = [
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
          <span className="text-lg font-medium text-slate-700 whitespace-nowrap">
            {weekDates.length > 0 && `${weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </span>
          <Button onClick={() => changeWeek(1)} variant="ghost" size="sm" aria-label="Próxima semana"><IconChevronRight /></Button>
        </div>
      </header>

      <div className="bg-emerald-500 text-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-semibold flex items-center"><IconSettings className="mr-2" />Ajustes e Ferramentas do Plano</h2>
                <p className="text-sm opacity-90 mt-1">Defina suas metas nutricionais globais, salve, exporte ou importe planos de dieta completos.</p>
            </div>
            <Link to="/plan-settings">
                <Button variant="primary" className="bg-white text-emerald-600 hover:bg-emerald-50 shadow hover:shadow-md">
                    Acessar Configurações
                </Button>
            </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-white p-2 rounded-lg shadow">
        {weekDates.map(date => (
          <button key={date.toISOString()} onClick={() => handleDateChange(date)}
            className={`p-2 sm:p-3 rounded-md text-center transition-colors duration-150 ${formatDateISO(date) === formatDateISO(currentDate) ? 'bg-emerald-600 text-white font-semibold shadow-md scale-105' : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'}`}>
            <span className="block text-xs sm:text-sm">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3)}</span>
            <span className="block text-lg sm:text-xl font-bold">{date.getDate()}</span>
          </button>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-800 mb-1">
          {new Date(selectedDayPlan.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-md font-semibold text-emerald-700 mb-2 flex items-center"><IconTarget className="mr-2 w-5 h-5"/>Resumo Nutricional (vs Metas Globais)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {nutrientLabelsForBars.map(({key, label, unit, color}) => (
                   <NutrientBar key={key} label={label} value={dayTotalNutrients[key]} max={globalTargetNutrients[key]} color={color} unit={unit} />
              ))}
            </div>
             <p className="text-xs text-slate-500 mt-2">Visão gráfica detalhada dos macronutrientes no Dashboard.</p>
        </div>
        <div className="space-y-6">
          {selectedDayPlan.meals.map(meal => (
            <div key={meal.mealType} id={`meal-${encodeURIComponent(meal.mealType)}`} className="p-5 border border-slate-200 rounded-lg bg-white shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-emerald-600">{meal.mealType}</h3>
                <Button onClick={() => openModal(meal.mealType)} size="sm" leftIcon={<IconPlus />}>Adicionar</Button>
              </div>
              {meal.items.length === 0 ? (<p className="text-sm text-slate-500 italic">Nenhum item adicionado.</p>) : (
                <ul className="space-y-2.5">
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
                      <li key={item.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-md shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-medium text-slate-800">{name} <span className="text-sm text-slate-600">({quantityUnit})</span></p>
                          <p className="text-xs text-slate-500">E: {itemNutrients.Energia.toFixed(0)}Kcal, P: {itemNutrients.Proteína.toFixed(1)}g, C: {itemNutrients.Carboidrato.toFixed(1)}g, L: {itemNutrients.Lipídeos.toFixed(1)}g</p>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0 ml-2"><Button onClick={() => openModal(meal.mealType, item)} variant="ghost" size="sm" aria-label="Editar item"><IconEdit /></Button><Button onClick={() => handleRemoveItem(meal.mealType, item.id)} variant="danger" size="sm" aria-label="Remover item"><IconTrash /></Button></div>
                      </li>);
                  })}</ul>
              )}
              {meal.totalNutrients && meal.items.length > 0 && (<div className="mt-3 pt-3 border-t border-slate-100"><p className="text-xs text-slate-600 text-right font-medium">Total Refeição: E: {meal.totalNutrients.Energia.toFixed(0)} Kcal, P: {meal.totalNutrients.Proteína.toFixed(1)}g, C: {meal.totalNutrients.Carboidrato.toFixed(1)}g, L: {meal.totalNutrients.Lipídeos.toFixed(1)}g</p></div>)}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalMode === 'add' ? 'Adicionar Item à Refeição' : 'Editar Item da Refeição'} size="lg">
        <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 bg-slate-100 p-1 rounded-lg">
                <Button
                    variant={searchType === 'ingredient' ? 'primary' : 'ghost'}
                    className={searchType === 'ingredient' ? 'flex-1 shadow-sm' : 'flex-1 bg-white'}
                    onClick={() => { setSearchType('ingredient'); setCurrentItem(prev => ({...prev, itemId: undefined, type: 'ingredient'})); }}
                >
                    Ingrediente
                </Button>
                <Button
                    variant={searchType === 'recipe' ? 'primary' : 'ghost'}
                    className={searchType === 'recipe' ? 'flex-1 shadow-sm' : 'flex-1 bg-white'}
                    onClick={() => { setSearchType('recipe'); setCurrentItem(prev => ({...prev, itemId: undefined, type: 'recipe'})); }}
                >
                    Receita
                </Button>
            </div>

          <div>
            <label htmlFor="itemSearch" className="block text-sm font-medium text-slate-700">Buscar</label>
            <input type="text" id="itemSearch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Digite para filtrar ${searchType === 'ingredient' ? 'ingredientes' : 'receitas'}...`} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>

           <div>
                <label htmlFor="itemSelect" className="block text-sm font-medium text-slate-700">Selecione o Item</label>
                <select
                    id="itemSelect"
                    value={currentItem.itemId || ''}
                    onChange={(e) => {
                         const selectedId = e.target.value;
                         const selectedItem = itemsForDropdown.find(i => i.id === selectedId);
                         setCurrentItem(prev => ({ ...prev, itemId: selectedId, type: searchType, customName: selectedItem?.name }));
                    }}
                    className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                    size={itemsForDropdown.length > 5 ? 8 : Math.max(2, itemsForDropdown.length + 1)} 
                    required
                >
                    {itemsForDropdown.length === 0 ? (
                        <option value="" disabled>Nenhum item encontrado</option>
                    ) : (
                        itemsForDropdown.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))
                    )}
                </select>
            </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                Quantidade ({currentItem.type === 'ingredient' ? getIngredientById(currentItem.itemId || '')?.unit || '' : 'porções'})
            </label>
            <input type="number" id="quantity" value={currentItem.quantity || ''} onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} min="0.01" step="0.01" className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
          <div>
            <label htmlFor="customName" className="block text-sm font-medium text-slate-700">Nome Personalizado (Opcional)</label>
            <input type="text" id="customName" value={currentItem.customName || ''} onChange={(e) => setCurrentItem(prev => ({ ...prev, customName: e.target.value }))} placeholder="Ex: Maçã grande, Salada especial" className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={modalMode === 'add' ? handleAddItem : handleEditItem} disabled={!currentItem.itemId || !currentItem.quantity || currentItem.quantity <= 0}>{modalMode === 'add' ? 'Adicionar' : 'Salvar Alterações'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PlannerPage;