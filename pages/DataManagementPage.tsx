
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { Ingredient, Recipe, RecipeIngredient, CsvIngredient, CsvRecipe, NutrientInfo, ImportBatch, RecipeDifficulty, UserUnitConversion } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { UNITS_OF_MEASUREMENT, CSV_INGREDIENT_HEADERS, CSV_RECIPE_HEADERS, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL, RECIPE_DIFFICULTY_LEVELS } from '../constants';
import { IconPlus, IconUpload, IconTrash, IconEdit, IconDownload, IconSearch, IconBook, IconFilter, IconCopy, IconSettings, IconDollarSign, IconMapPin, IconBarChart, IconSliders, IconRefreshCw } from '../components/Icon';
import Papa from 'papaparse';
import { useGlobalToast } from '../App'; 
import { generateId } from '../utils/idGenerator';

interface IngredientFormProps {
  initialIngredient?: Partial<Ingredient>; 
  onSubmit: (ingredient: Omit<Ingredient, 'id'> | Ingredient) => void;
  onCancel: () => void;
  sectors: string[];
  addSector: (sector: string) => void;
  suggestSector: (name: string) => string | undefined;
}

const nutrientFormFields: { key: keyof NutrientInfo; label: string; unit: string, step?: string }[] = [
    { key: 'Energia', label: 'Energia', unit: 'Kcal', step: "1" },
    { key: 'Proteína', label: 'Proteína', unit: 'g', step: "0.1" },
    { key: 'Carboidrato', label: 'Carboidrato', unit: 'g', step: "0.1" },
    { key: 'Lipídeos', label: 'Lipídeos', unit: 'g', step: "0.1" },
    { key: 'Colesterol', label: 'Colesterol', unit: 'mg', step: "1" },
    { key: 'FibraAlimentar', label: 'Fibra Alimentar', unit: 'g', step: "0.1" },
];

