
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ingredient, Recipe, DailyPlan, MealType, PlannedItem, ShoppingListItem, DataContextType, CsvIngredient, CsvRecipe, RecipeIngredient, NutrientInfo } from '../types';
import { generateId } from '../utils/idGenerator';
import { calculateRecipeNutrients, calculateMealNutrients, calculateDailyPlanNutrients } from '../utils/nutritionCalculator';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL } from '../constants';

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialIngredients: Ingredient[] = [
    { id: generateId(), name: 'Maçã', unit: 'unidade', Energia: 95, Proteína: 0.5, Carboidrato: 25, Lipídeos: 0.3, Colesterol: 0, FibraAlimentar: 4.4 },
    { id: generateId(), name: 'Banana', unit: 'unidade', Energia: 105, Proteína: 1.3, Carboidrato: 27, Lipídeos: 0.4, Colesterol: 0, FibraAlimentar: 3.1 },
    { id: generateId(), name: 'Peito de Frango Grelhado', unit: '100g', Energia: 165, Proteína: 31, Carboidrato: 0, Lipídeos: 3.6, Colesterol: 85, FibraAlimentar: 0 },
    { id: generateId(), name: 'Arroz Integral Cozido', unit: '100g', Energia: 111, Proteína: 2.6, Carboidrato: 23, Lipídeos: 0.9, Colesterol: 0, FibraAlimentar: 1.8 },
    { id: generateId(), name: 'Ovo Cozido', unit: 'unidade', Energia: 78, Proteína: 6.3, Carboidrato: 0.6, Lipídeos: 5.3, Colesterol: 186, FibraAlimentar: 0 },
    { id: generateId(), name: 'Aveia em Flocos', unit: '100g', Energia: 389, Proteína: 16.9, Carboidrato: 66.3, Lipídeos: 6.9, Colesterol: 0, FibraAlimentar: 10.6 },
    { id: generateId(), name: 'Leite Desnatado', unit: '100ml', Energia: 36, Proteína: 3.4, Carboidrato: 5, Lipídeos: 0.1, Colesterol: 2, FibraAlimentar: 0 },
    { id: generateId(), name: 'Alface Crespa', unit: '100g', Energia: 15, Proteína: 1.4, Carboidrato: 2.9, Lipídeos: 0.2, Colesterol: 0, FibraAlimentar: 1.3 },
    { id: generateId(), name: 'Tomate Saladete', unit: '100g', Energia: 18, Proteína: 0.9, Carboidrato: 3.9, Lipídeos: 0.2, Colesterol: 0, FibraAlimentar: 1.2 },
    { id: generateId(), name: 'Azeite Extra Virgem', unit: '100ml', Energia: 884, Proteína: 0, Carboidrato: 0, Lipídeos: 100, Colesterol: 0, FibraAlimentar: 0 },
];

