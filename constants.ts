import { MealType, NutrientInfo, Recipe } from './types';

export const APP_NAME = "NutriPlanner";

export const MEAL_TYPES_ORDERED: MealType[] = [
  MealType.Breakfast,
  MealType.Lunch,
  MealType.Dinner,
  MealType.Snack,
];

export const DEFAULT_NUTRIENT_INFO: NutrientInfo = {
  Energia: 0,
  Proteína: 0,
  Carboidrato: 0,
  Lipídeos: 0,
  Colesterol: 0,
  FibraAlimentar: 0,
};

export const UNITS_OF_MEASUREMENT = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'unidade', label: 'Unidade(s)' },
  { value: 'xícara', label: 'Xícara(s)' },
  { value: 'colher de sopa', label: 'Colher(es) de Sopa' },
  { value: 'colher de chá', label: 'Colher(es) de Chá' },
  { value: 'fatia', label: 'Fatia(s)' },
  { value: 'pedaço', label: 'Pedaço(s)' },
  { value: 'a gosto', label: 'A gosto' },
  { value: '100g', label: '100 Gramas (100g)'},
  { value: '100ml', label: '100 Mililitros (100ml)'},
];

export const CSV_INGREDIENT_HEADERS = ['nome', 'unidade', 'setor', 'marca', 'energia_kcal', 'proteina_g', 'carboidrato_g', 'lipideos_g', 'colesterol_mg', 'fibra_alimentar_g', 'preco_medio', 'local_compra'];
export const CSV_RECIPE_HEADERS = ['nome', 'modo_preparo', 'ingredientes', 'porcoes', 'tempo_preparo', 'dificuldade'];

// New CSV Headers for Diet Plan
export const CSV_DIET_PLAN_HEADERS = [
  'date', 
  'mealType', 
  'itemType', 
  'itemId', 
  'itemName', 
  'quantity', 
  'unit', 
  'customName',
  'energia_kcal',
  'proteina_g',
  'carboidrato_g',
  'lipideos_g',
  'colesterol_mg',
  'fibra_alimentar_g'
];

export const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/400/300';
export const RECIPE_DIFFICULTY_LEVELS: Array<Recipe['difficulty']> = ['Fácil', 'Médio', 'Difícil'];