const IngredientForm: React.FC<IngredientFormProps> = ({ initialIngredient, onSubmit, onCancel, sectors, addSector, suggestSector }) => {
  const [ingredient, setIngredient] = useState<Partial<Ingredient>>(
    initialIngredient || { name: '', unit: 'g', setor: 'Outros', brand: '', averagePrice: undefined, purchaseLocation: '', ...DEFAULT_NUTRIENT_INFO }
  );
  const [suggestedSector, setSuggestedSector] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialIngredient) {
        setIngredient({
            ...DEFAULT_NUTRIENT_INFO, 
            ...initialIngredient, 
            setor: initialIngredient.setor || 'Outros', 
            brand: initialIngredient.brand || '',
            averagePrice: initialIngredient.averagePrice === null ? undefined : initialIngredient.averagePrice,
            purchaseLocation: initialIngredient.purchaseLocation || ''
        });
        setSuggestedSector(undefined); // No suggestion when editing existing with a sector
    } else {
        setIngredient({ name: '', unit: 'g', setor: 'Outros', brand: '', averagePrice: undefined, purchaseLocation: '', ...DEFAULT_NUTRIENT_INFO });
    }
  }, [initialIngredient]);

  const handleNameChangeForSuggestion = (newName: string) => {
    setIngredient(prev => ({ ...prev, name: newName }));
    if ((!initialIngredient || !initialIngredient.id) || (ingredient.setor === 'Outros' || !ingredient.setor)) {
        const suggestion = suggestSector(newName);
        setSuggestedSector(suggestion);
    }
  };
  
  const applySuggestedSector = () => {
    if (suggestedSector) {
        setIngredient(prev => ({...prev, setor: suggestedSector}));
        setSuggestedSector(undefined); // Clear suggestion after applying
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNutrientField = nutrientFormFields.some(field => field.key === name);
    
    if (name === "setor" && value === "_add_new_sector_") {
        const newSectorName = prompt("Digite o nome do novo setor:");
        if (newSectorName && newSectorName.trim()) {
            const trimmedNewSector = newSectorName.trim();
            addSector(trimmedNewSector);
            setIngredient(prev => ({...prev, setor: trimmedNewSector}));
            setSuggestedSector(undefined); // Clear suggestion if manually changed
        } 
        return;
    }
    
    if (name === "averagePrice") {
         setIngredient(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) || 0 }));
    } else {
        setIngredient(prev => ({ 
            ...prev, 
            [name]: isNutrientField ? parseFloat(value) || 0 : value 
        }));
    }
    if (name === "setor") {
        setSuggestedSector(undefined); // Clear suggestion if sector is manually changed
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient.name || !ingredient.unit) {
        alert("Nome e Unidade são obrigatórios.");
        return;
    }

    const commonData = {
        ...DEFAULT_NUTRIENT_INFO, 
        ...ingredient, 
        name: ingredient.name as string, 
        unit: ingredient.unit as string, 
        setor: ingredient.setor || 'Outros',
        brand: ingredient.brand?.trim() || undefined,
        averagePrice: ingredient.averagePrice,
        purchaseLocation: ingredient.purchaseLocation?.trim() || undefined,
    };
    
    if (initialIngredient && initialIngredient.id) { 
        const ingredientToUpdate: Ingredient = {
            ...(commonData as NutrientInfo), 
            name: commonData.name,
            unit: commonData.unit,
            setor: commonData.setor,
            brand: commonData.brand,
            averagePrice: commonData.averagePrice,
            purchaseLocation: commonData.purchaseLocation,
            id: initialIngredient.id, 
        };
        onSubmit(ingredientToUpdate);
    } else { 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...restOfData } = commonData; 
        const ingredientToAdd: Omit<Ingredient, 'id'> = {
            ...(restOfData as NutrientInfo), 
            name: restOfData.name,
            unit: restOfData.unit,
            setor: restOfData.setor,
            brand: restOfData.brand,
            averagePrice: restOfData.averagePrice,
            purchaseLocation: restOfData.purchaseLocation,
        };
        onSubmit(ingredientToAdd);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <h3 className="text-xl font-semibold text-emerald-700 mb-3">
        {initialIngredient && initialIngredient.id ? 'Editar Ingrediente' : 'Adicionar Novo Ingrediente'}
      </h3>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Ingrediente</label>
        <input type="text" name="name" id="name" value={ingredient.name} onChange={(e) => handleNameChangeForSuggestion(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
            <select name="unit" id="unit" value={ingredient.unit} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
            {UNITS_OF_MEASUREMENT.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Nutrientes devem ser informados por esta unidade (ou por 100g/100ml se aplicável).</p>
        </div>
        <div>
            <label htmlFor="setor" className="block text-sm font-medium text-gray-700">Setor</label>
            <select name="setor" id="setor" value={ingredient.setor || 'Outros'} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="_add_new_sector_">Adicionar novo setor...</option>
            </select>
             {suggestedSector && ingredient.setor !== suggestedSector && (
                <div className="mt-1 text-xs text-emerald-700">
                    Sugestão: {suggestedSector}. 
                    <Button type="button" variant="ghost" size="sm" onClick={applySuggestedSector} className="ml-1 p-0.5 text-emerald-600 hover:text-emerald-800">Aplicar?</Button>
                </div>
            )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca (Opcional)</label>
          <input type="text" name="brand" id="brand" value={ingredient.brand || ''} onChange={handleChange} placeholder="Ex: Nestlé, Sadia" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="averagePrice" className="block text-sm font-medium text-gray-700 flex items-center"><IconDollarSign className="mr-1 w-4 h-4 text-gray-500" />Preço Médio (R$, Opcional)</label>
            <input type="number" name="averagePrice" id="averagePrice" value={ingredient.averagePrice === undefined ? '' : ingredient.averagePrice} onChange={handleChange} step="0.01" placeholder="Ex: 5.99" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="purchaseLocation" className="block text-sm font-medium text-gray-700 flex items-center"><IconMapPin className="mr-1 w-4 h-4 text-gray-500" />Local de Compra (Opcional)</label>
            <input type="text" name="purchaseLocation" id="purchaseLocation" value={ingredient.purchaseLocation || ''} onChange={handleChange} placeholder="Ex: Supermercado X" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nutrientFormFields.map(({ key, label, unit, step }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label} ({unit})</label>
            <input 
              type="number" name={key} id={key} value={(ingredient as any)[key] || 0} 
              onChange={handleChange} step={step || "0.1"} min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialIngredient && initialIngredient.id ? 'Salvar Alterações' : 'Adicionar Ingrediente'}</Button>
      </div>
    </form>
  );
};


interface RecipeFormProps {
  initialRecipe?: Partial<Recipe>; 
  onSubmit: (recipe: Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'> | Recipe) => void;
  onCancel: () => void;
  availableIngredients: Ingredient[];
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialRecipe, onSubmit, onCancel, availableIngredients }) => {
  const [recipe, setRecipe] = useState<Partial<Recipe>>(
    initialRecipe || { name: '', instructions: '', servings: 1, ingredients: [], imageUrl: '', prepTime: '', difficulty: undefined }
  );
  const [ingredientSearch, setIngredientSearch] = useState('');

  useEffect(() => {
     if (initialRecipe) {
        setRecipe({...initialRecipe, prepTime: initialRecipe.prepTime || '', difficulty: initialRecipe.difficulty || undefined });
    } else {
        setRecipe({ name: '', instructions: '', servings: 1, ingredients: [], imageUrl: '', prepTime: '', difficulty: undefined });
    }
  },[initialRecipe]);

  const handleRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'servings') {
      setRecipe(prev => ({ ...prev, servings: parseInt(value) || 1 }));
    } else if (name === 'difficulty') {
      setRecipe(prev => ({ ...prev, difficulty: value as RecipeDifficulty || undefined }));
    }
     else {
      setRecipe(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updatedIngredients = [...(recipe.ingredients || [])];
    if (field === 'ingredientId') {
        updatedIngredients[index] = { ...updatedIngredients[index], ingredientId: value as string };
    } else if (field === 'quantity') {
        updatedIngredients[index] = { ...updatedIngredients[index], quantity: parseFloat(value as string) || 0 };
    }
    setRecipe(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const addRecipeIngredient = () => {
    if(availableIngredients.length === 0) {
        alert("Adicione ingredientes ao sistema primeiro.");
        return;
    }
    const filteredAvailIngredients = ingredientSearch ? 
        availableIngredients.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())) 
        : availableIngredients;

    setRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: filteredAvailIngredients.length > 0 ? filteredAvailIngredients[0].id : availableIngredients[0].id, quantity: 1 }]
    }));
  };

  const removeRecipeIngredient = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe.name || !recipe.instructions || (recipe.ingredients || []).length === 0 || (recipe.servings || 0) <= 0) {
        alert("Nome, Modo de Preparo, Ingredientes e Porções (maior que 0) são obrigatórios.");
        return;
    }
    
    const commonRecipeData = {
        name: recipe.name as string,
        instructions: recipe.instructions as string,
        servings: recipe.servings as number,
        ingredients: recipe.ingredients as RecipeIngredient[],
        imageUrl: recipe.imageUrl || `${PLACEHOLDER_IMAGE_URL}?=${generateId()}`,
        prepTime: recipe.prepTime?.trim() || undefined,
        difficulty: recipe.difficulty || undefined,
    };

    if (initialRecipe && initialRecipe.id) { 
        const recipeToUpdate: Recipe = {
            ...(commonRecipeData as Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'>), 
            ...DEFAULT_NUTRIENT_INFO, 
            id: initialRecipe.id,
        };
        onSubmit(recipeToUpdate);
    } else { 
        const recipeToAdd: Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'> = commonRecipeData;
        onSubmit(recipeToAdd);
    }
  };
  
  const searchedAvailableIngredients = useMemo(() => {
    if (!ingredientSearch) return availableIngredients;
    return availableIngredients.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()));
  }, [ingredientSearch, availableIngredients]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <h3 className="text-xl font-semibold text-emerald-700 mb-3">
        {initialRecipe && initialRecipe.id ? 'Editar Receita' : 'Adicionar Nova Receita'}
      </h3>
      <div>
        <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700">Nome da Receita</label>
        <input type="text" name="name" id="recipeName" value={recipe.name || ''} onChange={handleRecipeChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Modo de Preparo</label>
        <textarea name="instructions" id="instructions" value={recipe.instructions || ''} onChange={handleRecipeChange} rows={5} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label htmlFor="servings" className="block text-sm font-medium text-gray-700">Número de Porções</label>
            <input type="number" name="servings" id="servings" value={recipe.servings || 1} onChange={handleRecipeChange} min="1" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">Tempo de Preparo (Opcional)</label>
            <input type="text" name="prepTime" id="prepTime" value={recipe.prepTime || ''} onChange={handleRecipeChange} placeholder="Ex: 30 min, 1 hora" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 flex items-center"><IconBarChart className="mr-1 w-4 h-4 text-gray-500"/>Nível de Dificuldade (Opcional)</label>
            <select name="difficulty" id="difficulty" value={recipe.difficulty || ''} onChange={handleRecipeChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                <option value="">Selecione...</option>
                {RECIPE_DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
        </div>
      </div>
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL da Imagem (Opcional)</label>
        <input type="url" name="imageUrl" id="imageUrl" value={recipe.imageUrl || ''} onChange={handleRecipeChange} placeholder={PLACEHOLDER_IMAGE_URL} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Ingredientes da Receita</h4>
        <div className="mb-2">
            <label htmlFor="recipeIngredientSearch" className="block text-xs font-medium text-gray-600">Buscar ingrediente para adicionar:</label>
            <input 
                type="text" 
                id="recipeIngredientSearch"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                placeholder="Digite para filtrar ingredientes..."
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
        </div>
        {(recipe.ingredients || []).map((ing, index) => (
          <div key={index} className="flex items-end gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex-grow">
              <label htmlFor={`ing-id-${index}`} className="block text-xs font-medium text-gray-600">Ingrediente</label>
              <select
                id={`ing-id-${index}`}
                value={ing.ingredientId}
                onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm"
              >
                {searchedAvailableIngredients.length > 0 ? 
                    searchedAvailableIngredients.map(availIng => <option key={availIng.id} value={availIng.id}>{availIng.name}</option>) :
                    <option value="">Nenhum ingrediente encontrado</option>
                }
              </select>
            </div>
            <div className="w-1/4">
              <label htmlFor={`ing-qty-${index}`} className="block text-xs font-medium text-gray-600">Qtd.</label>
              <input
                type="number"
                id={`ing-qty-${index}`}
                value={ing.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                min="0.01" step="0.01"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
            <Button type="button" variant="danger" size="sm" onClick={() => removeRecipeIngredient(index)} aria-label="Remover Ingrediente"><IconTrash /></Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addRecipeIngredient} leftIcon={<IconPlus />}>Adicionar Ingrediente à Receita</Button>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialRecipe && initialRecipe.id ? 'Salvar Alterações' : 'Adicionar Receita'}</Button>
      </div>
    </form>
  );
};


const getCategoryColorStyle = (category: string = "Outros") => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; 
    }
    const colors = [
      'bg-green-100 text-green-800 border-green-300', 
      'bg-blue-100 text-blue-800 border-blue-300', 
      'bg-yellow-100 text-yellow-800 border-yellow-300', 
      'bg-purple-100 text-purple-800 border-purple-300', 
      'bg-pink-100 text-pink-800 border-pink-300',
      'bg-indigo-100 text-indigo-800 border-indigo-300',
      'bg-red-100 text-red-800 border-red-300',
      'bg-teal-100 text-teal-800 border-teal-300',
      'bg-orange-100 text-orange-800 border-orange-300',
      'bg-gray-100 text-gray-800 border-gray-300'
    ];
    return colors[Math.abs(hash) % colors.length];
};

interface BatchSectorUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  allIngredients: Ingredient[];
  allSectors: string[];
  onUpdateSectors: (ingredientIds: string[], newSector: string) => void;
  onAddSector: (sectorName: string) => void;
}

