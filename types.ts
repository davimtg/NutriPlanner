
export interface NutrientInfo {
  Energia: number; // Kcal
  Proteína: number; // g
  Carboidrato: number; // g
  Lipídeos: number; // g
  Colesterol: number; // mg
  FibraAlimentar: number; // g
}

export interface Ingredient extends NutrientInfo {
  id: string;
  name: string;
  unit: string; // e.g., 'g', 'ml', 'unidade'
}

export interface RecipeIngredient {
  ingredientId: string; // ID of an existing Ingredient
  quantity: number; // Quantity of the ingredient in its defined unit
}

export interface Recipe extends NutrientInfo { // NutrientInfo here is per serving
  id: string;
  name:string;
  instructions: string;
  servings: number; // Number of portions this recipe yields
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  totalNutrients?: NutrientInfo; // Total for the whole recipe
}

export enum MealType {
  Breakfast = 'Café da Manhã',
  Lunch = 'Almoço',
  Dinner = 'Jantar',
  Snack = 'Lanche'
}

export interface PlannedItem {
  id: string; // Unique ID for this planned item instance
  type: 'ingredient' | 'recipe';
  itemId: string; // ID of Ingredient or Recipe
  quantity: number; // For ingredients: actual quantity. For recipes: number of servings.
  customName?: string; // e.g. "1 Maçã Grande" for an ingredient, or "Salada do Chef" for a recipe.
}

export interface Meal {
  mealType: MealType;
  items: PlannedItem[];
  totalNutrients?: NutrientInfo;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  totalNutrients?: NutrientInfo;
}

export interface ShoppingListItem {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  purchased: boolean;
  category?: string; // Optional: for grouping
}

export interface CsvIngredient {
  nome: string;
  unidade: string;
  energia_kcal: string;
  proteina_g: string;
  carboidrato_g: string;
  lipideos_g: string;
  colesterol_mg: string;
  fibra_alimentar_g: string;
}

export interface CsvRecipe {
  nome: string;
  modo_preparo: string;
  ingredientes: string; // "Banana:1;Ovo:2;Aveia:30g"
  porcoes: string; // Parsed as number later
}

export interface DataContextType {
  ingredients: Ingredient[];
  recipes: Recipe[];
  mealPlan: DailyPlan[];
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Ingredient;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  getIngredientById: (id: string) => Ingredient | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | keyof NutrientInfo>) => Recipe;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  getDailyPlan: (date: string) => DailyPlan | undefined;
  updateDailyPlan: (plan: DailyPlan) => void;
  addItemToMeal: (date: string, mealType: MealType, item: Omit<PlannedItem, 'id'>) => void;
  removeItemFromMeal: (date: string, mealType: MealType, itemId: string) => void;
  updateItemInMeal: (date: string, mealType: MealType, item: PlannedItem) => void;
  getShoppingList: (startDate: string, endDate: string) => ShoppingListItem[];
  importIngredients: (ingredientsData: CsvIngredient[]) => { successCount: number; errors: string[] };
  importRecipes: (recipesData: CsvRecipe[]) => { successCount: number; errors: string[]; newIngredients: string[] };
}
