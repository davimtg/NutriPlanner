import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    Ingredient, Recipe, DailyPlan, MealType, PlannedItem, ShoppingListItem, DataContextType, 
    CsvIngredient, CsvRecipe, RecipeIngredient, NutrientInfo, ImportBatch,
    SavedDietPlan, CsvDietPlanItem, ManualShoppingListItem, ShoppingListTemplate, UserUnitConversion
} from '../types';
import { generateId } from '../utils/idGenerator';
import { calculateRecipeNutrients, calculateMealNutrients, calculateDailyPlanNutrients, calculatePlannedItemNutrients } from '../utils/nutritionCalculator';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL, CSV_DIET_PLAN_HEADERS, UNITS_OF_MEASUREMENT } from '../constants';
import Papa from 'papaparse';

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialIngredients: Ingredient[] = [
    { id: generateId(), name: 'Maçã Fuji', unit: 'unidade', setor: 'Hortifruti', Energia: 95, Proteína: 0.5, Carboidrato: 25, Lipídeos: 0.3, Colesterol: 0, FibraAlimentar: 4.4, brand: 'Genérica', averagePrice: 1.5, purchaseLocation: 'Supermercado Local' },
    { id: generateId(), name: 'Banana Prata', unit: 'unidade', setor: 'Hortifruti', Energia: 105, Proteína: 1.3, Carboidrato: 27, Lipídeos: 0.4, Colesterol: 0, FibraAlimentar: 3.1, averagePrice: 0.8 },
    { id: generateId(), name: 'Peito de Frango Grelhado', unit: '100g', setor: 'Açougue', Energia: 165, Proteína: 31, Carboidrato: 0, Lipídeos: 3.6, Colesterol: 85, FibraAlimentar: 0, brand: 'Sadia', averagePrice: 2.5, purchaseLocation: 'Açougue da Esquina' },
    { id: generateId(), name: 'Arroz Integral Cozido', unit: '100g', setor: 'Mercearia', Energia: 111, Proteína: 2.6, Carboidrato: 23, Lipídeos: 0.9, Colesterol: 0, FibraAlimentar: 1.8 },
    { id: generateId(), name: 'Ovo Cozido', unit: 'unidade', setor: 'Hortifruti', Energia: 78, Proteína: 6.3, Carboidrato: 0.6, Lipídeos: 5.3, Colesterol: 186, FibraAlimentar: 0, averagePrice: 0.5 },
    { id: generateId(), name: 'Arroz Branco', unit: '100g', setor: 'Mercearia', Energia: 130, Proteína: 2.7, Carboidrato: 28, Lipídeos: 0.3, Colesterol: 0, FibraAlimentar: 0.4 },
];

const initialRecipes: Recipe[] = []; 
const initialSectors: string[] = ['Hortifruti', 'Açougue', 'Mercearia', 'Laticínios', 'Padaria', 'Congelados', 'Bebidas', 'Grãos', 'Outros'];
const initialShoppingListTemplates: ShoppingListTemplate[] = [];
const initialUserConversions: UserUnitConversion[] = [];
const initialSectorKeywordFrequency: Record<string, Record<string, number>> = {};


