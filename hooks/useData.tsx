import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    Ingredient, Recipe, DailyPlan, MealType, PlannedItem, ShoppingListItem, DataContextType, 
    CsvIngredient, CsvRecipe, RecipeIngredient, NutrientInfo, ImportBatch,
    SavedDietPlan, CsvDietPlanItem // New types
} from '../types';
import { generateId } from '../utils/idGenerator';
import { calculateRecipeNutrients, calculateMealNutrients, calculateDailyPlanNutrients, calculatePlannedItemNutrients } from '../utils/nutritionCalculator';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL, CSV_DIET_PLAN_HEADERS } from '../constants';
import Papa from 'papaparse';

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialIngredients: Ingredient[] = [
    { id: generateId(), name: 'Maçã', unit: 'unidade', setor: 'Hortifruti', Energia: 95, Proteína: 0.5, Carboidrato: 25, Lipídeos: 0.3, Colesterol: 0, FibraAlimentar: 4.4 },
    { id: generateId(), name: 'Banana', unit: 'unidade', setor: 'Hortifruti', Energia: 105, Proteína: 1.3, Carboidrato: 27, Lipídeos: 0.4, Colesterol: 0, FibraAlimentar: 3.1 },
    { id: generateId(), name: 'Peito de Frango Grelhado', unit: '100g', setor: 'Açougue', Energia: 165, Proteína: 31, Carboidrato: 0, Lipídeos: 3.6, Colesterol: 85, FibraAlimentar: 0 },
    { id: generateId(), name: 'Arroz Integral Cozido', unit: '100g', setor: 'Mercearia', Energia: 111, Proteína: 2.6, Carboidrato: 23, Lipídeos: 0.9, Colesterol: 0, FibraAlimentar: 1.8 },
    { id: generateId(), name: 'Ovo Cozido', unit: 'unidade', setor: 'Hortifruti', Energia: 78, Proteína: 6.3, Carboidrato: 0.6, Lipídeos: 5.3, Colesterol: 186, FibraAlimentar: 0 },
    { id: generateId(), name: 'Aveia em Flocos', unit: '100g', setor: 'Mercearia', Energia: 389, Proteína: 16.9, Carboidrato: 66.3, Lipídeos: 6.9, Colesterol: 0, FibraAlimentar: 10.6 },
    { id: generateId(), name: 'Leite Desnatado', unit: '100ml', setor: 'Laticínios', Energia: 36, Proteína: 3.4, Carboidrato: 5, Lipídeos: 0.1, Colesterol: 2, FibraAlimentar: 0 },
    { id: generateId(), name: 'Alface Crespa', unit: '100g', setor: 'Hortifruti', Energia: 15, Proteína: 1.4, Carboidrato: 2.9, Lipídeos: 0.2, Colesterol: 0, FibraAlimentar: 1.3 },
    { id: generateId(), name: 'Tomate Saladete', unit: '100g', setor: 'Hortifruti', Energia: 18, Proteína: 0.9, Carboidrato: 3.9, Lipídeos: 0.2, Colesterol: 0, FibraAlimentar: 1.2 },
    { id: generateId(), name: 'Azeite Extra Virgem', unit: '100ml', setor: 'Mercearia', Energia: 884, Proteína: 0, Carboidrato: 0, Lipídeos: 100, Colesterol: 0, FibraAlimentar: 0 },
];

