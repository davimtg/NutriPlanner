
import { Ingredient, Recipe, NutrientInfo, PlannedItem, Meal, DailyPlan, RecipeIngredient } from '../types';
import { DEFAULT_NUTRIENT_INFO } from '../constants';

export const sumNutrients = (items: NutrientInfo[]): NutrientInfo => {
  return items.reduce(
    (acc, item) => ({
      Energia: acc.Energia + (item?.Energia || 0),
      Proteína: acc.Proteína + (item?.Proteína || 0),
      Carboidrato: acc.Carboidrato + (item?.Carboidrato || 0),
      Lipídeos: acc.Lipídeos + (item?.Lipídeos || 0),
      Colesterol: acc.Colesterol + (item?.Colesterol || 0),
      FibraAlimentar: acc.FibraAlimentar + (item?.FibraAlimentar || 0),
    }),
    { ...DEFAULT_NUTRIENT_INFO }
  );
};

export const calculateRecipeNutrients = (
  recipeIngredients: RecipeIngredient[],
  getIngredientById: (id: string) => Ingredient | undefined
): NutrientInfo => {
  let totalNutrients = { ...DEFAULT_NUTRIENT_INFO };
  recipeIngredients.forEach(ri => {
    const ingredient = getIngredientById(ri.ingredientId);
    if (ingredient) {
      const multiplier = (ingredient.unit === 'g' || ingredient.unit === 'ml' || ingredient.unit === '100g' || ingredient.unit === '100ml') ? ri.quantity / 100 : ri.quantity;
      
      totalNutrients.Energia += (ingredient.Energia || 0) * multiplier;
      totalNutrients.Proteína += (ingredient.Proteína || 0) * multiplier;
      totalNutrients.Carboidrato += (ingredient.Carboidrato || 0) * multiplier;
      totalNutrients.Lipídeos += (ingredient.Lipídeos || 0) * multiplier;
      totalNutrients.Colesterol += (ingredient.Colesterol || 0) * multiplier;
      totalNutrients.FibraAlimentar += (ingredient.FibraAlimentar || 0) * multiplier;
    }
  });
  return totalNutrients;
};

export const calculateRecipeNutrientsPerServing = (recipe: Recipe, getIngredientById: (id: string) => Ingredient | undefined): NutrientInfo => {
  if (!recipe.ingredients || recipe.ingredients.length === 0 || recipe.servings <= 0) {
    return { ...DEFAULT_NUTRIENT_INFO };
  }
  const totalNutrients = calculateRecipeNutrients(recipe.ingredients, getIngredientById);
  return {
    Energia: totalNutrients.Energia / recipe.servings,
    Proteína: totalNutrients.Proteína / recipe.servings,
    Carboidrato: totalNutrients.Carboidrato / recipe.servings,
    Lipídeos: totalNutrients.Lipídeos / recipe.servings,
    Colesterol: totalNutrients.Colesterol / recipe.servings,
    FibraAlimentar: totalNutrients.FibraAlimentar / recipe.servings,
  };
};


export const calculatePlannedItemNutrients = (
  item: PlannedItem,
  getIngredientById: (id: string) => Ingredient | undefined,
  getRecipeById: (id: string) => Recipe | undefined
): NutrientInfo => {
  if (item.type === 'ingredient') {
    const ingredient = getIngredientById(item.itemId);
    if (!ingredient) return { ...DEFAULT_NUTRIENT_INFO };
    const multiplier = (ingredient.unit === 'g' || ingredient.unit === 'ml' || ingredient.unit === '100g' || ingredient.unit === '100ml') ? item.quantity / 100 : item.quantity;
    return {
      Energia: (ingredient.Energia || 0) * multiplier,
      Proteína: (ingredient.Proteína || 0) * multiplier,
      Carboidrato: (ingredient.Carboidrato || 0) * multiplier,
      Lipídeos: (ingredient.Lipídeos || 0) * multiplier,
      Colesterol: (ingredient.Colesterol || 0) * multiplier,
      FibraAlimentar: (ingredient.FibraAlimentar || 0) * multiplier,
    };
  } else if (item.type === 'recipe') {
    const recipe = getRecipeById(item.itemId);
    if (!recipe || !recipe.totalNutrients || recipe.servings <= 0) return { ...DEFAULT_NUTRIENT_INFO };
    // recipe.totalNutrients is for the whole recipe
    // item.quantity is number of servings consumed
    const nutrientsPerServing: NutrientInfo = {
        Energia: recipe.totalNutrients.Energia / recipe.servings,
        Proteína: recipe.totalNutrients.Proteína / recipe.servings,
        Carboidrato: recipe.totalNutrients.Carboidrato / recipe.servings,
        Lipídeos: recipe.totalNutrients.Lipídeos / recipe.servings,
        Colesterol: recipe.totalNutrients.Colesterol / recipe.servings,
        FibraAlimentar: recipe.totalNutrients.FibraAlimentar / recipe.servings,
    };
    return {
      Energia: nutrientsPerServing.Energia * item.quantity,
      Proteína: nutrientsPerServing.Proteína * item.quantity,
      Carboidrato: nutrientsPerServing.Carboidrato * item.quantity,
      Lipídeos: nutrientsPerServing.Lipídeos * item.quantity,
      Colesterol: nutrientsPerServing.Colesterol * item.quantity,
      FibraAlimentar: nutrientsPerServing.FibraAlimentar * item.quantity,
    };
  }
  return { ...DEFAULT_NUTRIENT_INFO };
};

export const calculateMealNutrients = (
  meal: Meal,
  getIngredientById: (id: string) => Ingredient | undefined,
  getRecipeById: (id: string) => Recipe | undefined
): NutrientInfo => {
  const itemNutrients = meal.items.map(item => calculatePlannedItemNutrients(item, getIngredientById, getRecipeById));
  return sumNutrients(itemNutrients);
};

export const calculateDailyPlanNutrients = (
  plan: DailyPlan,
  getIngredientById: (id: string) => Ingredient | undefined,
  getRecipeById: (id: string) => Recipe | undefined
): NutrientInfo => {
  const mealNutrients = plan.meals.map(meal => calculateMealNutrients(meal, getIngredientById, getRecipeById));
  return sumNutrients(mealNutrients);
};
