import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { Ingredient, Recipe, RecipeIngredient, CsvIngredient, CsvRecipe, NutrientInfo, ImportBatch } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { UNITS_OF_MEASUREMENT, CSV_INGREDIENT_HEADERS, CSV_RECIPE_HEADERS, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL } from '../constants';
import { IconPlus, IconUpload, IconTrash, IconEdit, IconDownload, IconSearch, IconBook } from '../components/Icon';
import Papa from 'papaparse';

interface IngredientFormProps {
  initialIngredient?: Ingredient;
  onSubmit: (ingredient: Omit<Ingredient, 'id'> | Ingredient) => void;
  onCancel: () => void;
}

const nutrientFormFields: { key: keyof NutrientInfo; label: string; unit: string, step?: string }[] = [
    { key: 'Energia', label: 'Energia', unit: 'Kcal', step: "1" },
    { key: 'Proteína', label: 'Proteína', unit: 'g', step: "0.1" },
    { key: 'Carboidrato', label: 'Carboidrato', unit: 'g', step: "0.1" },
    { key: 'Lipídeos', label: 'Lipídeos', unit: 'g', step: "0.1" },
    { key: 'Colesterol', label: 'Colesterol', unit: 'mg', step: "1" },
    { key: 'FibraAlimentar', label: 'Fibra Alimentar', unit: 'g', step: "0.1" },
];