const BatchSectorUpdateModal: React.FC<BatchSectorUpdateModalProps> = ({ isOpen, onClose, allIngredients, allSectors, onUpdateSectors, onAddSector }) => {
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [targetSector, setTargetSector] = useState<string>(allSectors.length > 0 ? allSectors[0] : 'Outros');
  const [ingredientSearch, setIngredientSearch] = useState('');

  const filteredModalIngredients = useMemo(() => {
    return allIngredients.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()));
  }, [allIngredients, ingredientSearch]);

  const handleToggleIngredient = (id: string) => {
    setSelectedIngredientIds(prev => 
      prev.includes(id) ? prev.filter(ingId => ingId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedIngredientIds(select ? filteredModalIngredients.map(ing => ing.id) : []);
  };
  
  const handleTargetSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "_add_new_sector_") {
        const newSectorName = prompt("Digite o nome do novo setor:");
        if (newSectorName && newSectorName.trim()) {
            const trimmedNewSector = newSectorName.trim();
            onAddSector(trimmedNewSector); 
            setTargetSector(trimmedNewSector); 
        } 
    } else {
        setTargetSector(value);
    }
  };

  const handleSubmit = () => {
    if (selectedIngredientIds.length === 0) {
      alert("Selecione pelo menos um ingrediente.");
      return;
    }
    if (!targetSector) {
      alert("Selecione um setor de destino.");
      return;
    }
    onUpdateSectors(selectedIngredientIds, targetSector);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedIngredientIds([]);
      setIngredientSearch('');
      setTargetSector(allSectors.length > 0 ? allSectors[0] : 'Outros');
    }
  }, [isOpen, allSectors]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atualizar Setor de Múltiplos Ingredientes" size="xl">
      <div className="space-y-4">
        <div>
          <label htmlFor="modalIngredientSearch" className="block text-sm font-medium text-gray-700">Buscar Ingredientes</label>
          <input 
            type="text" 
            id="modalIngredientSearch" 
            value={ingredientSearch} 
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="Digite para filtrar..."
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
          {filteredModalIngredients.length > 0 && (
            <div className="mb-2">
                <label className="flex items-center text-sm">
                    <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={filteredModalIngredients.length > 0 && selectedIngredientIds.length === filteredModalIngredients.length}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-2"
                    />
                    Selecionar todos os visíveis ({filteredModalIngredients.length})
                </label>
            </div>
          )}
          {filteredModalIngredients.map(ing => (
            <label key={ing.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedIngredientIds.includes(ing.id)} 
                onChange={() => handleToggleIngredient(ing.id)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-2"
              />
              <span className="text-sm text-gray-800 flex-grow">{ing.name}</span>
              <span className="text-xs text-gray-500">({ing.setor || 'Outros'})</span>
            </label>
          ))}
          {filteredModalIngredients.length === 0 && <p className="text-sm text-gray-500 p-2">Nenhum ingrediente encontrado.</p>}
        </div>

        <div>
          <label htmlFor="targetSector" className="block text-sm font-medium text-gray-700">Novo Setor para {selectedIngredientIds.length} selecionado(s)</label>
          <select 
            id="targetSector" 
            value={targetSector} 
            onChange={handleTargetSectorChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
          >
            {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="_add_new_sector_">Adicionar novo setor...</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={selectedIngredientIds.length === 0}>Atualizar Setores</Button>
      </div>
    </Modal>
  );
};

interface UnitConversionFormProps {
  conversion?: UserUnitConversion;
  ingredients: Ingredient[];
  onSubmit: (data: Omit<UserUnitConversion, 'id'> | UserUnitConversion) => void;
  onCancel: () => void;
}

const UnitConversionForm: React.FC<UnitConversionFormProps> = ({ conversion, ingredients, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<UserUnitConversion>>(
    conversion || { ingredientId: ingredients[0]?.id || '', quantityA: 1, unitA: 'unidade', quantityB: 100, unitB: 'g'}
  );

  useEffect(() => {
    setFormData(conversion || { ingredientId: ingredients[0]?.id || '', quantityA: 1, unitA: 'unidade', quantityB: 100, unitB: 'g'});
  }, [conversion, ingredients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'quantityA' || name === 'quantityB') ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredientId || !formData.unitA || !formData.unitB || formData.quantityA == null || formData.quantityB == null || formData.quantityA <=0 || formData.quantityB <= 0) {
      alert("Todos os campos são obrigatórios e quantidades devem ser positivas.");
      return;
    }
    onSubmit(formData as Omit<UserUnitConversion, 'id'> | UserUnitConversion);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 bg-gray-50 rounded-md">
      <h3 className="text-lg font-semibold text-emerald-700">
        {conversion ? 'Editar Conversão' : 'Adicionar Nova Conversão'}
      </h3>
      <div>
        <label htmlFor="ingredientId" className="block text-sm font-medium text-gray-700">Ingrediente</label>
        <select name="ingredientId" id="ingredientId" value={formData.ingredientId} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
          {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
        </select>
      </div>
      <p className="text-sm text-gray-600 text-center">Define que:</p>
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="quantityA" className="block text-sm font-medium text-gray-700">Quantidade A</label>
          <input type="number" name="quantityA" id="quantityA" value={formData.quantityA || ''} onChange={handleChange} step="any" min="0.001" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="unitA" className="block text-sm font-medium text-gray-700">Unidade A</label>
          <select name="unitA" id="unitA" value={formData.unitA} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
            {UNITS_OF_MEASUREMENT.map(u => <option key={`A-${u.value}`} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <p className="text-2xl text-gray-600 text-center font-bold">=</p>
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="quantityB" className="block text-sm font-medium text-gray-700">Quantidade B</label>
          <input type="number" name="quantityB" id="quantityB" value={formData.quantityB || ''} onChange={handleChange} step="any" min="0.001" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="unitB" className="block text-sm font-medium text-gray-700">Unidade B</label>
          <select name="unitB" id="unitB" value={formData.unitB} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
            {UNITS_OF_MEASUREMENT.map(u => <option key={`B-${u.value}`} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{conversion ? 'Salvar Alterações' : 'Adicionar Conversão'}</Button>
      </div>
    </form>
  );
};


export default function DataManagementPage(): React.ReactElement {
  const { 
    ingredients, recipes, addIngredient, updateIngredient, deleteIngredient, deleteAllIngredients, updateIngredientsSectorBatch,
    addRecipe, updateRecipe, deleteRecipe: deleteRecipeData, 
    importIngredients, importRecipes, getIngredientById, getRecipeById,
    importBatches, deleteImportBatch,
    sectors, addSector: addSectorToData, deleteSector: deleteSectorFromData, updateSector: updateSectorInData,
    userConversions, addUserConversion, updateUserConversion, deleteUserConversion, getUserConversionsForIngredient, // Unit Conversion
    suggestSector // Smart Sector
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useGlobalToast();

  const TABS = ['ingredients', 'recipes', 'sectors', 'conversions', 'import'] as const; 
  type ActiveViewType = typeof TABS[number] | 'addIngredient' | 'addRecipe' | 'editIngredient' | 'editRecipe';
  
  const [activeView, setActiveView] = useState<ActiveViewType>('ingredients');
  
  const [editingIngredient, setEditingIngredient] = useState<Partial<Ingredient> | undefined>(undefined);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | undefined>(undefined);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('');

  const [showDeleteAllIngredientsModal, setShowDeleteAllIngredientsModal] = useState(false);
  const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ImportBatch | null>(null);
  const [showBatchSectorUpdateModal, setShowBatchSectorUpdateModal] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'ingredients' | 'recipes'>('ingredients');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [editingSector, setEditingSector] = useState<{ oldName: string; newName: string } | null>(null);
  const [newSectorName, setNewSectorName] = useState('');

  // Unit Conversions State
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [editingConversion, setEditingConversion] = useState<UserUnitConversion | undefined>(undefined);
  const [conversionFilterIngredientId, setConversionFilterIngredientId] = useState<string>('');
  
  useEffect(() => {
    const viewParam = searchParams.get('view') as ActiveViewType | null;
    const editIngredientId = searchParams.get('editIngredient');
    const editRecipeId = searchParams.get('editRecipe');
    const cloneIngredientId = searchParams.get('cloneIngredient');
    const cloneRecipeId = searchParams.get('cloneRecipe');

    if (editIngredientId) {
      const ing = getIngredientById(editIngredientId);
      if (ing) { setEditingIngredient(ing); setActiveView('editIngredient'); } 
      else { updateView('ingredients'); }
    } else if (editRecipeId) {
      const rec = getRecipeById(editRecipeId);
      if (rec) { setEditingRecipe(rec); setActiveView('editRecipe'); } 
      else { updateView('recipes'); }
    } else if (cloneIngredientId) {
        const ingToClone = getIngredientById(cloneIngredientId);
        if (ingToClone) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...clonedData } = ingToClone;
            setEditingIngredient({ ...clonedData, name: `${clonedData.name} (Cópia)` }); 
            setActiveView('addIngredient'); 
        } else { updateView('ingredients'); }
    } else if (cloneRecipeId) {
        const recToClone = getRecipeById(cloneRecipeId);
        if (recToClone) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...clonedData } = recToClone;
            setEditingRecipe({ ...clonedData, name: `${clonedData.name} (Cópia)` }); 
            setActiveView('addRecipe');
        } else { updateView('recipes'); }
    } else if (viewParam && TABS.includes(viewParam as any)) {
      setActiveView(viewParam);
    } else if (viewParam && (viewParam === 'addIngredient' || viewParam === 'addRecipe')) {
      setActiveView(viewParam);
    } else if (!activeView.startsWith('edit') && !activeView.startsWith('add') && !TABS.includes(activeView as any)) {
        updateView('ingredients');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, getIngredientById, getRecipeById]);

  const updateView = (view: ActiveViewType, params?: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams); 
    newParams.set('view', view);
    if (params) {
        for (const key in params) {
            if (params[key]) newParams.set(key, params[key]);
            else newParams.delete(key); 
        }
    } else { 
        if (!params?.editIngredient) newParams.delete('editIngredient');
        if (!params?.editRecipe) newParams.delete('editRecipe');
        if (!params?.cloneIngredient) newParams.delete('cloneIngredient');
        if (!params?.cloneRecipe) newParams.delete('cloneRecipe');
    }
    setSearchParams(newParams);
    setActiveView(view); 
    if (TABS.includes(view as any) || (view === 'addIngredient' && !params?.cloneIngredient) || (view === 'addRecipe' && !params?.cloneRecipe) ) {
        setEditingIngredient(undefined);
        setEditingRecipe(undefined);
        setShowConversionForm(false);
        setEditingConversion(undefined);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        addToast("Por favor, selecione um arquivo CSV.", "error");
        event.target.value = ""; 
        setCsvFile(null);
        return;
      }
      setCsvFile(file);
      setPreviewData([]); 
    }
  };

  const handlePreviewCsv = async () => {
    if (!csvFile) {
        addToast("Por favor, selecione um arquivo CSV.", "warning");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            preview: 10, 
            complete: (results: Papa.ParseResult<any>) => {
                if (results.errors.length > 0) {
                    addToast("Erro ao ler o CSV para pré-visualização: " + results.errors.map(err => err.message).join('\\n'), "error");
                    return;
                }
                setPreviewData(results.data);
                setShowPreviewModal(true);
            }
        });
    };
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (!csvFile) {
      addToast("Por favor, selecione um arquivo CSV.", "warning");
      return;
    }
    const currentFilename = csvFile.name; 
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<CsvIngredient | CsvRecipe>) => {
          let batchResult: ImportBatch | null = null;
          if (results.errors.length > 0) {
             batchResult = {id: generateId(), filename:currentFilename, date: new Date().toISOString(), type: importType, successCount:0, errorCount: results.errors.length, errors: results.errors.map(err => `Linha ${err.row}: ${err.message} (${err.code})`)}
          } else {
            if (importType === 'ingredients') {
                const expectedHeaders = CSV_INGREDIENT_HEADERS;
                const actualHeaders = results.meta.fields;
                if (!actualHeaders || !expectedHeaders.every(h => actualHeaders.includes(h))) {
                    addToast(`Cabeçalhos do CSV de ingredientes inválidos. Esperado: ${expectedHeaders.join(', ')}`, "error");
                    return;
                }
                batchResult = importIngredients(results.data as CsvIngredient[], currentFilename);
            } else { 
                const expectedHeaders = CSV_RECIPE_HEADERS;
                const actualHeaders = results.meta.fields;
                 if (!actualHeaders || !expectedHeaders.every(h => actualHeaders.includes(h))) {
                    addToast(`Cabeçalhos do CSV de receitas inválidos. Esperado: ${expectedHeaders.join(', ')}`, "error");
                    return;
                }
                batchResult = importRecipes(results.data as CsvRecipe[], currentFilename);
            }
          }
          
          if(batchResult){
            if (batchResult.errorCount > 0) {
                addToast(`Importação concluída com ${batchResult.errorCount} erros. Verifique o histórico de importações.`, "warning");
            } else {
                addToast(`${batchResult.successCount} ${importType === 'ingredients' ? 'ingredientes' : 'receitas'} importados com sucesso!`, "success");
            }
             if (batchResult.message) { 
                addToast(batchResult.message, "info", 10000);
            }
          }

          setCsvFile(null); 
          const fileInput = document.getElementById('csvFile') as HTMLInputElement | null;
          if (fileInput) {
            fileInput.value = ''; 
          }
        },
        error: (error: any) => {
            addToast(`Erro ao processar arquivo: ${error.message}`, "error");
        }
      });
    };
    reader.readAsText(csvFile, 'UTF-8'); 
  };

  const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`${filename} exportado com sucesso.`, "success");
  };

  const handleExportIngredients = () => {
    const dataToExport = ingredients.map(ing => ({
      nome: ing.name,
      unidade: ing.unit,
      setor: ing.setor || 'Outros',
      marca: ing.brand || '',
      energia_kcal: ing.Energia.toString(),
      proteina_g: ing.Proteína.toString(),
      carboidrato_g: ing.Carboidrato.toString(),
      lipideos_g: ing.Lipídeos.toString(),
      colesterol_mg: ing.Colesterol.toString(),
      fibra_alimentar_g: ing.FibraAlimentar.toString(),
      preco_medio: ing.averagePrice !== undefined ? ing.averagePrice.toString() : '',
      local_compra: ing.purchaseLocation || ''
    }));
    const csvString = Papa.unparse(dataToExport, { header: true, columns: CSV_INGREDIENT_HEADERS });
    downloadCSV(csvString, 'nutriplanner_ingredientes.csv');
  };

  const handleExportRecipes = () => {
    const dataToExport = recipes.map(rec => {
      const ingredientsString = rec.ingredients.map(ingDetail => {
        const ingredient = getIngredientById(ingDetail.ingredientId);
        return `${ingredient ? ingredient.name : 'Desconhecido'}:${ingDetail.quantity}`;
      }).join(';');
      return {
        nome: rec.name,
        modo_preparo: rec.instructions,
        ingredientes: ingredientsString,
        porcoes: rec.servings.toString(),
        tempo_preparo: rec.prepTime || '',
        dificuldade: rec.difficulty || '',
      };
    });
    const csvString = Papa.unparse(dataToExport, { header: true, columns: CSV_RECIPE_HEADERS });
    downloadCSV(csvString, 'nutriplanner_receitas.csv');
  };

  const uniqueSectorsForFilter = useMemo(() => {
    return [...sectors].sort(); 
  }, [sectors]);

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) &&
    (selectedSectorFilter === '' || (ing.setor || 'Outros') === selectedSectorFilter)
  ).sort((a,b) => a.name.localeCompare(b.name));

  const confirmDeleteAllIngredients = () => {
    deleteAllIngredients();
    setShowDeleteAllIngredientsModal(false);
    addToast("Todos os ingredientes foram excluídos.", "success");
  };

  const confirmDeleteBatch = () => {
    if (batchToDelete) {
      deleteImportBatch(batchToDelete.id);
      addToast(`Lote "${batchToDelete.filename}" excluído.`, "success");
    }
    setShowDeleteBatchModal(false);
    setBatchToDelete(null);
  };

  const openDeleteBatchModal = (batch: ImportBatch) => {
    setBatchToDelete(batch);
    setShowDeleteBatchModal(true);
  };
  
  const handleBatchUpdateSectors = (ingredientIds: string[], newSector: string) => {
    updateIngredientsSectorBatch(ingredientIds, newSector);
    addToast(`${ingredientIds.length} ingrediente(s) atualizado(s) para o setor "${newSector}".`, "success");
  };


  const handleAddSector = () => {
    const trimmed = newSectorName.trim();
    if (trimmed && !sectors.includes(trimmed)) {
        addSectorToData(trimmed);
        setNewSectorName('');
        addToast(`Setor "${trimmed}" adicionado.`, "success");
    } else if (sectors.includes(trimmed)) {
        addToast(`Setor "${trimmed}" já existe.`, "warning");
    } else {
        addToast("Nome do setor não pode ser vazio.", "error");
    }
  };

  const handleStartEditSector = (sectorName: string) => {
    setEditingSector({ oldName: sectorName, newName: sectorName });
  };

  const handleSaveEditedSector = () => {
    if (editingSector && editingSector.newName.trim() && editingSector.oldName !== editingSector.newName.trim()) {
        if (sectors.includes(editingSector.newName.trim())) {
            addToast(`Setor "${editingSector.newName.trim()}" já existe. Escolha outro nome.`, "warning");
            return;
        }
        updateSectorInData(editingSector.oldName, editingSector.newName.trim());
        addToast(`Setor "${editingSector.oldName}" atualizado para "${editingSector.newName.trim()}".`, "success");
        setEditingSector(null);
    } else if (editingSector && !editingSector.newName.trim()) {
         addToast("Nome do setor não pode ser vazio.", "error");
    } else {
        setEditingSector(null); 
    }
  };

  const handleDeleteSector = (sectorName: string) => {
    if (confirm(`Tem certeza que deseja excluir o setor "${sectorName}"? Ingredientes neste setor serão movidos para "Outros".`)) {
        deleteSectorFromData(sectorName);
        addToast(`Setor "${sectorName}" excluído.`, "success");
    }
  };

  // Unit Conversion Handlers
  const handleSaveConversion = (data: Omit<UserUnitConversion, 'id'> | UserUnitConversion) => {
    if ('id' in data) {
      updateUserConversion(data as UserUnitConversion);
      addToast("Conversão atualizada.", "success");
    } else {
      addUserConversion(data as Omit<UserUnitConversion, 'id'>);
      addToast("Nova conversão adicionada.", "success");
    }
    setShowConversionForm(false);
    setEditingConversion(undefined);
  };

  const handleEditConversion = (conversion: UserUnitConversion) => {
    setEditingConversion(conversion);
    setShowConversionForm(true);
  };

  const handleDeleteStoredConversion = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conversão?")) {
      deleteUserConversion(id);
      addToast("Conversão excluída.", "info");
    }
  };

  const filteredUserConversions = useMemo(() => {
    if (!conversionFilterIngredientId) return userConversions;
    return userConversions.filter(conv => conv.ingredientId === conversionFilterIngredientId);
  }, [userConversions, conversionFilterIngredientId]);


  const renderActiveView = () => {
    switch (activeView) {
      case 'ingredients':
        return (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <h2 className="text-2xl font-semibold text-gray-700">Ingredientes Cadastrados ({filteredIngredients.length})</h2>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <Button onClick={() => { updateView('addIngredient');}} leftIcon={<IconPlus />}>Novo Ingrediente</Button>
                <Button onClick={() => setShowBatchSectorUpdateModal(true)} leftIcon={<IconSliders />} variant="ghost">Editar Setor em Lote</Button>
                <Button onClick={handleExportIngredients} leftIcon={<IconDownload />} variant="ghost">Exportar CSV</Button>
                <Button onClick={() => setShowDeleteAllIngredientsModal(true)} leftIcon={<IconTrash />} variant="danger">Excluir Todos</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="ingredientSearch" className="sr-only">Buscar Ingredientes</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <IconSearch /> </div>
                        <input
                            type="search" id="ingredientSearch" placeholder="Buscar ingrediente pelo nome..."
                            value={ingredientSearchTerm} onChange={(e) => setIngredientSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="sectorFilter" className="sr-only">Filtrar por Setor</label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <IconFilter className="text-gray-400"/> </div>
                        <select
                            id="sectorFilter" value={selectedSectorFilter} onChange={(e) => setSelectedSectorFilter(e.target.value)}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        >
                            <option value="">Todos os Setores</option>
                            {uniqueSectorsForFilter.map(sector => <option key={sector} value={sector}>{sector}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {filteredIngredients.length === 0 ? <p className="text-gray-500">{ingredients.length > 0 ? 'Nenhum ingrediente encontrado com os filtros aplicados.' : 'Nenhum ingrediente cadastrado.'}</p> : (
              <ul className="space-y-3">
                {filteredIngredients.map(ing => (
                  <li key={ing.id} className="p-4 bg-white shadow rounded-lg flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center mb-1 flex-wrap">
                        <p className="font-medium text-emerald-600 text-lg mr-2">{ing.name}</p>
                        {ing.brand && <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full mr-2">Marca: {ing.brand}</span>}
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getCategoryColorStyle(ing.setor)}`}>
                            {ing.setor || 'Outros'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Unidade: {ing.unit}</p>
                      { (ing.averagePrice !== undefined || ing.purchaseLocation) &&
                        <p className="text-xs text-gray-500 mb-1">
                            {ing.averagePrice !== undefined && <span className="mr-2"><IconDollarSign className="inline w-3 h-3 mr-0.5"/>R${ing.averagePrice.toFixed(2)}</span>}
                            {ing.purchaseLocation && <span><IconMapPin className="inline w-3 h-3 mr-0.5"/>{ing.purchaseLocation}</span>}
                        </p>
                      }
                      <p className="text-xs text-gray-600">
                        E: {ing.Energia.toFixed(0)}Kcal, P: {ing.Proteína.toFixed(1)}g, C: {ing.Carboidrato.toFixed(1)}g, L: {ing.Lipídeos.toFixed(1)}g, Col: {ing.Colesterol.toFixed(0)}mg, FA: {ing.FibraAlimentar.toFixed(1)}g
                      </p>
                    </div>
                    <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => updateView('editIngredient', { editIngredient: ing.id })} aria-label={`Editar ${ing.name}`}><IconEdit /></Button>
                      <Button variant="ghost" size="sm" onClick={() => updateView('addIngredient', { cloneIngredient: ing.id })} aria-label={`Clonar ${ing.name}`}><IconCopy /></Button>
                      <Button variant="danger" size="sm" onClick={() => { if(confirm(`Excluir "${ing.name}"? Esta ação não pode ser desfeita.`)) deleteIngredient(ing.id); }} aria-label={`Excluir ${ing.name}`}><IconTrash /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'recipes':
        const sortedRecipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
        return (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
              <h2 className="text-2xl font-semibold text-gray-700">Receitas Cadastradas ({sortedRecipes.length})</h2>
               <div className="flex space-x-2">
                <Button onClick={() => { updateView('addRecipe');}} leftIcon={<IconPlus />}>Nova Receita</Button>
                <Button onClick={handleExportRecipes} leftIcon={<IconDownload />} variant="ghost">Exportar CSV</Button>
              </div>
            </div>
            {sortedRecipes.length === 0 ? <p className="text-gray-500">Nenhuma receita cadastrada.</p> : (
              <ul className="space-y-3">
                {sortedRecipes.map(rec => (
                  <li key={rec.id} className="p-4 bg-white shadow rounded-lg flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow">
                        <div className="flex items-center flex-wrap">
                            <p className="font-medium text-emerald-600 text-lg mr-2">{rec.name}</p>
                            <span className="text-sm text-gray-500 mr-2">(Porções: {rec.servings})</span>
                            {rec.difficulty && <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full mr-2 flex items-center"><IconBarChart className="w-3 h-3 mr-1"/>{rec.difficulty}</span>}
                        </div>
                      {rec.prepTime && <p className="text-xs text-gray-500">Tempo de Preparo: {rec.prepTime}</p>}
                       <p className="text-xs text-gray-500 truncate max-w-md" title={rec.ingredients.map(i => getIngredientById(i.ingredientId)?.name).join(', ')}>
                        Ingredientes: {rec.ingredients.map(i => getIngredientById(i.ingredientId)?.name || 'N/A').join(', ') || 'N/A'}
                      </p>
                    </div>
                     <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => updateView('editRecipe', { editRecipe: rec.id })} aria-label={`Editar ${rec.name}`}><IconEdit /></Button>
                      <Button variant="ghost" size="sm" onClick={() => updateView('addRecipe', { cloneRecipe: rec.id })} aria-label={`Clonar ${rec.name}`}><IconCopy /></Button>
                      <Button variant="danger" size="sm" onClick={() => { if(confirm(`Excluir "${rec.name}"? Esta ação não pode ser desfeita.`)) deleteRecipeData(rec.id); }} aria-label={`Excluir ${rec.name}`}><IconTrash /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'addIngredient':
        return <IngredientForm initialIngredient={editingIngredient} sectors={sectors} addSector={addSectorToData} suggestSector={suggestSector} onSubmit={(data) => { addIngredient(data as Omit<Ingredient, 'id'>); updateView('ingredients'); addToast("Ingrediente adicionado!", "success"); }} onCancel={() => updateView('ingredients')} />;
      case 'editIngredient':
        return editingIngredient ? <IngredientForm initialIngredient={editingIngredient as Ingredient} sectors={sectors} addSector={addSectorToData} suggestSector={suggestSector} onSubmit={(data) => { updateIngredient(data as Ingredient); updateView('ingredients'); addToast("Ingrediente atualizado!", "success");}} onCancel={() => updateView('ingredients')} /> : <p>Carregando ingrediente...</p>;
      case 'addRecipe':
        return <RecipeForm initialRecipe={editingRecipe} availableIngredients={ingredients} onSubmit={(data) => { addRecipe(data as Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'>); updateView('recipes'); addToast("Receita adicionada!", "success");}} onCancel={() => updateView('recipes')} />;
      case 'editRecipe':
        return editingRecipe ? <RecipeForm initialRecipe={editingRecipe as Recipe} availableIngredients={ingredients} onSubmit={(data) => { updateRecipe(data as Recipe); updateView('recipes'); addToast("Receita atualizada!", "success");}} onCancel={() => updateView('recipes')} /> : <p>Carregando receita...</p>;
      case 'sectors':
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gerenciar Setores de Ingredientes</h2>
                <div className="mb-4 flex gap-2 items-end">
                    <div className="flex-grow">
                        <label htmlFor="newSectorName" className="block text-sm font-medium text-gray-700">Novo Setor</label>
                        <input type="text" id="newSectorName" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Nome do novo setor"/>
                    </div>
                    <Button onClick={handleAddSector} leftIcon={<IconPlus />}>Adicionar</Button>
                </div>
                {sectors.length === 0 ? <p className="text-gray-500">Nenhum setor customizado definido.</p> : (
                    <ul className="space-y-2">
                        {sectors.map(sector => (
                            <li key={sector} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                {editingSector && editingSector.oldName === sector ? (
                                    <input type="text" value={editingSector.newName}
                                        onChange={(e) => setEditingSector({...editingSector, newName: e.target.value})}
                                        className="p-1 border border-emerald-300 rounded-md flex-grow mr-2" autoFocus/>
                                ) : (
                                    <span className="text-gray-800">{sector}</span>
                                )}
                                <div className="flex space-x-2">
                                    {editingSector && editingSector.oldName === sector ? (
                                        <>
                                            <Button size="sm" onClick={handleSaveEditedSector}>Salvar</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingSector(null)}>Cancelar</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => handleStartEditSector(sector)}><IconEdit/></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDeleteSector(sector)}><IconTrash/></Button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
      case 'conversions':
        return (
            <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                    <h2 className="text-2xl font-semibold text-gray-700">Conversões de Unidades ({filteredUserConversions.length})</h2>
                    <Button onClick={() => { setEditingConversion(undefined); setShowConversionForm(true); }} leftIcon={<IconPlus />}>Nova Conversão</Button>
                </div>
                {showConversionForm && (
                    <UnitConversionForm 
                        conversion={editingConversion}
                        ingredients={ingredients}
                        onSubmit={handleSaveConversion}
                        onCancel={() => { setShowConversionForm(false); setEditingConversion(undefined); }}
                    />
                )}
                 <div className="mt-4">
                    <label htmlFor="conversionFilterIngredientId" className="block text-sm font-medium text-gray-700">Filtrar por Ingrediente:</label>
                    <select 
                        id="conversionFilterIngredientId"
                        value={conversionFilterIngredientId}
                        onChange={(e) => setConversionFilterIngredientId(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                    >
                        <option value="">Todos os Ingredientes</option>
                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    </select>
                </div>

                {filteredUserConversions.length === 0 && !showConversionForm ? (
                    <p className="text-gray-500 py-4">{userConversions.length > 0 ? 'Nenhuma conversão para este ingrediente.' : 'Nenhuma conversão definida.'}</p>
                ) : (
                    <ul className="space-y-2 mt-4">
                        {filteredUserConversions.map(conv => {
                            const ingredient = getIngredientById(conv.ingredientId);
                            return (
                                <li key={conv.id} className="p-3 bg-white shadow rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-emerald-600">{ingredient?.name || 'Ingrediente Desconhecido'}</p>
                                        <p className="text-sm text-gray-700">
                                            {conv.quantityA} {UNITS_OF_MEASUREMENT.find(u=>u.value===conv.unitA)?.label || conv.unitA}
                                            <span className="font-bold text-lg mx-2">=</span>
                                            {conv.quantityB} {UNITS_OF_MEASUREMENT.find(u=>u.value===conv.unitB)?.label || conv.unitB}
                                        </p>
                                    </div>
                                    <div className="flex space-x-1">
                                        <Button size="sm" variant="ghost" onClick={() => handleEditConversion(conv)}><IconEdit/></Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteStoredConversion(conv.id)}><IconTrash/></Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
      case 'import':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Importar Dados de CSV</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">Arquivo CSV</label>
                    <input type="file" id="csvFile" accept=".csv" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                </div>
                <div>
                    <label htmlFor="importType" className="block text-sm font-medium text-gray-700">Tipo de Dado</label>
                    <select id="importType" value={importType} onChange={(e) => setImportType(e.target.value as any)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    <option value="ingredients">Ingredientes</option>
                    <option value="recipes">Receitas</option>
                    </select>
                </div>
                </div>
                <div className="flex space-x-3 mt-4">
                    <Button onClick={handleImport} disabled={!csvFile} leftIcon={<IconUpload />}>Importar Arquivo</Button>
                    <Button onClick={handlePreviewCsv} disabled={!csvFile} variant="ghost">Pré-visualizar CSV</Button>
                </div>
                <div className="text-sm text-gray-600 space-y-2 mt-4">
                    <p><strong>Formato CSV Ingredientes:</strong> Cabeçalho: <code>{CSV_INGREDIENT_HEADERS.join(',')}</code></p>
                    <p className="text-xs">Ex: nome,unidade,setor,marca,energia_kcal,proteina_g,carboidrato_g,lipideos_g,colesterol_mg,fibra_alimentar_g,preco_medio,local_compra</p>
                    <p><strong>Formato CSV Receitas:</strong> Cabeçalho: <code>{CSV_RECIPE_HEADERS.join(',')}</code>. Ingredientes no formato "NomeIng1:Qtd1;NomeIng2:Qtd2".</p>
                    <p className="text-xs">Ex: nome,modo_preparo,"IngredienteA:100;IngredienteB:2",porcoes,tempo_preparo,dificuldade</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                 <h2 className="text-2xl font-semibold text-gray-700 mb-4">Histórico de Importações ({importBatches.length})</h2>
                 {importBatches.length === 0 ? <p className="text-gray-500">Nenhum arquivo importado anteriormente.</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {importBatches.map(batch => ( 
                                    <tr key={batch.id}>
                                        <td className="px-3 py-2 whitespace-nowrap truncate max-w-xs" title={batch.filename}>{batch.filename}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(batch.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{batch.type === 'ingredients' ? 'Ingredientes' : batch.type === 'recipes' ? 'Receitas' : 'Plano de Dieta'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{batch.successCount}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.errorCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {batch.errorCount > 0 ? `Completo com ${batch.errorCount} erros` : 'Completo'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {batch.type !== 'dietPlan' && batch.importedItemIds && batch.importedItemIds.length > 0 && (
                                                <Button variant="danger" size="sm" onClick={() => openDeleteBatchModal(batch)} aria-label={`Excluir lote ${batch.filename}`}>Excluir Lote</Button>
                                            )}
                                             {batch.type === 'dietPlan' && ( 
                                                <span className="text-xs text-gray-400 italic">S/A</span>
                                             )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
          </div>
        );
      default:
        return <p>Selecione uma opção.</p>;
    }
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-gray-800">Gerenciar Dados</h1>
        <p className="text-lg text-gray-600 mt-1">Adicione, edite ou importe seus ingredientes, receitas e conversões. Configure setores.</p>
      </header>
      
      <nav className="flex flex-wrap space-x-1 border-b border-gray-200" aria-label="Tabs">
        {TABS.map((tab) => ( 
          <button
            key={tab}
            onClick={() => updateView(tab)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap mb-[-1px]
              ${activeView.startsWith(tab) ? 'bg-emerald-500 text-white border border-emerald-500 border-b-white' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent'}
            `}
            aria-current={activeView.startsWith(tab) ? 'page' : undefined}
          >
            {tab === 'ingredients' ? 'Ingredientes' : 
             tab === 'recipes' ? 'Receitas' : 
             tab === 'sectors' ? 'Setores' : 
             tab === 'conversions' ? (<span className="flex items-center"><IconRefreshCw className="w-4 h-4 mr-1.5"/>Conversões</span>) :
             'Importar/Exportar'}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {renderActiveView()}
      </div>

      <BatchSectorUpdateModal 
        isOpen={showBatchSectorUpdateModal}
        onClose={() => setShowBatchSectorUpdateModal(false)}
        allIngredients={ingredients}
        allSectors={sectors}
        onUpdateSectors={handleBatchUpdateSectors}
        onAddSector={addSectorToData}
      />

      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Pré-visualização do CSV (Primeiras 10 linhas de dados)" size="xl">
        {previewData.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {Object.keys(previewData[0]).map(header => (
                                <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(row).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">{String(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : <p>Nenhum dado para pré-visualizar ou formato de CSV inválido.</p>}
         <div className="mt-4 text-right">
            <Button onClick={() => setShowPreviewModal(false)}>Fechar</Button>
        </div>
      </Modal>
      <Modal
        isOpen={showDeleteAllIngredientsModal}
        onClose={() => setShowDeleteAllIngredientsModal(false)}
        title="Confirmar Exclusão Total de Ingredientes"
      >
        <p>Tem certeza que deseja excluir TODOS os ingredientes? Esta ação é irreversível e removerá todos os ingredientes do sistema. Isso pode afetar receitas e planos de refeições existentes.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setShowDeleteAllIngredientsModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDeleteAllIngredients}>Excluir Tudo</Button>
        </div>
      </Modal>
      <Modal
        isOpen={showDeleteBatchModal}
        onClose={() => { setShowDeleteBatchModal(false); setBatchToDelete(null); }}
        title="Confirmar Exclusão do Lote de Importação"
      >
        {batchToDelete && (
            <p>
                Tem certeza que deseja excluir o lote de importação do arquivo "<strong>{batchToDelete.filename}</strong>"?
                Todos os <strong>{batchToDelete.successCount} {batchToDelete.type === 'ingredients' ? 'ingredientes' : 'receitas'}</strong>
                {' '}importados neste lote serão removidos. Esta ação é irreversível e pode afetar receitas ou planos de refeição que utilizam estes itens.
            </p>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => { setShowDeleteBatchModal(false); setBatchToDelete(null); }}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDeleteBatch}>Excluir Lote</Button>
        </div>
      </Modal>
    </div>
  );
}