const initialRecipes: Recipe[] = []; 

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


  useEffect(() => { localStorage.setItem('nutriplanner_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('nutriplanner_recipes', JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem('nutriplanner_mealPlan', JSON.stringify(mealPlan)); }, [mealPlan]);
  useEffect(() => { localStorage.setItem('nutriplanner_importBatches', JSON.stringify(importBatches)); }, [importBatches]);
  useEffect(() => { localStorage.setItem('nutriplanner_savedDietPlans', JSON.stringify(savedDietPlans)); }, [savedDietPlans]);
  useEffect(() => { localStorage.setItem('nutriplanner_globalTargetNutrients', JSON.stringify(globalTargetNutrients)); }, [globalTargetNutrients]);


  const getIngredientById = useCallback((id: string) => ingredients.find(ing => ing.id === id), [ingredients]);
  const getRecipeById = useCallback((id: string) => recipes.find(rec => rec.id === id), [recipes]);

  const addIngredient = useCallback((ingredientData: Omit<Ingredient, 'id'>): Ingredient => {
    const newIngredient: Ingredient = { 
        ...DEFAULT_NUTRIENT_INFO, 
        ...ingredientData, 
        id: generateId(),
        setor: ingredientData.setor || 'Outros' 
    };
    setIngredients(prev => [...prev, newIngredient]);
    return newIngredient;
  }, []);

  const updateIngredient = useCallback((updatedIngredient: Ingredient) => {
    setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? { ...updatedIngredient, setor: updatedIngredient.setor || 'Outros' } : ing));
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  }, []);
  
  const deleteAllIngredients = useCallback(() => {
    setIngredients([]);
  }, []);

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
      return [...prev, planWithNutrients];
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

  const getShoppingList = useCallback((startDate: string, endDate: string): ShoppingListItem[] => {
    const consolidated: { [ingredientId: string]: ShoppingListItem } = {};
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
                if (consolidated[ingredient.id]) {
                  consolidated[ingredient.id].totalQuantity += item.quantity;
                } else {
                  consolidated[ingredient.id] = {
                    ingredientId: ingredient.id,
                    ingredientName: ingredient.name,
                    totalQuantity: item.quantity,
                    unit: ingredient.unit,
                    purchased: false,
                    category: ingredient.setor || 'Outros',
                  };
                }
              }
            } else if (item.type === 'recipe') {
              const recipe = getRecipeById(item.itemId);
              if (recipe && recipe.servings > 0) {
                recipe.ingredients.forEach(recipeIng => {
                  const ingredient = getIngredientById(recipeIng.ingredientId);
                  if (ingredient) {
                    const quantityNeeded = (recipeIng.quantity / recipe.servings) * item.quantity;
                    if (consolidated[ingredient.id]) {
                      consolidated[ingredient.id].totalQuantity += quantityNeeded;
                    } else {
                      consolidated[ingredient.id] = {
                        ingredientId: ingredient.id,
                        ingredientName: ingredient.name,
                        totalQuantity: quantityNeeded,
                        unit: ingredient.unit,
                        purchased: false,
                        category: ingredient.setor || 'Outros',
                      };
                    }
                  }
                });
              }
            }
          });
        });
    });
    return Object.values(consolidated);
  }, [mealPlan, getIngredientById, getRecipeById]);

  const importIngredients = useCallback((ingredientsData: CsvIngredient[], filename: string): { successCount: number; errors: string[] } => {
    let currentSuccessCount = 0;
    const currentErrors: string[] = [];
    const newIngredientsForState: Ingredient[] = [];
    const successfullyImportedIds: string[] = [];

    ingredientsData.forEach((csvIng, index) => {
      if (!csvIng.nome || !csvIng.unidade) {
        currentErrors.push(`Linha ${index + 2}: Nome e Unidade são obrigatórios.`);
        return;
      }
      try {
        const newId = generateId();
        const ingredient: Omit<Ingredient, 'id'> = {
          name: csvIng.nome.trim(),
          unit: csvIng.unidade.trim(),
          setor: csvIng.setor?.trim() || 'Outros',
          Energia: parseFloat(csvIng.energia_kcal) || 0,
          Proteína: parseFloat(csvIng.proteina_g) || 0,
          Carboidrato: parseFloat(csvIng.carboidrato_g) || 0,
          Lipídeos: parseFloat(csvIng.lipideos_g) || 0,
          Colesterol: parseFloat(csvIng.colesterol_mg) || 0,
          FibraAlimentar: parseFloat(csvIng.fibra_alimentar_g) || 0,
        };
        newIngredientsForState.push({ ...DEFAULT_NUTRIENT_INFO, ...ingredient, id: newId });
        successfullyImportedIds.push(newId);
        currentSuccessCount++;
      } catch (e) {
        currentErrors.push(`Linha ${index + 2}: Erro ao processar dados - ${(e as Error).message}`);
      }
    });
    setIngredients(prev => [...prev, ...newIngredientsForState]);
    const newBatch: ImportBatch = { id: generateId(), filename, date: new Date().toISOString(), type: 'ingredients', successCount: currentSuccessCount, errorCount: currentErrors.length, importedItemIds: successfullyImportedIds, errors: currentErrors.length > 0 ? currentErrors : undefined };
    setImportBatches(prev => [...prev, newBatch]);
    return { successCount: currentSuccessCount, errors: currentErrors };
  }, []);
  
  const importRecipes = useCallback((recipesData: CsvRecipe[], filename: string): { successCount: number; errors: string[]; newIngredients: string[] } => {
    let currentSuccessCount = 0;
    const currentErrors: string[] = [];
    const newRecipesForState: Recipe[] = [];
    const createdIngredientNamesForBatch: string[] = [];
    const successfullyImportedRecipeIds: string[] = [];

    recipesData.forEach((csvRec, index) => {
      if (!csvRec.nome || !csvRec.ingredientes || !csvRec.porcoes) {
        currentErrors.push(`Linha ${index + 2}: Nome, Ingredientes e Porções são obrigatórios.`);
        return;
      }
      try {
        const recipeIngredients: RecipeIngredient[] = [];
        const ingredientStrings = csvRec.ingredientes.split(';').map(s => s.trim()).filter(s => s);
        let ingredientParsingError = false;
        
        for (const ingStr of ingredientStrings) {
          const parts = ingStr.split(':');
          if (parts.length !== 2) { currentErrors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Formato de ingrediente inválido '${ingStr}'. Use 'NomeIngrediente:Quantidade'.`); ingredientParsingError = true; continue; }
          const ingName = parts[0].trim();
          const quantity = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
          if (isNaN(quantity)) { currentErrors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Quantidade inválida para '${ingName}'.`); ingredientParsingError = true; continue; }
          let ingredient = ingredients.find(i => i.name.toLowerCase() === ingName.toLowerCase());
          if (!ingredient) { const newTempIng = addIngredient({ name: ingName, unit: 'unidade', setor: 'Outros', ...DEFAULT_NUTRIENT_INFO }); ingredient = newTempIng; createdIngredientNamesForBatch.push(ingName); }
          recipeIngredients.push({ ingredientId: ingredient.id, quantity });
        }
        if (ingredientParsingError) return; 
        const servings = parseInt(csvRec.porcoes, 10);
        if (isNaN(servings) || servings <= 0) { currentErrors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Número de porções inválido.`); return; }
        const totalNutrients = calculateRecipeNutrients(recipeIngredients, getIngredientById); 
        const nutrientsPerServing: NutrientInfo = servings > 0 ? { Energia: totalNutrients.Energia / servings, Proteína: totalNutrients.Proteína / servings, Carboidrato: totalNutrients.Carboidrato / servings, Lipídeos: totalNutrients.Lipídeos / servings, Colesterol: totalNutrients.Colesterol / servings, FibraAlimentar: totalNutrients.FibraAlimentar / servings, } : { ...DEFAULT_NUTRIENT_INFO };
        const newRecipeId = generateId();
        const newRecipe: Recipe = { id: newRecipeId, name: csvRec.nome.trim(), instructions: csvRec.modo_preparo.trim(), servings: servings, ingredients: recipeIngredients, imageUrl: `${PLACEHOLDER_IMAGE_URL}?id=${newRecipeId}`, ...nutrientsPerServing, totalNutrients: totalNutrients };
        newRecipesForState.push(newRecipe);
        successfullyImportedRecipeIds.push(newRecipeId);
        currentSuccessCount++;
      } catch (e) { currentErrors.push(`Linha ${index + 2}: Erro ao processar receita '${csvRec.nome}' - ${(e as Error).message}`); }
    });
    setRecipes(prev => [...prev, ...newRecipesForState]);
    const newBatch: ImportBatch = { id: generateId(), filename, date: new Date().toISOString(), type: 'recipes', successCount: currentSuccessCount, errorCount: currentErrors.length, importedItemIds: successfullyImportedRecipeIds, errors: currentErrors.length > 0 ? currentErrors : undefined,};
    setImportBatches(prev => [...prev, newBatch]);
    return { successCount: currentSuccessCount, errors: currentErrors, newIngredients: [...new Set(createdIngredientNamesForBatch)] };
  }, [ingredients, addIngredient, getIngredientById]);

  const deleteImportBatch = useCallback((batchId: string) => {
    const batchToDelete = importBatches.find(b => b.id === batchId);
    if (!batchToDelete) return;
    if (batchToDelete.type === 'ingredients') { setIngredients(prevIngs => prevIngs.filter(ing => !batchToDelete.importedItemIds.includes(ing.id))); } 
    else if (batchToDelete.type === 'recipes') { setRecipes(prevRecs => prevRecs.filter(rec => !batchToDelete.importedItemIds.includes(rec.id)));}
    setImportBatches(prevBatches => prevBatches.filter(b => b.id !== batchId));
  }, [importBatches]);

  // New Diet Plan Management Functions
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

  const importDietFromCsv = useCallback((csvDietItems: CsvDietPlanItem[]): { success: boolean; message: string } => {
    if (!csvDietItems || csvDietItems.length === 0) {
        return { success: false, message: "Nenhum item encontrado no CSV." };
    }
    // Group by date
    const plansByDate: { [date: string]: DailyPlan } = {};

    for (const csvItem of csvDietItems) {
        if (!csvItem.date || !csvItem.mealType || !csvItem.itemType || !csvItem.itemId || !csvItem.itemName || csvItem.quantity == null) {
            console.warn("Item CSV inválido ou incompleto:", csvItem);
            continue; 
        }

        // Ensure ingredient/recipe exists or handle gracefully (e.g., by name if ID is problematic)
        let baseItemExists = false;
        if (csvItem.itemType === 'ingredient') {
            baseItemExists = !!getIngredientById(csvItem.itemId) || !!ingredients.find(i => i.name === csvItem.itemName);
        } else {
            baseItemExists = !!getRecipeById(csvItem.itemId) || !!recipes.find(r => r.name === csvItem.itemName);
        }
        
        if (!baseItemExists) {
            // For now, skip if item not found. Could be enhanced to create placeholders.
            console.warn(`Item base "${csvItem.itemName}" (ID: ${csvItem.itemId}) não encontrado. Pulando.`);
            continue;
        }


        if (!plansByDate[csvItem.date]) {
            plansByDate[csvItem.date] = {
                date: csvItem.date,
                meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [] })),
                totalNutrients: { ...DEFAULT_NUTRIENT_INFO }
            };
        }
        const plan = plansByDate[csvItem.date];
        let meal = plan.meals.find(m => m.mealType === csvItem.mealType);
        if (!meal) {
            meal = { mealType: csvItem.mealType, items: [] };
            plan.meals.push(meal);
        }
        meal.items.push({
            id: generateId(),
            type: csvItem.itemType,
            itemId: csvItem.itemId, // Rely on this ID from export
            quantity: Number(csvItem.quantity),
            customName: csvItem.customName
        });
    }

    const newMealPlan = Object.values(plansByDate).map(plan => {
        const updatedMeals = plan.meals.map(meal => ({
            ...meal,
            totalNutrients: calculateMealNutrients(meal, getIngredientById, getRecipeById)
        }));
        return {
            ...plan,
            meals: updatedMeals,
            totalNutrients: calculateDailyPlanNutrients({ ...plan, meals: updatedMeals }, getIngredientById, getRecipeById)
        };
    });

    // Merge with existing meal plan or replace. For now, this replaces.
    // A merge strategy would be more complex (e.g., only update days present in CSV).
    setMealPlan(newMealPlan.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return { success: true, message: "Plano de dieta importado com sucesso. (Estratégia de substituição aplicada)" };
  }, [getIngredientById, getRecipeById, ingredients, recipes]);

  const saveCurrentDietPlan = useCallback((name: string, description: string | undefined, startDate: string, endDate: string) => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const dailyPlansToSave = mealPlan.filter(dp => {
        const planDate = new Date(dp.date + 'T00:00:00');
        return planDate >= start && planDate <= end;
    });

    if (dailyPlansToSave.length === 0) {
        alert("Nenhum dado no plano de refeições para o intervalo selecionado.");
        return;
    }

    const newSavedPlan: SavedDietPlan = {
        id: generateId(),
        name,
        description,
        startDate,
        endDate,
        savedAt: new Date().toISOString(),
        dailyPlans: JSON.parse(JSON.stringify(dailyPlansToSave)) // Deep copy
    };
    setSavedDietPlans(prev => [...prev, newSavedPlan].sort((a,b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
  }, [mealPlan]);

  const restoreSavedDietPlan = useCallback((planId: string) => {
    const planToRestore = savedDietPlans.find(p => p.id === planId);
    if (planToRestore) {
        // Simple replacement strategy for now. A merge strategy would be more complex.
        setMealPlan(JSON.parse(JSON.stringify(planToRestore.dailyPlans))); // Deep copy
    }
  }, [savedDietPlans]);

  const deleteSavedDietPlan = useCallback((planId: string) => {
    setSavedDietPlans(prev => prev.filter(p => p.id !== planId));
  }, []);

  return (
    <DataContext.Provider value={{ 
        ingredients, recipes, mealPlan, importBatches, savedDietPlans, globalTargetNutrients,
        addIngredient, updateIngredient, deleteIngredient, deleteAllIngredients, getIngredientById,
        addRecipe, updateRecipe, deleteRecipe, getRecipeById,
        getDailyPlan, updateDailyPlan, addItemToMeal, removeItemFromMeal, updateItemInMeal,
        getShoppingList,
        importIngredients, importRecipes, deleteImportBatch,
        exportDietToCsv, importDietFromCsv, saveCurrentDietPlan, restoreSavedDietPlan, deleteSavedDietPlan, updateGlobalTargetNutrients
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