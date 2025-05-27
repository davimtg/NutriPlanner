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
  setor?: string; 
}

export interface RecipeIngredient {
  ingredientId: string; 
  quantity: number; 
}

export interface Recipe extends NutrientInfo { 
  id: string;
  name:string;
  instructions: string;
  servings: number; 
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  totalNutrients?: NutrientInfo; 
}

export enum MealType {
  Breakfast = 'Café da Manhã',
  Lunch = 'Almoço',
  Dinner = 'Jantar',
  Snack = 'Lanche'
}

export interface PlannedItem {
  id: string; 
  type: 'ingredient' | 'recipe';
  itemId: string; 
  quantity: number; 
  customName?: string; 
}

export interface Meal {
  mealType: MealType;
  items: PlannedItem[];
  totalNutrients?: NutrientInfo;
}

export interface DailyPlan {
  date: string; 
  meals: Meal[];
  totalNutrients?: NutrientInfo;
}

export interface ShoppingListItem {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  purchased: boolean;
  category?: string; 
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
  setor?: string; 
}

export interface CsvRecipe {
  nome: string;
  modo_preparo: string;
  ingredientes: string; 
  porcoes: string; 
}

export interface ImportBatch {
  id: string;
  filename: string;
  date: string; 
  type: 'ingredients' | 'recipes';
  successCount: number;
  errorCount: number;
  importedItemIds: string[]; 
  errors?: string[]; 
}

// New interface for CSV Diet Plan Item
export interface CsvDietPlanItem {
  date: string;
  mealType: MealType;
  itemType: 'ingredient' | 'recipe';
  itemId: string; // ID of ingredient or recipe
  itemName: string; // Name for easier matching during import if ID is lost or for human readability
  quantity: number;
  unit: string; // Unit for the planned item (e.g., g, ml, porção)
  customName?: string;
  // Optional: Include per-item nutrients if needed for the CSV
  energia_kcal?: number;
  proteina_g?: number;
  carboidrato_g?: number;
  lipideos_g?: number;
  colesterol_mg?: number;
  fibra_alimentar_g?: number;
}

// New interface for Saved Diet Plan
export interface SavedDietPlan {
  id: string;
  name: string;
  description?: string;
  startDate: string; 
  endDate: string; 
  savedAt: string; // ISO string date
  dailyPlans: DailyPlan[]; // The actual meal plan data for the specified period
}


export interface DataContextType {
  ingredients: Ingredient[];
  recipes: Recipe[];
  mealPlan: DailyPlan[];
  importBatches: ImportBatch[];
  savedDietPlans: SavedDietPlan[]; // New state for saved diet plans
  globalTargetNutrients: NutrientInfo; // New state for global targets

  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Ingredient;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  deleteAllIngredients: () => void;
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
  
  importIngredients: (ingredientsData: CsvIngredient[], filename: string) => { successCount: number; errors: string[] };
  importRecipes: (recipesData: CsvRecipe[], filename: string) => { successCount: number; errors: string[]; newIngredients: string[] };
  deleteImportBatch: (batchId: string) => void;

  // New functions for diet plan management
  exportDietToCsv: (startDate: string, endDate: string) => string; // Returns CSV string
  importDietFromCsv: (csvDietItems: CsvDietPlanItem[]) => { success: boolean; message: string };
  saveCurrentDietPlan: (name: string, description: string | undefined, startDate: string, endDate: string) => void;
  restoreSavedDietPlan: (planId: string) => void;
  deleteSavedDietPlan: (planId: string) => void;
  updateGlobalTargetNutrients: (targets: NutrientInfo) => void;
}