const initialRecipes: Recipe[] = []; // Will be populated by addRecipe, which calculates nutrients


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

  useEffect(() => {
    localStorage.setItem('nutriplanner_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('nutriplanner_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('nutriplanner_mealPlan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  const getIngredientById = useCallback((id: string) => ingredients.find(ing => ing.id === id), [ingredients]);
  
  const getRecipeById = useCallback((id: string) => recipes.find(rec => rec.id === id), [recipes]);

  const addIngredient = useCallback((ingredientData: Omit<Ingredient, 'id'>): Ingredient => {
    const newIngredient: Ingredient = { ...DEFAULT_NUTRIENT_INFO, ...ingredientData, id: generateId() };
    setIngredients(prev => [...prev, newIngredient]);
    return newIngredient;
  }, []);

  const updateIngredient = useCallback((updatedIngredient: Ingredient) => {
    setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing));
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
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
      ...nutrientsPerServing, // These are per serving
      totalNutrients: totalNutrients, // This is for the whole recipe
      imageUrl: recipeData.imageUrl || `${PLACEHOLDER_IMAGE_URL}?=${generateId()}`,
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  }, [getIngredientById]);

  const updateRecipe = useCallback((updatedRecipeData: Recipe) => {
    // Recalculate nutrients before updating
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
    const list: ShoppingListItem[] = [];
    const consolidated: { [ingredientId: string]: ShoppingListItem } = {};

    const start = new Date(startDate + 'T00:00:00'); 
    const end = new Date(endDate + 'T23:59:59');

    mealPlan.forEach(dailyPlan => {
      const planDate = new Date(dailyPlan.date + 'T00:00:00');
      if (planDate >= start && planDate <= end) {
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
                  };
                }
              }
            } else if (item.type === 'recipe') {
              const recipe = getRecipeById(item.itemId);
              if (recipe) {
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
                      };
                    }
                  }
                });
              }
            }
          });
        });
      }
    });
    return Object.values(consolidated);
  }, [mealPlan, getIngredientById, getRecipeById]);

  const importIngredients = useCallback((ingredientsData: CsvIngredient[]): { successCount: number; errors: string[] } => {
    let successCount = 0;
    const errors: string[] = [];
    const newIngredients: Ingredient[] = [];

    ingredientsData.forEach((csvIng, index) => {
      if (!csvIng.nome || !csvIng.unidade) {
        errors.push(`Linha ${index + 2}: Nome e Unidade são obrigatórios.`);
        return;
      }
      try {
        const ingredient: Omit<Ingredient, 'id'> = {
          name: csvIng.nome.trim(),
          unit: csvIng.unidade.trim(),
          Energia: parseFloat(csvIng.energia_kcal) || 0,
          Proteína: parseFloat(csvIng.proteina_g) || 0,
          Carboidrato: parseFloat(csvIng.carboidrato_g) || 0,
          Lipídeos: parseFloat(csvIng.lipideos_g) || 0,
          Colesterol: parseFloat(csvIng.colesterol_mg) || 0,
          FibraAlimentar: parseFloat(csvIng.fibra_alimentar_g) || 0,
        };
        newIngredients.push({ ...DEFAULT_NUTRIENT_INFO, ...ingredient, id: generateId() });
        successCount++;
      } catch (e) {
        errors.push(`Linha ${index + 2}: Erro ao processar dados - ${(e as Error).message}`);
      }
    });

    setIngredients(prev => [...prev, ...newIngredients]);
    return { successCount, errors };
  }, []);
  
  const importRecipes = useCallback((recipesData: CsvRecipe[]): { successCount: number; errors: string[]; newIngredients: string[] } => {
    let successCount = 0;
    const errors: string[] = [];
    const newRecipesInternal: Recipe[] = [];
    const createdIngredientNames: string[] = [];

    recipesData.forEach((csvRec, index) => {
      if (!csvRec.nome || !csvRec.ingredientes || !csvRec.porcoes) {
        errors.push(`Linha ${index + 2}: Nome, Ingredientes e Porções são obrigatórios.`);
        return;
      }
      try {
        const recipeIngredients: RecipeIngredient[] = [];
        const ingredientStrings = csvRec.ingredientes.split(';').map(s => s.trim()).filter(s => s);
        
        for (const ingStr of ingredientStrings) {
          const parts = ingStr.split(':');
          if (parts.length !== 2) {
            errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Formato de ingrediente inválido '${ingStr}'. Use 'NomeIngrediente:Quantidade'.`);
            continue;
          }
          const ingName = parts[0].trim();
          const quantity = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
          
          if (isNaN(quantity)) {
             errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Quantidade inválida para '${ingName}'.`);
             continue;
          }

          let ingredient = ingredients.find(i => i.name.toLowerCase() === ingName.toLowerCase());
          if (!ingredient) {
            ingredient = addIngredient({
              name: ingName,
              unit: 'unidade', 
              ...DEFAULT_NUTRIENT_INFO 
            });
            createdIngredientNames.push(ingName);
          }
          recipeIngredients.push({ ingredientId: ingredient.id, quantity });
        }

        if (errors.length > 0 && errors.some(e => e.startsWith(`Linha ${index + 2}`))) {
            return;
        }

        const servings = parseInt(csvRec.porcoes, 10);
        if (isNaN(servings) || servings <= 0) {
          errors.push(`Linha ${index + 2}, Receita '${csvRec.nome}': Número de porções inválido.`);
          return;
        }

        const totalNutrients = calculateRecipeNutrients(recipeIngredients, getIngredientById);
        const nutrientsPerServing: NutrientInfo = servings > 0 ? {
            Energia: totalNutrients.Energia / servings,
            Proteína: totalNutrients.Proteína / servings,
            Carboidrato: totalNutrients.Carboidrato / servings,
            Lipídeos: totalNutrients.Lipídeos / servings,
            Colesterol: totalNutrients.Colesterol / servings,
            FibraAlimentar: totalNutrients.FibraAlimentar / servings,
        } : { ...DEFAULT_NUTRIENT_INFO };

        const newRecipe: Recipe = {
          id: generateId(),
          name: csvRec.nome.trim(),
          instructions: csvRec.modo_preparo.trim(),
          servings: servings,
          ingredients: recipeIngredients,
          imageUrl: `${PLACEHOLDER_IMAGE_URL}?id=${generateId()}`,
          ...nutrientsPerServing,
          totalNutrients: totalNutrients
        };
        newRecipesInternal.push(newRecipe);
        successCount++;
      } catch (e) {
        errors.push(`Linha ${index + 2}: Erro ao processar receita '${csvRec.nome}' - ${(e as Error).message}`);
      }
    });

    setRecipes(prev => [...prev, ...newRecipesInternal]);
    return { successCount, errors, newIngredients: [...new Set(createdIngredientNames)] };
  }, [ingredients, addIngredient, getIngredientById]);


  return (
    <DataContext.Provider value={{ 
        ingredients, recipes, mealPlan, 
        addIngredient, updateIngredient, deleteIngredient, getIngredientById,
        addRecipe, updateRecipe, deleteRecipe, getRecipeById,
        getDailyPlan, updateDailyPlan, addItemToMeal, removeItemFromMeal, updateItemInMeal,
        getShoppingList,
        importIngredients, importRecipes
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