// Helper function to extract keywords from ingredient name
const extractKeywords = (name: string): string[] => {
  if (!name) return [];
  // Simple split by space, lowercase. Could be more sophisticated.
  // Filter out very short words or common words if needed.
  return name.toLowerCase().split(/\s+/).filter(kw => kw.length > 2);
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const localData = localStorage.getItem('nutriplanner_ingredients');
    return localData ? JSON.parse(localData) : initialIngredients;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const localData = localStorage.getItem('nutriplanner_recipes');
    return localData ? JSON.parse(localData) : initialRecipes;
  });

  const [mealPlan, setMealPlan] = useState<DailyPlan[]>(() => {
    const localData = localStorage.getItem('nutriplanner_mealPlan');
    return localData ? JSON.parse(localData) : [];
  });

  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => {
    const localData = localStorage.getItem('nutriplanner_importBatches');
    return localData ? JSON.parse(localData) : [];
  });

  const [savedDietPlans, setSavedDietPlans] = useState<SavedDietPlan[]>(() => {
    const localData = localStorage.getItem('nutriplanner_savedDietPlans');
    return localData ? JSON.parse(localData) : [];
  });

  const [globalTargetNutrients, setGlobalTargetNutrients] = useState<NutrientInfo>(() => {
    const localData = localStorage.getItem('nutriplanner_globalTargetNutrients');
    return localData ? JSON.parse(localData) : { Energia: 2000, Proteína: 100, Carboidrato: 250, Lipídeos: 70, Colesterol: 300, FibraAlimentar: 30 };
  });
  
  const [sectors, setSectors] = useState<string[]>(() => {
    const localData = localStorage.getItem('nutriplanner_sectors');
    return localData ? JSON.parse(localData) : initialSectors;
  });

  const [shoppingListTemplates, setShoppingListTemplates] = useState<ShoppingListTemplate[]>(() => {
    const localData = localStorage.getItem('nutriplanner_shoppingListTemplates');
    return localData ? JSON.parse(localData) : initialShoppingListTemplates;
  });

  const [userConversions, setUserConversions] = useState<UserUnitConversion[]>(() => {
    const localData = localStorage.getItem('nutriplanner_userConversions');
    return localData ? JSON.parse(localData) : initialUserConversions;
  });

  const [sectorKeywordFrequency, setSectorKeywordFrequency] = useState<Record<string, Record<string, number>>>(() => {
    const localData = localStorage.getItem('nutriplanner_sectorKeywordFrequency');
    return localData ? JSON.parse(localData) : initialSectorKeywordFrequency;
  });


  useEffect(() => { localStorage.setItem('nutriplanner_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('nutriplanner_recipes', JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem('nutriplanner_mealPlan', JSON.stringify(mealPlan)); }, [mealPlan]);
  useEffect(() => { localStorage.setItem('nutriplanner_importBatches', JSON.stringify(importBatches)); }, [importBatches]);
  useEffect(() => { localStorage.setItem('nutriplanner_savedDietPlans', JSON.stringify(savedDietPlans)); }, [savedDietPlans]);
  useEffect(() => { localStorage.setItem('nutriplanner_globalTargetNutrients', JSON.stringify(globalTargetNutrients)); }, [globalTargetNutrients]);
  useEffect(() => { localStorage.setItem('nutriplanner_sectors', JSON.stringify(sectors)); }, [sectors]);
  useEffect(() => { localStorage.setItem('nutriplanner_shoppingListTemplates', JSON.stringify(shoppingListTemplates)); }, [shoppingListTemplates]);
  useEffect(() => { localStorage.setItem('nutriplanner_userConversions', JSON.stringify(userConversions)); }, [userConversions]);
  useEffect(() => { localStorage.setItem('nutriplanner_sectorKeywordFrequency', JSON.stringify(sectorKeywordFrequency)); }, [sectorKeywordFrequency]);


  const getIngredientById = useCallback((id: string) => ingredients.find(ing => ing.id === id), [ingredients]);
  const getRecipeById = useCallback((id: string) => recipes.find(rec => rec.id === id), [recipes]);

  const updateSectorKeywordFrequencyInternal = useCallback((ingredientName: string, sector: string) => {
    if (!sector || sector === 'Outros' || !ingredientName) return;
    const keywords = extractKeywords(ingredientName);
    
    setSectorKeywordFrequency(prevFrequencies => {
        const newFrequencies = JSON.parse(JSON.stringify(prevFrequencies)); // Deep copy
        keywords.forEach(kw => {
            if (!newFrequencies[kw]) {
                newFrequencies[kw] = {};
            }
            newFrequencies[kw][sector] = (newFrequencies[kw][sector] || 0) + 1;
        });
        return newFrequencies;
    });
  }, []);

  const addIngredient = useCallback((ingredientData: Omit<Ingredient, 'id'>): Ingredient => {
    const newIngredient: Ingredient = { 
        ...DEFAULT_NUTRIENT_INFO, 
        ...ingredientData, 
        id: generateId(),
        setor: ingredientData.setor || 'Outros',
        averagePrice: ingredientData.averagePrice,
        purchaseLocation: ingredientData.purchaseLocation,
    };
    setIngredients(prev => [...prev, newIngredient]);
    if (newIngredient.setor && !sectors.includes(newIngredient.setor)) {
      setSectors(prevSectors => [...prevSectors, newIngredient.setor!].sort());
    }
    updateSectorKeywordFrequencyInternal(newIngredient.name, newIngredient.setor);
    return newIngredient;
  }, [sectors, updateSectorKeywordFrequencyInternal]);

  const updateIngredient = useCallback((updatedIngredient: Ingredient) => {
    setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? { ...updatedIngredient, setor: updatedIngredient.setor || 'Outros' } : ing));
     if (updatedIngredient.setor && !sectors.includes(updatedIngredient.setor)) {
      setSectors(prevSectors => [...prevSectors, updatedIngredient.setor!].sort());
    }
    updateSectorKeywordFrequencyInternal(updatedIngredient.name, updatedIngredient.setor || 'Outros');
  }, [sectors, updateSectorKeywordFrequencyInternal]);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    // Note: Could also decrement/remove from sectorKeywordFrequency, but might be complex for now.
  }, []);
  
  const deleteAllIngredients = useCallback(() => {
    setIngredients([]);
    setSectorKeywordFrequency({}); // Clear learned frequencies
  }, []);

  const updateIngredientsSectorBatch = useCallback((ingredientIds: string[], newSector: string) => {
    setIngredients(prevIngredients => 
        prevIngredients.map(ing => {
            if (ingredientIds.includes(ing.id)) {
                updateSectorKeywordFrequencyInternal(ing.name, newSector);
                return { ...ing, setor: newSector };
            }
            return ing;
        })
    );
    if (newSector && !sectors.includes(newSector)) {
        setSectors(prevSectors => [...prevSectors, newSector].sort());
    }
  }, [sectors, updateSectorKeywordFrequencyInternal]);

  const addRecipe = useCallback((recipeData: Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'>): Recipe => {
    const totalNutrients = calculateRecipeNutrients(recipeData.ingredients, getIngredientById);
    const nutrientsPerServing: NutrientInfo = recipeData.servings > 0 ? {
        Energia: totalNutrients.Energia / recipeData.servings,
        Proteína: totalNutrients.Proteína / recipeData.servings,
        Carboidrato: totalNutrients.Carboidrato / recipeData.servings,
        Lipídeos: totalNutrients.Lipídeos / recipeData.servings,
        Colesterol: totalNutrients.Colesterol / recipeData.servings,
        FibraAlimentar: totalNutrients.FibraAlimentar / recipeData.servings,
    } : { ...DEFAULT_NUTRIENT_INFO };

    const newRecipe: Recipe = {
      ...recipeData,
      id: generateId(),
      ...nutrientsPerServing, 
      totalNutrients: totalNutrients, 
      imageUrl: recipeData.imageUrl || `${PLACEHOLDER_IMAGE_URL}?=${generateId()}`,
      difficulty: recipeData.difficulty,
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  }, [getIngredientById]);

  const updateRecipe = useCallback((updatedRecipeData: Recipe) => {
    const totalNutrients = calculateRecipeNutrients(updatedRecipeData.ingredients, getIngredientById);
    const nutrientsPerServing: NutrientInfo = updatedRecipeData.servings > 0 ? {
        Energia: totalNutrients.Energia / updatedRecipeData.servings,
        Proteína: totalNutrients.Proteína / updatedRecipeData.servings,
        Carboidrato: totalNutrients.Carboidrato / updatedRecipeData.servings,
        Lipídeos: totalNutrients.Lipídeos / updatedRecipeData.servings,
        Colesterol: totalNutrients.Colesterol / updatedRecipeData.servings,
        FibraAlimentar: totalNutrients.FibraAlimentar / updatedRecipeData.servings,
    } : { ...DEFAULT_NUTRIENT_INFO };

    const fullyUpdatedRecipe: Recipe = {
        ...updatedRecipeData,
        ...nutrientsPerServing,
        totalNutrients: totalNutrients,
    };
    setRecipes(prev => prev.map(rec => rec.id === fullyUpdatedRecipe.id ? fullyUpdatedRecipe : rec));
  }, [getIngredientById]);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(rec => rec.id !== id));
  }, []);

  const getDailyPlan = useCallback((date: string): DailyPlan | undefined => {
    const plan = mealPlan.find(p => p.date === date);
    if (plan) {
        const updatedMeals = plan.meals.map(meal => ({
            ...meal,
            totalNutrients: calculateMealNutrients(meal, getIngredientById, getRecipeById)
        }));
        const totalNutrients = calculateDailyPlanNutrients({...plan, meals: updatedMeals}, getIngredientById, getRecipeById);
        return {...plan, meals: updatedMeals, totalNutrients };
    }
    const newPlan: DailyPlan = {
        date,
        meals: MEAL_TYPES_ORDERED.map(mealType => ({ mealType, items: [], totalNutrients: {...DEFAULT_NUTRIENT_INFO} })),
        totalNutrients: {...DEFAULT_NUTRIENT_INFO}
    };
    return newPlan;
  }, [mealPlan, getIngredientById, getRecipeById]);

  const updateDailyPlan = useCallback((plan: DailyPlan) => {
    const updatedMeals = plan.meals.map(meal => ({
        ...meal,
        totalNutrients: calculateMealNutrients(meal, getIngredientById, getRecipeById)
    }));
    const planWithNutrients: DailyPlan = {
        ...plan,
        meals: updatedMeals,
        totalNutrients: calculateDailyPlanNutrients({...plan, meals: updatedMeals}, getIngredientById, getRecipeById)
    };

    setMealPlan(prev => {
      const existingPlanIndex = prev.findIndex(p => p.date === planWithNutrients.date);
      if (existingPlanIndex > -1) {
        const newMealPlan = [...prev];
        newMealPlan[existingPlanIndex] = planWithNutrients;
        return newMealPlan;
      }
      return [...prev, planWithNutrients].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }, [getIngredientById, getRecipeById]);

  const addItemToMeal = useCallback((date: string, mealType: MealType, itemData: Omit<PlannedItem, 'id'>) => {
    const plan = getDailyPlan(date) || { date, meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [] })), totalNutrients: {...DEFAULT_NUTRIENT_INFO} };
    const mealIndex = plan.meals.findIndex(m => m.mealType === mealType);
    if (mealIndex === -1) return; 

    const newItem: PlannedItem = { ...itemData, id: generateId() };
    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      items: [...updatedMeals[mealIndex].items, newItem],
    };
    updateDailyPlan({ ...plan, meals: updatedMeals });
  }, [getDailyPlan, updateDailyPlan]);

  const removeItemFromMeal = useCallback((date: string, mealType: MealType, plannedItemId: string) => {
    const plan = getDailyPlan(date);
    if (!plan) return;
    const mealIndex = plan.meals.findIndex(m => m.mealType === mealType);
    if (mealIndex === -1) return;

    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      items: updatedMeals[mealIndex].items.filter(item => item.id !== plannedItemId),
    };
    updateDailyPlan({ ...plan, meals: updatedMeals });
  }, [getDailyPlan, updateDailyPlan]);

  const updateItemInMeal = useCallback((date: string, mealType: MealType, updatedItem: PlannedItem) => {
    const plan = getDailyPlan(date);
    if (!plan) return;
    const mealIndex = plan.meals.findIndex(m => m.mealType === mealType);
    if (mealIndex === -1) return;

    const updatedMeals = [...plan.meals];
    updatedMeals[mealIndex] = {
        ...updatedMeals[mealIndex],
        items: updatedMeals[mealIndex].items.map(item => item.id === updatedItem.id ? updatedItem : item)
    };
    updateDailyPlan({...plan, meals: updatedMeals});
  }, [getDailyPlan, updateDailyPlan]);


  const convertItemUnit = useCallback((
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientId: string,
    conversions: UserUnitConversion[]
  ): { newQuantity: number; success: boolean } => {
    if (fromUnit === toUnit) return { newQuantity: quantity, success: true };

    // Handle g/kg and ml/l directly
    if (fromUnit === 'g' && toUnit === 'kg') return { newQuantity: quantity / 1000, success: true };
    if (fromUnit === 'kg' && toUnit === 'g') return { newQuantity: quantity * 1000, success: true };
    if (fromUnit === '100g' && toUnit === 'g') return { newQuantity: quantity, success: true }; // 100g is a base for nutrients, effectively 'g' for quantity
    if (fromUnit === 'g' && toUnit === '100g') return { newQuantity: quantity, success: true }; // treat as same

    if (fromUnit === 'ml' && toUnit === 'l') return { newQuantity: quantity / 1000, success: true };
    if (fromUnit === 'l' && toUnit === 'ml') return { newQuantity: quantity * 1000, success: true };
    if (fromUnit === '100ml' && toUnit === 'ml') return { newQuantity: quantity, success: true };
    if (fromUnit === 'ml' && toUnit === '100ml') return { newQuantity: quantity, success: true };


    const relevantConversions = conversions.filter(c => c.ingredientId === ingredientId);
    for (const conv of relevantConversions) {
      if (conv.unitA === fromUnit && conv.unitB === toUnit && conv.quantityA !== 0) {
        return { newQuantity: quantity * (conv.quantityB / conv.quantityA), success: true };
      }
      if (conv.unitB === fromUnit && conv.unitA === toUnit && conv.quantityB !== 0) {
        return { newQuantity: quantity * (conv.quantityA / conv.quantityB), success: true };
      }
    }

    return { newQuantity: quantity, success: false }; // No conversion found
  }, []);

  const getShoppingList = useCallback((startDate: string, endDate: string): ShoppingListItem[] => {
    const itemsToProcess: Array<{ ingredientId: string, quantity: number, unit: string, originalItemUnit: string }> = [];
    const start = new Date(startDate + 'T00:00:00'); 
    const end = new Date(endDate + 'T23:59:59');

    mealPlan.filter(dp => {
        const planDate = new Date(dp.date + 'T00:00:00');
        return planDate >= start && planDate <= end;
    }).forEach(dailyPlan => {
        dailyPlan.meals.forEach(meal => {
          meal.items.forEach(item => {
            if (item.type === 'ingredient') {
              const ingredient = getIngredientById(item.itemId);
              if (ingredient) {
                itemsToProcess.push({ ingredientId: ingredient.id, quantity: item.quantity, unit: ingredient.unit, originalItemUnit: ingredient.unit });
              }
            } else if (item.type === 'recipe') {
              const recipe = getRecipeById(item.itemId);
              if (recipe && recipe.servings > 0) {
                recipe.ingredients.forEach(recipeIng => {
                  const ingredient = getIngredientById(recipeIng.ingredientId);
                  if (ingredient) {
                    const quantityNeeded = (recipeIng.quantity / recipe.servings) * item.quantity;
                    itemsToProcess.push({ ingredientId: ingredient.id, quantity: quantityNeeded, unit: ingredient.unit, originalItemUnit: ingredient.unit });
                  }
                });
              }
            }
          });
        });
    });
    
    const consolidated: { [key: string]: { // key is ingredientId + "_" + finalUnit
        ingredientId: string;
        ingredientName: string;
        totalQuantity: number;
        unit: string; // This will be the *final* unit after conversion attempts
        purchased: boolean;
        category?: string;
      }} = {};

    itemsToProcess.forEach(itemEntry => {
        const ingredient = getIngredientById(itemEntry.ingredientId);
        if (!ingredient) return;

        let targetUnit = ingredient.unit; 
        const weightUnits = ['g', 'kg', '100g'];
        const volumeUnits = ['ml', 'l', '100ml'];

        if (weightUnits.includes(ingredient.unit)) targetUnit = 'g';
        else if (volumeUnits.includes(ingredient.unit)) targetUnit = 'ml';
        // If ingredient.unit is 'unidade', 'xicara', etc., targetUnit remains ingredient.unit (unless itemEntry.unit is different and convertible)

        let currentQuantity = itemEntry.quantity;
        let currentUnit = itemEntry.unit; // The unit of the item as it comes from plan (could be different from ingredient.unit if recipe ing had a specific unit, though current setup uses ingredient.unit)

        // If the item's unit itself is a base unit, prioritize that as target
        if (weightUnits.includes(currentUnit)) targetUnit = 'g';
        else if (volumeUnits.includes(currentUnit)) targetUnit = 'ml';
        
        const conversionResult = convertItemUnit(
            currentQuantity,
            currentUnit,
            targetUnit,
            ingredient.id,
            userConversions
        );

        if (conversionResult.success) {
            currentQuantity = conversionResult.newQuantity;
            currentUnit = targetUnit; 
        }
        // If conversion failed, currentQuantity and currentUnit remain as they were from itemEntry.
        // The key will then correctly group unconvertible units separately.

        const key = `${ingredient.id}_${currentUnit}`;

        if (consolidated[key]) {
            consolidated[key].totalQuantity += currentQuantity;
        } else {
            consolidated[key] = {
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                totalQuantity: currentQuantity,
                unit: currentUnit,
                purchased: false,
                category: ingredient.setor || 'Outros',
            };
        }
    });
    return Object.values(consolidated);
  }, [mealPlan, getIngredientById, getRecipeById, userConversions, convertItemUnit]);

  const importIngredients = useCallback((ingredientsData: CsvIngredient[], filename: string): ImportBatch => {
    let successCount = 0;
    const errors: string[] = [];
    const newIngredientsForState: Ingredient[] = [];
    const importedItemIds: string[] = [];

    ingredientsData.forEach((csvIng, index) => {
      if (!csvIng.nome || !csvIng.unidade) {
        errors.push(`Linha ${index + 2}: Nome e Unidade são obrigatórios.`);
        return;
      }
      try {
        const newId = generateId();
        const ingredient: Omit<Ingredient, 'id'> = {
          name: csvIng.nome.trim(),
          unit: csvIng.unidade.trim(),
          setor: csvIng.setor?.trim() || 'Outros',
          brand: csvIng.marca?.trim(),
          Energia: parseFloat(csvIng.energia_kcal) || 0,
          Proteína: parseFloat(csvIng.proteina_g) || 0,
          Carboidrato: parseFloat(csvIng.carboidrato_g) || 0,
          Lipídeos: parseFloat(csvIng.lipideos_g) || 0,
          Colesterol: parseFloat(csvIng.colesterol_mg) || 0,
          FibraAlimentar: parseFloat(csvIng.fibra_alimentar_g) || 0,
          averagePrice: csvIng.preco_medio ? parseFloat(csvIng.preco_medio) : undefined,
          purchaseLocation: csvIng.local_compra?.trim() || undefined,
        };
        newIngredientsForState.push({ ...DEFAULT_NUTRIENT_INFO, ...ingredient, id: newId });
        importedItemIds.push(newId);
        successCount++;
        if (ingredient.setor && !sectors.includes(ingredient.setor)) {
          setSectors(prev => [...prev, ingredient.setor!].sort());
        }
        updateSectorKeywordFrequencyInternal(ingredient.name, ingredient.setor || 'Outros');
      } catch (e) {
        errors.push(`Linha ${index + 2}: Erro ao processar dados - ${(e as Error).message}`);
      }
    });
    setIngredients(prev => [...prev, ...newIngredientsForState]);
    const newBatch: ImportBatch = { id: generateId(), filename, date: new Date().toISOString(), type: 'ingredients', successCount, errorCount: errors.length, importedItemIds, errors: errors.length > 0 ? errors : undefined };
    setImportBatches(prev => [newBatch, ...prev]);
    return newBatch;
  }, [sectors, updateSectorKeywordFrequencyInternal]);
  
  const importRecipes = useCallback((recipesData: CsvRecipe[], filename: string): ImportBatch => {
    let successCount = 0;
    const errors: string[] = [];
    const newRecipesForState: Recipe[] = [];
    const importedItemIds: string[] = [];
    const tempCreatedIngredientNames: string[] = []; 

    recipesData.forEach((csvRec, index) => {
      if (!csvRec.nome || !csvRec.ingredientes || !csvRec.porcoes) {
        errors.push(`Linha ${index + 2}: Nome, Ingredientes e Porções são obrigatórios.`);
        return;
      }
      try {
        const recipeIngredients: RecipeIngredient[] = [];
        const ingredientStrings = csvRec.ingredientes.split(';').map(s => s.trim()).filter(s => s);
        let ingredientParsingError = false;
        
        for (const ingStr of ingredientStrings) {
          const parts = ingStr.split(':');
          if (parts.length !== 2) { errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Formato de ingrediente inválido '${ingStr}'. Use 'NomeIngrediente:Quantidade'.`); ingredientParsingError = true; continue; }
          const ingName = parts[0].trim();
          const quantity = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
          if (isNaN(quantity)) { errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Quantidade inválida para '${ingName}'.`); ingredientParsingError = true; continue; }
          let ingredient = ingredients.find(i => i.name.toLowerCase() === ingName.toLowerCase());
          if (!ingredient) { 
              const newTempIng = addIngredient({ name: ingName, unit: 'unidade', setor: 'Outros', ...DEFAULT_NUTRIENT_INFO }); 
              ingredient = newTempIng; 
              tempCreatedIngredientNames.push(ingName);
            }
          recipeIngredients.push({ ingredientId: ingredient.id, quantity });
        }
        if (ingredientParsingError) return; 
        const servings = parseInt(csvRec.porcoes, 10);
        if (isNaN(servings) || servings <= 0) { errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Número de porções inválido.`); return; }
        const totalNutrients = calculateRecipeNutrients(recipeIngredients, getIngredientById); 
        const nutrientsPerServing: NutrientInfo = servings > 0 ? { Energia: totalNutrients.Energia / servings, Proteína: totalNutrients.Proteína / servings, Carboidrato: totalNutrients.Carboidrato / servings, Lipídeos: totalNutrients.Lipídeos / servings, Colesterol: totalNutrients.Colesterol / servings, FibraAlimentar: totalNutrients.FibraAlimentar / servings, } : { ...DEFAULT_NUTRIENT_INFO };
        const newRecipeId = generateId();
        const newRecipe: Recipe = { 
            id: newRecipeId, 
            name: csvRec.nome.trim(), 
            instructions: csvRec.modo_preparo.trim(), 
            servings: servings, 
            ingredients: recipeIngredients, 
            imageUrl: `${PLACEHOLDER_IMAGE_URL}?id=${newRecipeId}`, 
            prepTime: csvRec.tempo_preparo?.trim(),
            difficulty: csvRec.dificuldade?.trim() as Recipe['difficulty'] || undefined,
            ...nutrientsPerServing, 
            totalNutrients: totalNutrients 
        };
        newRecipesForState.push(newRecipe);
        importedItemIds.push(newRecipeId);
        successCount++;
      } catch (e) { errors.push(`Linha ${index + 2}: Erro ao processar receita '${csvRec.nome}' - ${(e as Error).message}`); }
    });
    setRecipes(prev => [...prev, ...newRecipesForState]);
    let batchMessage = undefined;
    if (tempCreatedIngredientNames.length > 0) {
        batchMessage = `Ingredientes criados automaticamente (com valores padrão, por favor revise): ${[...new Set(tempCreatedIngredientNames)].join(', ')}`;
    }
    const newBatch: ImportBatch = { id: generateId(), filename, date: new Date().toISOString(), type: 'recipes', successCount, errorCount: errors.length, importedItemIds, errors: errors.length > 0 ? errors : undefined, message: batchMessage };
    setImportBatches(prev => [newBatch, ...prev]);
    return newBatch;
  }, [ingredients, addIngredient, getIngredientById]);

  const deleteImportBatch = useCallback((batchId: string) => {
    const batchToDelete = importBatches.find(b => b.id === batchId);
    if (!batchToDelete || !batchToDelete.importedItemIds) return; 
    if (batchToDelete.type === 'ingredients') { setIngredients(prevIngs => prevIngs.filter(ing => !batchToDelete.importedItemIds!.includes(ing.id))); } 
    else if (batchToDelete.type === 'recipes') { setRecipes(prevRecs => prevRecs.filter(rec => !batchToDelete.importedItemIds!.includes(rec.id)));}
    setImportBatches(prevBatches => prevBatches.filter(b => b.id !== batchId));
  }, [importBatches]);

  const updateGlobalTargetNutrients = useCallback((targets: NutrientInfo) => {
    setGlobalTargetNutrients(targets);
  }, []);

  const exportDietToCsv = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const dietItemsForCsv: CsvDietPlanItem[] = [];

    mealPlan
      .filter(dp => {
        const planDate = new Date(dp.date + 'T00:00:00');
        return planDate >= start && planDate <= end;
      })
      .forEach(dailyPlan => {
        dailyPlan.meals.forEach(meal => {
          meal.items.forEach(item => {
            const baseItem = item.type === 'ingredient' ? getIngredientById(item.itemId) : getRecipeById(item.itemId);
            const itemNutrients = calculatePlannedItemNutrients(item, getIngredientById, getRecipeById);
            const unit = item.type === 'ingredient' ? (baseItem as Ingredient)?.unit : 'porção(ões)';
            
            dietItemsForCsv.push({
              date: dailyPlan.date,
              mealType: meal.mealType,
              itemType: item.type,
              itemId: item.itemId,
              itemName: baseItem?.name || 'Desconhecido',
              quantity: item.quantity,
              unit: unit,
              customName: item.customName || '',
              energia_kcal: itemNutrients.Energia,
              proteina_g: itemNutrients.Proteína,
              carboidrato_g: itemNutrients.Carboidrato,
              lipideos_g: itemNutrients.Lipídeos,
              colesterol_mg: itemNutrients.Colesterol,
              fibra_alimentar_g: itemNutrients.FibraAlimentar,
            });
          });
        });
      });
      return Papa.unparse(dietItemsForCsv, { header: true, columns: CSV_DIET_PLAN_HEADERS });
  }, [mealPlan, getIngredientById, getRecipeById]);

  const importDietFromCsv = useCallback((csvDietItems: CsvDietPlanItem[], strategy: 'replace' | 'merge', filename: string): ImportBatch => {
    if (!csvDietItems || csvDietItems.length === 0) {
        const batchError: ImportBatch = {id: generateId(), filename, date: new Date().toISOString(), type: 'dietPlan', successCount:0, errorCount: 1, message: "Nenhum item válido encontrado no CSV."};
        setImportBatches(prev => [batchError, ...prev]);
        return batchError;
    }
    
    const plansByDate: { [date: string]: DailyPlan } = {};
    let itemsProcessed = 0;
    const importErrors: string[] = [];

    for (const csvItem of csvDietItems) {
        if (!csvItem.date || !csvItem.mealType || !csvItem.itemType || !csvItem.itemId || !csvItem.itemName || csvItem.quantity == null) {
            importErrors.push(`Item CSV inválido ou incompleto: ${JSON.stringify(csvItem)}`);
            continue; 
        }

        let baseItemExists = false;
        let actualItemId = csvItem.itemId;

        if (csvItem.itemType === 'ingredient') {
            const ingById = getIngredientById(csvItem.itemId);
            const ingByName = ingredients.find(i => i.name.toLowerCase() === csvItem.itemName.toLowerCase());
            if (ingById) { baseItemExists = true; actualItemId = ingById.id;}
            else if (ingByName) { baseItemExists = true; actualItemId = ingByName.id;}
        } else { 
            const recById = getRecipeById(csvItem.itemId);
            const recByName = recipes.find(r => r.name.toLowerCase() === csvItem.itemName.toLowerCase());
            if (recById) { baseItemExists = true; actualItemId = recById.id;}
            else if (recByName) { baseItemExists = true; actualItemId = recByName.id;}
        }
        
        if (!baseItemExists) {
            importErrors.push(`Item base "${csvItem.itemName}" (ID: ${csvItem.itemId}) não encontrado. Pulando.`);
            continue;
        }

        if (!plansByDate[csvItem.date]) {
            const existingPlanForDate = strategy === 'merge' ? mealPlan.find(dp => dp.date === csvItem.date) : undefined;
            plansByDate[csvItem.date] = existingPlanForDate 
                ? JSON.parse(JSON.stringify(existingPlanForDate)) // Deep copy existing plan for merge
                : {
                    date: csvItem.date,
                    meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [] })),
                    totalNutrients: { ...DEFAULT_NUTRIENT_INFO }
                };
        }
        const plan = plansByDate[csvItem.date];
        let meal = plan.meals.find(m => m.mealType === csvItem.mealType);

        if (strategy === 'merge' && meal) { // If meal exists in merging plan, replace its items
            meal.items = []; 
        } else if (!meal) { // If meal does not exist, create it
            meal = { mealType: csvItem.mealType, items: [] };
            plan.meals.push(meal);
        }
        
        meal.items.push({
            id: generateId(),
            type: csvItem.itemType,
            itemId: actualItemId, 
            quantity: Number(csvItem.quantity),
            customName: csvItem.customName
        });
        itemsProcessed++;
    }

    let finalMealPlan = [...mealPlan];
    const importedDates = Object.keys(plansByDate);

    importedDates.forEach(date => {
        const existingPlanIndex = finalMealPlan.findIndex(dp => dp.date === date);
        if (existingPlanIndex > -1) {
            if (strategy === 'replace') {
                finalMealPlan[existingPlanIndex] = plansByDate[date]; // Fully replace the day
            } else { // merge (meal-level refinement applied above)
                finalMealPlan[existingPlanIndex] = plansByDate[date]; // The plansByDate[date] already contains merged meals
            }
        } else {
            finalMealPlan.push(plansByDate[date]);
        }
    });
    
    finalMealPlan = finalMealPlan.map(plan => {
        const updatedMeals = plan.meals.map(meal => ({
            ...meal,
            totalNutrients: calculateMealNutrients(meal, getIngredientById, getRecipeById)
        }));
        return {
            ...plan,
            meals: updatedMeals,
            totalNutrients: calculateDailyPlanNutrients({ ...plan, meals: updatedMeals }, getIngredientById, getRecipeById)
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setMealPlan(finalMealPlan);
    const batchResult: ImportBatch = {
        id: generateId(), filename, date: new Date().toISOString(), type: 'dietPlan',
        successCount: itemsProcessed, 
        errorCount: importErrors.length, 
        message: `Plano de dieta importado com estratégia '${strategy}'. ${itemsProcessed} itens processados.`,
        errors: importErrors.length > 0 ? importErrors : undefined
    };
    setImportBatches(prev => [batchResult, ...prev]);
    return batchResult;
  }, [getIngredientById, getRecipeById, ingredients, recipes, mealPlan]);

  const saveCurrentDietPlan = useCallback((name: string, description: string | undefined, startDate: string, endDate: string, tags?: string[], userNotes?: string): SavedDietPlan | undefined => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const dailyPlansToSave = mealPlan.filter(dp => {
        const planDate = new Date(dp.date + 'T00:00:00');
        return planDate >= start && planDate <= end;
    });

    if (dailyPlansToSave.length === 0) {
        return undefined; 
    }

    const newSavedPlan: SavedDietPlan = {
        id: generateId(),
        name,
        description,
        startDate,
        endDate,
        savedAt: new Date().toISOString(),
        dailyPlans: JSON.parse(JSON.stringify(dailyPlansToSave)), 
        tags,
        userNotes
    };
    setSavedDietPlans(prev => [newSavedPlan, ...prev].sort((a,b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    return newSavedPlan;
  }, [mealPlan]);

  const restoreSavedDietPlan = useCallback((planId: string) => {
    const planToRestore = savedDietPlans.find(p => p.id === planId);
    if (planToRestore) {
        setMealPlan(prevMealPlan => {
            let newMealPlan = [...prevMealPlan];
            const datesToRestore = planToRestore.dailyPlans.map(dp => dp.date);
            newMealPlan = newMealPlan.filter(dp => !datesToRestore.includes(dp.date));
            newMealPlan.push(...JSON.parse(JSON.stringify(planToRestore.dailyPlans)));
            return newMealPlan.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
    }
  }, [savedDietPlans]);

  const deleteSavedDietPlan = useCallback((planId: string) => {
    setSavedDietPlans(prev => prev.filter(p => p.id !== planId));
  }, []);

  const addSector = useCallback((sector: string) => {
    const trimmedSector = sector.trim();
    if (trimmedSector && !sectors.includes(trimmedSector)) {
      setSectors(prev => [...prev, trimmedSector].sort());
    }
  }, [sectors]);

  const deleteSector = useCallback((sectorToDelete: string) => {
    setSectors(prev => prev.filter(s => s !== sectorToDelete));
    setIngredients(prevIngs => prevIngs.map(ing => ing.setor === sectorToDelete ? {...ing, setor: 'Outros'} : ing));
    // TODO: Adjust sectorKeywordFrequency if a sector is deleted? Or leave keywords pointing to a non-existent sector?
    // For now, leave it. Suggestions for deleted sectors won't appear in dropdown.
  }, []);
  
  const updateSector = useCallback((oldSector: string, newSector: string) => {
    const trimmedNewSector = newSector.trim();
    if (!trimmedNewSector || oldSector === trimmedNewSector) return;

    setSectors(prev => {
        const updatedSectors = prev.map(s => s === oldSector ? trimmedNewSector : s);
        return [...new Set(updatedSectors)].sort();
    });
    setIngredients(prevIngs => prevIngs.map(ing => {
        if (ing.setor === oldSector) {
            updateSectorKeywordFrequencyInternal(ing.name, trimmedNewSector); // Update frequency for the new sector
            return {...ing, setor: trimmedNewSector};
        }
        return ing;
    }));
    // Update sectorKeywordFrequency:
    // For all keywords that pointed to oldSector, they should now point to newSector
    setSectorKeywordFrequency(prevFreq => {
        const newFreq = JSON.parse(JSON.stringify(prevFreq));
        Object.keys(newFreq).forEach(keyword => {
            if (newFreq[keyword][oldSector]) {
                newFreq[keyword][trimmedNewSector] = (newFreq[keyword][trimmedNewSector] || 0) + newFreq[keyword][oldSector];
                delete newFreq[keyword][oldSector];
            }
        });
        return newFreq;
    });

  }, [updateSectorKeywordFrequencyInternal]);

  // Shopping List Template Management
  const addShoppingListTemplate = useCallback((name: string, items: ManualShoppingListItem[]): ShoppingListTemplate => {
    const newTemplate: ShoppingListTemplate = {
        id: generateId(),
        name,
        items: JSON.parse(JSON.stringify(items)), // Deep copy
        createdAt: new Date().toISOString()
    };
    setShoppingListTemplates(prev => [newTemplate, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return newTemplate;
  }, []);

  const deleteShoppingListTemplate = useCallback((templateId: string) => {
    setShoppingListTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);

  const loadShoppingListTemplate = useCallback((templateId: string): ManualShoppingListItem[] | undefined => {
    const template = shoppingListTemplates.find(t => t.id === templateId);
    return template ? JSON.parse(JSON.stringify(template.items)) : undefined;
  }, [shoppingListTemplates]);

  // Unit Conversion Management
  const addUserConversion = useCallback((conversionData: Omit<UserUnitConversion, 'id'>): UserUnitConversion => {
    const newConversion: UserUnitConversion = { ...conversionData, id: generateId() };
    setUserConversions(prev => [...prev, newConversion]);
    return newConversion;
  }, []);

  const updateUserConversion = useCallback((updatedConversion: UserUnitConversion) => {
    setUserConversions(prev => prev.map(conv => conv.id === updatedConversion.id ? updatedConversion : conv));
  }, []);

  const deleteUserConversion = useCallback((conversionId: string) => {
    setUserConversions(prev => prev.filter(conv => conv.id !== conversionId));
  }, []);

  const getUserConversionsForIngredient = useCallback((ingredientId: string) => {
    return userConversions.filter(conv => conv.ingredientId === ingredientId);
  }, [userConversions]);

  // Smart Sector Suggestion
  const suggestSector = useCallback((ingredientName: string): string | undefined => {
    if (!ingredientName) return undefined;
    const keywords = extractKeywords(ingredientName);
    if (keywords.length === 0) return undefined;

    const sectorScores: Record<string, number> = {};
    keywords.forEach(kw => {
        if (sectorKeywordFrequency[kw]) {
            Object.entries(sectorKeywordFrequency[kw]).forEach(([sector, count]) => {
                sectorScores[sector] = (sectorScores[sector] || 0) + count;
            });
        }
    });

    if (Object.keys(sectorScores).length === 0) return undefined;

    // Find sector with highest score
    return Object.entries(sectorScores).reduce((best, current) => current[1] > best[1] ? current : best)[0];
  }, [sectorKeywordFrequency]);


  return (
    <DataContext.Provider value={{ 
        ingredients, recipes, mealPlan, importBatches, savedDietPlans, globalTargetNutrients, sectors, shoppingListTemplates, userConversions, sectorKeywordFrequency,
        addIngredient, updateIngredient, deleteIngredient, deleteAllIngredients, getIngredientById, updateIngredientsSectorBatch,
        addRecipe, updateRecipe, deleteRecipe, getRecipeById,
        getDailyPlan, updateDailyPlan, addItemToMeal, removeItemFromMeal, updateItemInMeal,
        getShoppingList,
        importIngredients, importRecipes, deleteImportBatch,
        exportDietToCsv, importDietFromCsv, saveCurrentDietPlan, restoreSavedDietPlan, deleteSavedDietPlan, updateGlobalTargetNutrients,
        addSector, deleteSector, updateSector,
        addShoppingListTemplate, deleteShoppingListTemplate, loadShoppingListTemplate,
        addUserConversion, updateUserConversion, deleteUserConversion, getUserConversionsForIngredient,
        suggestSector
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default useData;