const IngredientForm: React.FC<IngredientFormProps> = ({ initialIngredient, onSubmit, onCancel }) => {
  const [ingredient, setIngredient] = useState<Omit<Ingredient, 'id' | keyof NutrientInfo> & Partial<NutrientInfo>>(
    initialIngredient || { name: '', unit: 'g', ...DEFAULT_NUTRIENT_INFO }
  );

  useEffect(() => {
    if (initialIngredient) {
        setIngredient(initialIngredient);
    } else {
        setIngredient({ name: '', unit: 'g', ...DEFAULT_NUTRIENT_INFO });
    }
  }, [initialIngredient]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNutrientField = nutrientFormFields.some(field => field.key === name);
    setIngredient(prev => ({ 
        ...prev, 
        [name]: isNutrientField ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient.name || !ingredient.unit) {
        alert("Nome e Unidade são obrigatórios.");
        return;
    }
    const fullIngredientData: Omit<Ingredient, 'id'> | Ingredient = {
        ...DEFAULT_NUTRIENT_INFO, 
        ...ingredient, 
    };
    if (initialIngredient && 'id' in initialIngredient) {
        (fullIngredientData as Ingredient).id = initialIngredient.id;
    }
    onSubmit(fullIngredientData as Omit<Ingredient, 'id'> | Ingredient);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <h3 className="text-xl font-semibold text-emerald-700 mb-3">
        {initialIngredient ? 'Editar Ingrediente' : 'Adicionar Novo Ingrediente'}
      </h3>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Ingrediente</label>
        <input type="text" name="name" id="name" value={ingredient.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
        <select name="unit" id="unit" value={ingredient.unit} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
          {UNITS_OF_MEASUREMENT.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Nutrientes devem ser informados por esta unidade (ou por 100g/100ml se aplicável).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nutrientFormFields.map(({ key, label, unit, step }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label} ({unit})</label>
            <input 
              type="number" 
              name={key} 
              id={key} 
              value={ingredient[key] || 0} 
              onChange={handleChange} 
              step={step || "0.1"} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialIngredient ? 'Salvar Alterações' : 'Adicionar Ingrediente'}</Button>
      </div>
    </form>
  );
};


interface RecipeFormProps {
  initialRecipe?: Recipe;
  onSubmit: (recipe: Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'> | Recipe) => void;
  onCancel: () => void;
  availableIngredients: Ingredient[];
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialRecipe, onSubmit, onCancel, availableIngredients }) => {
  const [recipe, setRecipe] = useState<Partial<Recipe>>(
    initialRecipe || { name: '', instructions: '', servings: 1, ingredients: [], imageUrl: '' }
  );

  const handleRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipe(prev => ({ ...prev, [name]: name === 'servings' ? parseInt(value) || 1 : value }));
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
    setRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: availableIngredients[0].id, quantity: 1 }]
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
    onSubmit(recipe as Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'> | Recipe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <h3 className="text-xl font-semibold text-emerald-700 mb-3">
        {initialRecipe ? 'Editar Receita' : 'Adicionar Nova Receita'}
      </h3>
      <div>
        <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700">Nome da Receita</label>
        <input type="text" name="name" id="recipeName" value={recipe.name || ''} onChange={handleRecipeChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Modo de Preparo</label>
        <textarea name="instructions" id="instructions" value={recipe.instructions || ''} onChange={handleRecipeChange} rows={5} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
      </div>
      <div>
        <label htmlFor="servings" className="block text-sm font-medium text-gray-700">Número de Porções</label>
        <input type="number" name="servings" id="servings" value={recipe.servings || 1} onChange={handleRecipeChange} min="1" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL da Imagem (Opcional)</label>
        <input type="url" name="imageUrl" id="imageUrl" value={recipe.imageUrl || ''} onChange={handleRecipeChange} placeholder={PLACEHOLDER_IMAGE_URL} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Ingredientes da Receita</h4>
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
                {availableIngredients.map(availIng => <option key={availIng.id} value={availIng.id}>{availIng.name}</option>)}
              </select>
            </div>
            <div className="w-1/4">
              <label htmlFor={`ing-qty-${index}`} className="block text-xs font-medium text-gray-600">Qtd.</label>
              <input
                type="number"
                id={`ing-qty-${index}`}
                value={ing.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                min="0.1" step="0.1"
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
        <Button type="submit">{initialRecipe ? 'Salvar Alterações' : 'Adicionar Receita'}</Button>
      </div>
    </form>
  );
};

export default function DataManagementPage(): React.ReactElement {
  const { 
    ingredients, recipes, addIngredient, updateIngredient, deleteIngredient, deleteAllIngredients,
    addRecipe, updateRecipe, deleteRecipe: deleteRecipeData, 
    importIngredients, importRecipes, getIngredientById, getRecipeById,
    importBatches, deleteImportBatch
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const TABS = ['ingredients', 'recipes', 'import'] as const;
  type ActiveViewType = typeof TABS[number] | 'addIngredient' | 'addRecipe' | 'editIngredient' | 'editRecipe';
  
  const [activeView, setActiveView] = useState<ActiveViewType>('ingredients');
  
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [showDeleteAllIngredientsModal, setShowDeleteAllIngredientsModal] = useState(false);
  const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ImportBatch | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'ingredients' | 'recipes'>('ingredients');
  const [importResults, setImportResults] = useState<{ successCount: number; errors: string[]; newIngredients?: string[] } | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  useEffect(() => {
    const viewParam = searchParams.get('view') as ActiveViewType | null;
    const editIngredientId = searchParams.get('editIngredient');
    const editRecipeId = searchParams.get('editRecipe');

    if (editIngredientId) {
      const ing = getIngredientById(editIngredientId);
      if (ing) {
        setEditingIngredient(ing);
        setActiveView('editIngredient');
      } else {
        updateView('ingredients'); 
      }
    } else if (editRecipeId) {
      const rec = getRecipeById(editRecipeId);
      if (rec) {
        setEditingRecipe(rec);
        setActiveView('editRecipe');
      } else {
        updateView('recipes');
      }
    } else if (viewParam && TABS.includes(viewParam as any)) {
      setActiveView(viewParam);
    } else if (viewParam && (viewParam === 'addIngredient' || viewParam === 'addRecipe')) {
      setActiveView(viewParam);
    } else if (!activeView.startsWith('edit') && !TABS.includes(activeView as any) && activeView !== 'addIngredient' && activeView !== 'addRecipe') {
        updateView('ingredients');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, getIngredientById, getRecipeById]);

  const updateView = (view: ActiveViewType, params?: Record<string, string>) => {
    const newParams = new URLSearchParams(); 
    newParams.set('view', view);
    if (params) {
        for (const key in params) {
            if (params[key]) newParams.set(key, params[key]);
        }
    }
    setSearchParams(newParams);
    setActiveView(view); // Also directly set active view to avoid lag from useEffect
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCsvFile(event.target.files[0]);
      setImportResults(null); 
      setPreviewData([]); 
    }
  };

  const handlePreviewCsv = async () => {
    if (!csvFile) {
        alert("Por favor, selecione um arquivo CSV.");
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
                    alert("Erro ao ler o CSV para pré-visualização: " + results.errors.map(err => err.message).join('\\n'));
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
      alert("Por favor, selecione um arquivo CSV.");
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
          if (results.errors.length > 0) {
            setImportResults({ successCount: 0, errors: results.errors.map(err => `Linha ${err.row}: ${err.message} (${err.code})`) });
            return;
          }
          if (importType === 'ingredients') {
            setImportResults(importIngredients(results.data as CsvIngredient[], currentFilename));
          } else {
            setImportResults(importRecipes(results.data as CsvRecipe[], currentFilename));
          }
          setCsvFile(null); 
          const fileInput = document.getElementById('csvFile') as HTMLInputElement | null;
          if (fileInput) {
            fileInput.value = ''; 
          }
        },
        error: (error: any) => {
            setImportResults({ successCount: 0, errors: [`Erro ao processar arquivo: ${error.message}`] });
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
  };

  const handleExportIngredients = () => {
    const dataToExport = ingredients.map(ing => ({
      nome: ing.name,
      unidade: ing.unit,
      energia_kcal: ing.Energia.toString(),
      proteina_g: ing.Proteína.toString(),
      carboidrato_g: ing.Carboidrato.toString(),
      lipideos_g: ing.Lipídeos.toString(),
      colesterol_mg: ing.Colesterol.toString(),
      fibra_alimentar_g: ing.FibraAlimentar.toString(),
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
      };
    });
    const csvString = Papa.unparse(dataToExport, { header: true, columns: CSV_RECIPE_HEADERS });
    downloadCSV(csvString, 'nutriplanner_receitas.csv');
  };

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const confirmDeleteAllIngredients = () => {
    deleteAllIngredients();
    setShowDeleteAllIngredientsModal(false);
  };

  const confirmDeleteBatch = () => {
    if (batchToDelete) {
      deleteImportBatch(batchToDelete.id);
    }
    setShowDeleteBatchModal(false);
    setBatchToDelete(null);
  };

  const openDeleteBatchModal = (batch: ImportBatch) => {
    setBatchToDelete(batch);
    setShowDeleteBatchModal(true);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'ingredients':
        return (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <h2 className="text-2xl font-semibold text-gray-700">Ingredientes Cadastrados ({filteredIngredients.length})</h2>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <Button onClick={() => updateView('addIngredient')} leftIcon={<IconPlus />}>Novo Ingrediente</Button>
                <Button onClick={handleExportIngredients} leftIcon={<IconDownload />} variant="ghost">Exportar CSV</Button>
                <Button onClick={() => setShowDeleteAllIngredientsModal(true)} leftIcon={<IconTrash />} variant="danger">Excluir Todos</Button>
              </div>
            </div>
             <div className="mb-4">
                <label htmlFor="ingredientSearch" className="sr-only">Buscar Ingredientes</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconSearch />
                    </div>
                    <input
                        type="search"
                        id="ingredientSearch"
                        placeholder="Buscar ingrediente pelo nome..."
                        value={ingredientSearchTerm}
                        onChange={(e) => setIngredientSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>
            {filteredIngredients.length === 0 ? <p className="text-gray-500">{ingredients.length > 0 ? 'Nenhum ingrediente encontrado com o termo buscado.' : 'Nenhum ingrediente cadastrado.'}</p> : (
              <ul className="space-y-3">
                {filteredIngredients.map(ing => (
                  <li key={ing.id} className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-emerald-600">{ing.name} <span className="text-sm text-gray-500">({ing.unit})</span></p>
                      <p className="text-xs text-gray-600">
                        E: {ing.Energia.toFixed(0)}Kcal, P: {ing.Proteína.toFixed(1)}g, C: {ing.Carboidrato.toFixed(1)}g, L: {ing.Lipídeos.toFixed(1)}g, Col: {ing.Colesterol.toFixed(0)}mg, FA: {ing.FibraAlimentar.toFixed(1)}g
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => updateView('editIngredient', { editIngredient: ing.id })} aria-label={`Editar ${ing.name}`}><IconEdit /></Button>
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
                <Button onClick={() => updateView('addRecipe')} leftIcon={<IconPlus />}>Nova Receita</Button>
                <Button onClick={handleExportRecipes} leftIcon={<IconDownload />} variant="ghost">Exportar CSV</Button>
              </div>
            </div>
            {sortedRecipes.length === 0 ? <p className="text-gray-500">Nenhuma receita cadastrada.</p> : (
              <ul className="space-y-3">
                {sortedRecipes.map(rec => (
                  <li key={rec.id} className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-emerald-600">{rec.name} <span className="text-sm text-gray-500">(Porções: {rec.servings})</span></p>
                       <p className="text-xs text-gray-500 truncate max-w-md" title={rec.ingredients.map(i => getIngredientById(i.ingredientId)?.name).join(', ')}>
                        Ingredientes: {rec.ingredients.map(i => getIngredientById(i.ingredientId)?.name || 'N/A').join(', ') || 'N/A'}
                      </p>
                    </div>
                     <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => updateView('editRecipe', { editRecipe: rec.id })} aria-label={`Editar ${rec.name}`}><IconEdit /></Button>
                      <Button variant="danger" size="sm" onClick={() => { if(confirm(`Excluir "${rec.name}"? Esta ação não pode ser desfeita.`)) deleteRecipeData(rec.id); }} aria-label={`Excluir ${rec.name}`}><IconTrash /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'addIngredient':
        return <IngredientForm onSubmit={(data) => { addIngredient(data as Omit<Ingredient, 'id'>); updateView('ingredients'); }} onCancel={() => updateView('ingredients')} />;
      case 'editIngredient':
        return editingIngredient ? <IngredientForm initialIngredient={editingIngredient} onSubmit={(data) => { updateIngredient(data as Ingredient); updateView('ingredients'); }} onCancel={() => updateView('ingredients')} /> : <p>Carregando ingrediente...</p>;
      case 'addRecipe':
        return <RecipeForm availableIngredients={ingredients} onSubmit={(data) => { addRecipe(data as Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'>); updateView('recipes'); }} onCancel={() => updateView('recipes')} />;
      case 'editRecipe':
        return editingRecipe ? <RecipeForm initialRecipe={editingRecipe} availableIngredients={ingredients} onSubmit={(data) => { updateRecipe(data as Recipe); updateView('recipes');}} onCancel={() => updateView('recipes')} /> : <p>Carregando receita...</p>;
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
                {importResults && (
                <div className={`mt-4 p-4 rounded-md ${importResults.errors.length > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    <p className="font-semibold">Resultado da Importação:</p>
                    <p>Sucesso: {importResults.successCount} item(s) importado(s).</p>
                    {importResults.errors.length > 0 && (
                    <div>
                        <p>Erros ({importResults.errors.length}):</p>
                        <ul className="list-disc list-inside text-sm max-h-40 overflow-y-auto">
                        {importResults.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                    )}
                    {importResults.newIngredients && importResults.newIngredients.length > 0 && (
                    <div className="mt-2">
                        <p className="font-semibold">Novos Ingredientes Criados (com valores padrão, por favor revise):</p>
                        <ul className="list-disc list-inside text-sm">
                        {importResults.newIngredients.map((name, i) => <li key={i}>{name}</li>)}
                        </ul>
                    </div>
                    )}
                </div>
                )}
                <div className="text-sm text-gray-600 space-y-2 mt-4">
                    <p><strong>Formato CSV Ingredientes:</strong> Cabeçalho: <code>{CSV_INGREDIENT_HEADERS.join(',')}</code></p>
                    <p className="text-xs">Ex: nome,unidade,energia_kcal,proteina_g,carboidrato_g,lipideos_g,colesterol_mg,fibra_alimentar_g</p>
                    <p><strong>Formato CSV Receitas:</strong> Cabeçalho: <code>{CSV_RECIPE_HEADERS.join(',')}</code>. Ingredientes no formato "NomeIng1:Qtd1;NomeIng2:Qtd2".</p>
                    <p className="text-xs">Ex: nome,modo_preparo,"IngredienteA:100;IngredienteB:2",porcoes</p>
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
                                {importBatches.slice().reverse().map(batch => ( 
                                    <tr key={batch.id}>
                                        <td className="px-3 py-2 whitespace-nowrap truncate max-w-xs" title={batch.filename}>{batch.filename}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(batch.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{batch.type === 'ingredients' ? 'Ingredientes' : 'Receitas'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{batch.successCount}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.errorCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {batch.errorCount > 0 ? `Completo com ${batch.errorCount} erros` : 'Completo'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <Button variant="danger" size="sm" onClick={() => openDeleteBatchModal(batch)} aria-label={`Excluir lote ${batch.filename}`}>Excluir Lote</Button>
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
        <p className="text-lg text-gray-600 mt-1">Adicione, edite ou importe seus ingredientes e receitas.</p>
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
            {tab === 'ingredients' ? 'Ingredientes' : tab === 'recipes' ? 'Receitas' : 'Importar/Exportar'}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {renderActiveView()}
      </div>

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