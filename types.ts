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
  brand?: string; 
  averagePrice?: number; // New: Preço médio
  purchaseLocation?: string; // New: Local de compra comum
}

export interface RecipeIngredient {
  ingredientId: string; 
  quantity: number; 
}

export type RecipeDifficulty = 'Fácil' | 'Médio' | 'Difícil';

export interface Recipe extends NutrientInfo { 
  id: string;
  name:string;
  instructions: string;
  servings: number; 
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  totalNutrients?: NutrientInfo; 
  prepTime?: string; 
  difficulty?: RecipeDifficulty; 
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

// New: For items added manually to shopping list
export interface ManualShoppingListItem {
  id: string;
  name: string;
  purchased: boolean;
  category: string; 
}

// New: Shopping List Template
export interface ShoppingListTemplate {
  id: string;
  name: string;
  items: ManualShoppingListItem[];
  createdAt: string; // ISO string date
}


export interface CsvIngredient {
  nome: string;
  unidade: string;
  setor?: string;
  marca?: string; 
  energia_kcal: string;
  proteina_g: string;
  carboidrato_g: string;
  lipideos_g: string;
  colesterol_mg: string;
  fibra_alimentar_g: string;
  preco_medio?: string; // New for CSV
  local_compra?: string; // New for CSV
}

export interface CsvRecipe {
  nome: string;
  modo_preparo: string;
  ingredientes: string; 
  porcoes: string; 
  tempo_preparo?: string; 
  dificuldade?: string; // New for CSV
}

export interface ImportBatch {
  id: string;
  filename: string;
  date: string; 
  type: 'ingredients' | 'recipes' | 'dietPlan'; 
  successCount: number;
  errorCount: number;
  importedItemIds?: string[]; 
  errors?: string[]; 
  message?: string; 
}

export interface CsvDietPlanItem {
  date: string;
  mealType: MealType;
  itemType: 'ingredient' | 'recipe';
  itemId: string; 
  itemName: string; 
  quantity: number;
  unit: string; 
  customName?: string;
  energia_kcal?: number;
  proteina_g?: number;
  carboidrato_g?: number;
  lipideos_g?: number;
  colesterol_mg?: number;
  fibra_alimentar_g?: number;
}

export interface SavedDietPlan {
  id: string;
  name: string;
  description?: string;
  startDate: string; 
  endDate: string; 
  savedAt: string; 
  dailyPlans: DailyPlan[]; 
  tags?: string[]; 
  userNotes?: string; 
}

export interface UserUnitConversion {
  id: string;
  ingredientId: string;
  quantityA: number;
  unitA: string;
  quantityB: number;
  unitB: string;
}

export interface DataContextType {
  ingredients: Ingredient[];
  recipes: Recipe[];
  mealPlan: DailyPlan[];
  importBatches: ImportBatch[];
  savedDietPlans: SavedDietPlan[]; 
  globalTargetNutrients: NutrientInfo;
  sectors: string[]; 
  shoppingListTemplates: ShoppingListTemplate[]; 
  userConversions: UserUnitConversion[]; // New for unit conversions
  sectorKeywordFrequency: Record<string, Record<string, number>>; // For smart sector suggestions

  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Ingredient;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  deleteAllIngredients: () => void;
  getIngredientById: (id: string) => Ingredient | undefined;
  updateIngredientsSectorBatch: (ingredientIds: string[], newSector: string) => void; 
  
  addRecipe: (recipe: Omit<Recipe, 'id' | keyof NutrientInfo | 'totalNutrients'>) => Recipe;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  
  getDailyPlan: (date: string) => DailyPlan | undefined;
  updateDailyPlan: (plan: DailyPlan) => void;
  addItemToMeal: (date: string, mealType: MealType, item: Omit<PlannedItem, 'id'>) => void;
  removeItemFromMeal: (date: string, mealType: MealType, itemId: string) => void;
  updateItemInMeal: (date: string, mealType: MealType, item: PlannedItem) => void;
  
  getShoppingList: (startDate: string, endDate: string) => ShoppingListItem[];
  
  importIngredients: (ingredientsData: CsvIngredient[], filename: string) => ImportBatch;
  importRecipes: (recipesData: CsvRecipe[], filename: string) => ImportBatch;
  deleteImportBatch: (batchId: string) => void;

  exportDietToCsv: (startDate: string, endDate: string) => string; 
  importDietFromCsv: (csvDietItems: CsvDietPlanItem[], strategy: 'replace' | 'merge', filename: string) => ImportBatch; 
  saveCurrentDietPlan: (name: string, description: string | undefined, startDate: string, endDate: string, tags?: string[], userNotes?: string) => SavedDietPlan | undefined; 
  restoreSavedDietPlan: (planId: string) => void;
  deleteSavedDietPlan: (planId: string) => void;
  updateGlobalTargetNutrients: (targets: NutrientInfo) => void;

  addSector: (sector: string) => void;
  deleteSector: (sector: string) => void;
  updateSector: (oldSector: string, newSector: string) => void; 
  
  addShoppingListTemplate: (name: string, items: ManualShoppingListItem[]) => ShoppingListTemplate;
  deleteShoppingListTemplate: (templateId: string) => void;
  loadShoppingListTemplate: (templateId: string) => ManualShoppingListItem[] | undefined;

  // New for unit conversions
  addUserConversion: (conversion: Omit<UserUnitConversion, 'id'>) => UserUnitConversion;
  updateUserConversion: (conversion: UserUnitConversion) => void;
  deleteUserConversion: (conversionId: string) => void;
  getUserConversionsForIngredient: (ingredientId: string) => UserUnitConversion[];

  // New for smart sector suggestions
  suggestSector: (ingredientName: string) => string | undefined;
  // updateSectorKeywordFrequency is internal to useData for now
}